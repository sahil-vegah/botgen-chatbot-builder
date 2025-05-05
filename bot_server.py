import os
import asyncio
import psutil
import requests
import uuid
import re
from xml.etree import ElementTree
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Request
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from supabase.client import Client, create_client
from groq import Groq
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_community.llms import Ollama
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from functools import partial
from bs4 import BeautifulSoup

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "llama2:latest")
MARKDOWN_DIR = "crawled_content"

# Create directory for markdown files if it doesn't exist
os.makedirs(MARKDOWN_DIR, exist_ok=True)

# Initialize Groq client
groq_client = Groq()

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Change to False when using "*" for origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/assets", StaticFiles(directory="assets"), name="assets")
# Mount JS files
app.mount("/assets/js", StaticFiles(directory="assets/js"), name="js")
# Mount CSS files
app.mount("/assets/css", StaticFiles(directory="assets/css"), name="css")
# Mount images
app.mount("/assets/images", StaticFiles(directory="assets/images"), name="images")

# Pydantic models
class CrawlRequest(BaseModel):
    url: str
    max_concurrent: int = 3

class ChatRequest(BaseModel):
    table_name: str
    question: str
    model_type: str = "Groq"
    is_voice: bool = False
    voice: str = "Fritz-PlayAI"
    temperature: float = 0.1

class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

# Helper functions for audio
def transcribe_audio(client, audio_file):
    with open(audio_file, "rb") as f:
        transcript = client.audio.transcriptions.create(model="whisper-large-v3-turbo", file=f)
    return transcript.text

async def transcribe_audio_async(client, audio_file):
    print("--- Entering transcribe_audio_async ---") # Add log
    loop = asyncio.get_running_loop()
    # Use partial to pass arguments to the function running in the executor
    func = partial(transcribe_audio, client, audio_file)
    # Run the original blocking transcribe_audio function in the default thread pool executor
    text = await loop.run_in_executor(None, func)
    print("--- Exiting transcribe_audio_async ---") # Add log
    print(f"Transcribed Text Length: {len(text)}") # Log length

    return text

def text_to_audio(client, text, audio_path, voice="Fritz-PlayAI"):
    response = client.audio.speech.create(model="playai-tts", voice=voice, input=text)
    response.write_to_file(audio_path)

# New routes for audio handling
@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        # Save the uploaded file
        audio_path = "audio.mp3"
        with open(audio_path, "wb") as f:
            f.write(await file.read())

        # Transcribe the audio
        text = await transcribe_audio_async(groq_client, audio_path)


        return JSONResponse(
            content={
                "success": True,
                "message": "Audio transcribed successfully",
                "data": {"text": text}
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error transcribing audio: {str(e)}"}
        )

@app.get("/api/audio/{filename}")
async def get_audio(filename: str):
    try:
        return FileResponse(
            filename,
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": f"Audio file not found: {str(e)}"}
        )

# Helper functions
def sanitize_table_name(url):
    domain = url.lower().replace('https://', '').replace('http://', '').replace('www.', '')
    domain = domain.split('/')[0]
    table_name = re.sub(r'[^a-z0-9]', '_', domain)
    if not table_name[0].isalpha():
        table_name = 'site_' + table_name
    table_name = table_name[:55]
    return f"{table_name}"

async def check_table_exists(supabase_client, table_name):
    try:
        # Try to select from the table
        response = supabase_client.rpc("check_table_exists", {"input_table_name": table_name}).execute()
        table_exists = response.data if response.data is not None else False
        return table_exists
    except Exception as e:
        print(f"Error checking table existence: {e}")
        return False

def list_urls(url):
    def fetch_sitemap_urls(sitemap_url, visited_urls):
        if sitemap_url in visited_urls:
            return []

        visited_urls.add(sitemap_url)

        try:
            print(f"Attempting to fetch sitemap from: {sitemap_url}")
            response = requests.get(sitemap_url, timeout=10)
            if response.status_code != 200:
                print(f"Failed to fetch sitemap from {sitemap_url}: Status code {response.status_code}")
                return []
                
            try:
                root = ElementTree.fromstring(response.content)
                namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
                urls = [loc.text for loc in root.findall('.//ns:url/ns:loc', namespace)]
                sitemap_urls = [loc.text for loc in root.findall('.//ns:sitemap/ns:loc', namespace)]

                print(f"Found {len(urls)} URLs and {len(sitemap_urls)} sitemaps in {sitemap_url}")

                for sitemap in sitemap_urls:
                    urls.extend(fetch_sitemap_urls(sitemap, visited_urls))

                return urls
            except ElementTree.ParseError as e:
                print(f"XML parsing error for {sitemap_url}: {e}")
                return []
        except Exception as e:
            print(f"Error fetching sitemap from {sitemap_url}: {e}")
            return []

    # Try standard sitemap locations
    sitemap_locations = [
        url.rstrip("/") + "/sitemap.xml",
        url.rstrip("/") + "/sitemap_index.xml",
        url.rstrip("/") + "/sitemap/sitemap.xml"
    ]
    
    visited_urls = set()
    all_urls = []
    
    # Try all possible sitemap locations
    for sitemap_url in sitemap_locations:
        urls = fetch_sitemap_urls(sitemap_url, visited_urls)
        if urls:
            all_urls.extend(urls)
    
    # If no URLs found from sitemaps, use the main URL
    if all_urls:
        print(f"Total URLs found from sitemaps: {len(all_urls)}")
        return all_urls
    else:
        print(f"No sitemaps found. Using main URL: {url}")
        return [url]

async def create_supabase_table(supabase_client, table_name):
    create_table_query = f"""
    CREATE TABLE IF NOT EXISTS {table_name} (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content text,
      metadata jsonb,
      embedding vector(1536)
    );
    GRANT ALL PRIVILEGES ON TABLE {table_name} TO postgres;
    GRANT ALL PRIVILEGES ON TABLE {table_name} TO service_role;
    ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
    CREATE POLICY full_access ON {table_name}
    FOR ALL TO service_role USING (true) WITH CHECK (true);
    """

    create_function_query = f"""
    CREATE OR REPLACE FUNCTION match_{table_name}(
      query_embedding vector(1536),
      match_count int DEFAULT 5
    )
    RETURNS TABLE (
      id UUID,
      content text,
      metadata jsonb,
      similarity float
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        {table_name}.id,
        {table_name}.content,
        {table_name}.metadata,
        1 - ({table_name}.embedding <=> query_embedding) AS similarity
      FROM {table_name}
      ORDER BY {table_name}.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
    """

    try:
        full_query = create_table_query + "\n" + create_function_query
        response = supabase_client.rpc("execute_sql", {"sql": full_query}).execute()
        return True
    except Exception as e:
        error_msg = str(e)
        return error_msg if "policy" in error_msg.lower() else False

async def crawl_url(urls: List[str], max_concurrent: int = 3, table_name: Optional[str] = None) -> Optional[str]:
    process = psutil.Process(os.getpid())
    peak_memory = 0

    def log_memory(prefix: str = ""):
        nonlocal peak_memory
        current_mem = process.memory_info().rss
        if current_mem > peak_memory:
            peak_memory = current_mem

    browser_config = BrowserConfig(
        headless=True,
        verbose=True,  # Enable verbose mode for more logging
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
    )
    crawl_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)

    print(f"Starting crawler with {len(urls)} URLs, max_concurrent={max_concurrent}")
    crawler = AsyncWebCrawler()
    
    try:
        await crawler.start()
        print("Crawler started successfully")
    except Exception as e:
        print(f"Error starting crawler: {e}")
        return None

    try:
        success_count = 0
        fail_count = 0
        markdown_file_path = os.path.join(MARKDOWN_DIR, f"{table_name}.md")
        
        # Ensure the file is empty when we start
        with open(markdown_file_path, 'w', encoding="utf-8") as f:
            f.write("")
            
        print(f"Created/cleared markdown file: {markdown_file_path}")
        
        for i in range(0, len(urls), max_concurrent):
            batch = urls[i:i + max_concurrent]
            tasks = []
            print(f"Processing batch {i//max_concurrent + 1} with {len(batch)} URLs")

            for j, url in enumerate(batch):
                session_id = f"parallel_session_{i + j}"
                print(f"Queuing URL: {url} with session {session_id}")
                task = crawler.arun(url=url, config=crawl_config, session_id=session_id)
                tasks.append(task)

            print(f"Waiting for batch {i//max_concurrent + 1} to complete...")
            results = await asyncio.gather(*tasks, return_exceptions=True)
            print(f"Batch {i//max_concurrent + 1} completed")

            for idx, (url, result) in enumerate(zip(batch, results)):
                if isinstance(result, Exception):
                    print(f"Failed to crawl {url}: {result}")
                    fail_count += 1
                elif result.success:
                    content_length = len(result.markdown)
                    print(f"Successfully crawled {url}, got {content_length} chars of markdown")
                    with open(markdown_file_path, 'a', encoding="utf-8") as f:
                        f.write(result.markdown)
                        f.write("\n\n")  # Add spacing between pages
                    success_count += 1
                else:
                    print(f"Failed to crawl {url}: No success flag")
                    fail_count += 1
                    
            if success_count == 0 and i + max_concurrent >= len(urls):
                print("Warning: No successful crawls so far")
                
        print(f"Crawling completed: {success_count} successful, {fail_count} failed")
        
        # Check if we got any content
        if os.path.exists(markdown_file_path):
            file_size = os.path.getsize(markdown_file_path)
            if file_size == 0:
                print("Error: No content was crawled (empty file)")
                # If the main URL wasn't processed, try to crawl it directly
                if len(urls) > 1:
                    print("Attempting to crawl main URL directly as fallback")
                    main_url = urls[0]
                    session_id = "fallback_session"
                    try:
                        result = await crawler.arun(url=main_url, config=crawl_config, session_id=session_id)
                        if result.success and result.markdown:
                            with open(markdown_file_path, 'w', encoding="utf-8") as f:
                                f.write(result.markdown)
                            print(f"Fallback crawl succeeded, got {len(result.markdown)} chars")
                            success_count = 1
                    except Exception as e:
                        print(f"Fallback crawl failed: {e}")
                        
            print(f"Final markdown file size: {file_size} bytes")
            
        if success_count > 0:
            return markdown_file_path
        else:
            print("Error: All crawl attempts failed")
            return None
    except Exception as e:
        print(f"Error during crawling: {e}")
        return None
    finally:
        print("Closing crawler")
        await crawler.close()

def load_and_split_markdown(markdown_content: str, source_url: str) -> List[Document]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        separators=["\n## ", "\n### ", "\n#### ", "\n\n", "\n", " ", ""],
        is_separator_regex=False,
    )
    docs = text_splitter.create_documents([markdown_content])

    for i, doc in enumerate(docs):
        doc.metadata["source"] = source_url
        doc.metadata["chunk_index"] = i

    return docs

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def initialize_rag_chain(vector_store, model_type="Ollama", temperature=0.1):
    retriever = vector_store.as_retriever(search_kwargs={'k': 5})

    if model_type == "Groq" and GROQ_API_KEY:
        llm = ChatGroq(
            temperature=temperature,
            model_name="meta-llama/llama-4-scout-17b-16e-instruct",
            groq_api_key=GROQ_API_KEY
        )
    else:
        llm = Ollama(base_url=OLLAMA_BASE_URL, model=OLLAMA_LLM_MODEL, temperature=temperature)

    template = """
    You are a helpful assistant. Respond to user queries using only the information available from the context. If the information is unavailable, say: 'I'm sorry, I couldn't help you with that.'

    Context:
    {context}

    Question:
    {question}

    Answer:
    """
    prompt = ChatPromptTemplate.from_template(template)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain

# API Routes
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    with open("index.html", "r") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/api/crawl")
async def crawl_website(request: CrawlRequest, background_tasks: BackgroundTasks):
    try:
        # Initialize Supabase client
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise HTTPException(status_code=500, detail="Supabase credentials not configured")

        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        table_name = sanitize_table_name(request.url)
        markdown_file_path = os.path.join(MARKDOWN_DIR, f"{table_name}.md")

        # Check if table exists in Supabase
        table_exists = await check_table_exists(supabase_client, table_name)

        # Check if markdown file exists
        markdown_exists = os.path.exists(markdown_file_path)

        # If both exist, skip to chat
        if table_exists and markdown_exists:
            return JSONResponse(
                content={
                    "success": True,
                    "message": "Website content already exists",
                    "data": {
                        "table_name": table_name,
                        "skipped_crawling": True
                    }
                }
            )

        # If markdown exists but table doesn't, create table and add embeddings
        if markdown_exists and not table_exists:
            print("Markdown exists but table doesn't. Creating table and embeddings...")

            # Create Supabase table
            await create_supabase_table(supabase_client, table_name)

            # Read existing markdown content
            with open(markdown_file_path, "r", encoding="utf-8") as f:
                markdown_content = f.read()

            # Initialize embeddings and vector store
            embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
            vector_store = SupabaseVectorStore(
                client=supabase_client,
                embedding=embeddings,
                table_name=table_name,
                query_name=f"match_{table_name}",
            )

            # Process documents and create embeddings
            documents = load_and_split_markdown(markdown_content, request.url)
            await vector_store.aadd_documents(documents)

            return JSONResponse(
                content={
                    "success": True,
                    "message": "Existing content indexed successfully",
                    "data": {
                        "table_name": table_name,
                        "document_count": len(documents),
                        "skipped_crawling": True
                    }
                }
            )

        # If neither exists, perform full crawl and indexing
        print("No existing content found. Starting full crawl...")

        # Start crawling process
        urls = list_urls(request.url)
        if not urls:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "No URLs found to crawl"}
            )

        # Crawl website and process content
        markdown_file_path = await crawl_url(urls, request.max_concurrent, table_name)

        if not markdown_file_path or not os.path.exists(markdown_file_path) or os.path.getsize(markdown_file_path) == 0:
            print("Main crawler failed or generated empty content. Trying direct fallback...")
            fallback_success = await direct_crawl_fallback(request.url, table_name)
            if not fallback_success:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "message": "Failed to crawl website content with all methods"}
                )
            markdown_file_path = os.path.join(MARKDOWN_DIR, f"{table_name}.md")

        # Read markdown content
        with open(markdown_file_path, "r", encoding="utf-8") as f:
            markdown_content = f.read()

        # Create Supabase table
        await create_supabase_table(supabase_client, table_name)

        # Initialize embeddings and vector store
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vector_store = SupabaseVectorStore(
            client=supabase_client,
            embedding=embeddings,
            table_name=table_name,
            query_name=f"match_{table_name}",
        )

        # Process documents and create embeddings
        documents = load_and_split_markdown(markdown_content, request.url)
        await vector_store.aadd_documents(documents)

        return JSONResponse(
            content={
                "success": True,
                "message": "Website crawled and indexed successfully",
                "data": {
                    "table_name": table_name,
                    "document_count": len(documents),
                    "skipped_crawling": False
                }
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error processing website: {str(e)}"}
        )

@app.get("/api/chatbot/{table_name}")
async def get_chatbot(table_name: str):
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise HTTPException(status_code=500, detail="Supabase credentials not configured")

        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Check if table exists
        table_exists = await check_table_exists(supabase_client, table_name)

        if not table_exists:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Chatbot not found"}
            )

        return JSONResponse(
            content={
                "success": True,
                "message": "Chatbot found",
                "data": {
                    "table_name": table_name,
                    "created_at": "2023-01-01T00:00:00Z"  # Placeholder, you could store this in a metadata table
                }
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error retrieving chatbot: {str(e)}"}
        )

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise HTTPException(status_code=500, detail="Supabase credentials not configured")

        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Initialize embeddings and vector store
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vector_store = SupabaseVectorStore(
            client=supabase_client,
            embedding=embeddings,
            table_name=request.table_name,
            query_name=f"match_{request.table_name}",
        )

        # Initialize RAG chain
        rag_chain = initialize_rag_chain(
            vector_store, 
            model_type=request.model_type,
            temperature=request.temperature
        )

        # Get answer
        answer = await rag_chain.ainvoke(request.question)

        # Convert answer to audio if input was voice
        audio_url = None
        if request.is_voice:
            audio_path = "response.mp3"
            text_to_audio(groq_client, answer, audio_path, request.voice)
            audio_url = "/api/audio/response"

        return JSONResponse(
            content={
                "success": True,
                "message": "Chat response generated successfully",
                "data": {
                    "answer": answer,
                    "audio_url": audio_url
                }
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error generating response: {str(e)}"}
        )

async def direct_crawl_fallback(url: str, table_name: str) -> bool:
    """A simplified crawling fallback that uses requests to fetch page content"""
    print(f"Attempting direct crawl fallback for {url}")
    try:
        # Make a request to the URL
        response = requests.get(url, timeout=30)
        if response.status_code != 200:
            print(f"Direct crawl failed: Status code {response.status_code}")
            return False
            
        # Basic content extraction for the main page
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract title, description, and main content
        title = soup.title.string if soup.title else "No Title"
        
        # Get meta description
        description = ""
        desc_tag = soup.find("meta", attrs={"name": "description"})
        if desc_tag and desc_tag.get("content"):
            description = desc_tag.get("content")
            
        # Get main content - this is a simple approach, will vary by site
        main_content = ""
        for tag in soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li']):
            if tag.text.strip():
                main_content += tag.text.strip() + "\n\n"
        
        # If we still have no content, get all text
        if not main_content:
            main_content = soup.get_text(separator="\n\n", strip=True)
        
        # Create markdown content
        markdown_content = f"""# {title}

## Description
{description}

## Content
{main_content}
"""
        
        # Write to file
        markdown_file_path = os.path.join(MARKDOWN_DIR, f"{table_name}.md")
        with open(markdown_file_path, 'w', encoding="utf-8") as f:
            f.write(markdown_content)
            
        print(f"Direct crawl fallback succeeded, wrote {len(markdown_content)} chars")
        return True
        
    except Exception as e:
        print(f"Direct crawl fallback failed: {e}")
        return False

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
# BotGen - Chatbot Builder

BotGen is a responsive application that allows users to generate custom chatbots from any website by simply pasting the website URL. The generated chatbot can be integrated into any project.

## Features

- **Website URL Input**: Paste any website URL to generate a chatbot based on that website's content
- **Customizable Options**:
  - Choose from different language models (Llama 4 Scout via Groq, Llama 2 via Ollama)
  - Adjust temperature settings for more precise or creative responses
  - Enable/disable voice input capability with multiple voice options
- **Live Preview**: See how your chatbot will look and interact with it in real-time
- **Integration Code**: Get the code snippet to integrate the chatbot into your website
- **Responsive Design**: Works on all screen sizes from mobile phones to desktop computers

## Technologies Used

- **Frontend**:
  - HTML5
  - CSS3 (with Flexbox for responsive layouts)
  - JavaScript (Vanilla JS)
  - Font Awesome for icons

- **Backend**:
  - Python FastAPI
  - LangChain for RAG (Retrieval Augmented Generation)
  - Supabase for vector storage
  - Groq and Ollama for language models

## Getting Started

### Prerequisites

- Python 3.8 or later
- Supabase account (for vector storage)
- Groq API key (for Llama 4 Scout model)
- OpenAI API key (for embeddings)
- Ollama (optional, for local model deployment)

### Quick Setup

#### Windows
Run the setup script:
```
setup.bat
```

#### Mac/Linux
Run the setup script (make it executable first):
```
chmod +x setup.sh
./setup.sh
```

### Manual Installation

1. Clone this repository
2. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```
3. Set up your environment variables in the `.env` file:
   ```
   # Copy the env.example file to .env
   cp env.example .env
   # Then edit .env with your actual values
   ```

   Required environment variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   GROQ_API_KEY=your_groq_api_key
   OLLAMA_BASE_URL=http://localhost:11434  # If using Ollama locally
   OLLAMA_LLM_MODEL=llama2:latest  # Or your preferred Ollama model
   ```

### Running the Server

#### Windows
Run the provided batch file:
```
run_server.bat
```

#### Mac/Linux
Run the provided shell script (make it executable first):
```
chmod +x run_server.sh
./run_server.sh
```

#### Manual Start
Or start the server manually:
```
python -m uvicorn bot_server:app --reload --host 0.0.0.0 --port 8000
```

4. Access the application at `http://localhost:8000`

## Usage

1. Enter the URL of the website you want to create a chatbot for
2. Select your preferred language model (Groq or Ollama)
3. Adjust the temperature slider based on how creative you want the responses to be
4. Toggle voice input if needed and select a voice model
5. Click "Create Chatbot" to generate your chatbot
6. Interact with your chatbot in the preview section
7. Copy the integration code to add the chatbot to your website

## Available Models

### Language Models
- **Llama 4 Scout (Groq)**: A powerful model from Meta, hosted on Groq's infrastructure
- **Llama 2 (Ollama)**: A locally-run model using Ollama

### Voice Models
- **Fritz (Default)**: Default voice model
- **Alloy, Echo, Fable, Onyx, Nova, Shimmer**: Additional voice options

## Customization

You can customize the appearance of the chatbot by modifying the CSS variables in the `assets/css/styles.css` file:

```css
:root {
    --primary-color: #9C1C23;
    --primary-light: #B82A31;
    --secondary-color: #FFF5F5;
    --text-color: #333;
    --text-light: #666;
    --border-color: #E0E0E0;
    --success-color: #4CAF50;
    --error-color: #F44336;
    --warning-color: #FF9800;
    --info-color: #2196F3;
    --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    --transition: all 0.3s ease;
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Font Awesome for the icons
- Google Fonts for the Inter font family
- Groq for AI model hosting
- Ollama for local AI model deployment

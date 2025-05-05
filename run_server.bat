@echo off
echo Starting BotGen FastAPI server...
echo Server will be available at http://localhost:8000
echo Press Ctrl+C to stop the server

python -m uvicorn bot_server:app --reload --host 0.0.0.0 --port 8000

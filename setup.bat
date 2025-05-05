@echo off
echo ----------------------------------------
echo BotGen Setup - Installing dependencies
echo ----------------------------------------

:: Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Python is not installed. Please install Python 3.8 or later and try again.
    exit /b 1
) else (
    echo ✓ Python detected
)

:: Check Python version
for /f "tokens=*" %%i in ('python -c "import sys; print('.'.join(map(str, sys.version_info[:2])))"') do set PYTHON_VERSION=%%i
echo 🔍 Detected Python version %PYTHON_VERSION%

:: Check if pip is installed
where pip >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X pip is not installed. Please install pip and try again.
    exit /b 1
) else (
    echo ✓ pip detected
)

:: Ask about virtual environment
set /p CREATE_VENV=🔄 Create a virtual environment? (y/n): 
if /i "%CREATE_VENV%"=="y" (
    echo 📦 Creating virtual environment...
    python -m venv .venv
    
    :: Activate the virtual environment
    call .venv\Scripts\activate.bat
    echo ✓ Virtual environment created and activated
    set PIP=.venv\Scripts\pip
) else (
    set PIP=pip
)

:: Install dependencies
echo 📦 Installing dependencies...
%PIP% install -r requirements.txt

:: Check for .env file
if not exist .env (
    echo 🔄 Creating .env file from template...
    copy env.example .env
    echo ⚠️ Please edit the .env file with your API keys and settings
) else (
    echo ✓ .env file already exists
)

echo ----------------------------------------
echo ✓ Setup complete! Use the following command to start the server:
echo 🚀 run_server.bat
echo ----------------------------------------

pause 
#!/bin/bash
echo "----------------------------------------"
echo "BotGen Setup - Installing dependencies"
echo "----------------------------------------"

# Check if Python is installed
if command -v python3 &>/dev/null; then
    echo "✅ Python detected"
    PYTHON="python3"
elif command -v python &>/dev/null; then
    echo "✅ Python detected"
    PYTHON="python"
else
    echo "❌ Python is not installed. Please install Python 3.8 or later and try again."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$($PYTHON -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "🔍 Detected Python version $PYTHON_VERSION"

# Check if pip is installed
if ! command -v pip &>/dev/null && ! command -v pip3 &>/dev/null; then
    echo "❌ pip is not installed. Please install pip and try again."
    exit 1
else
    echo "✅ pip detected"
    if command -v pip3 &>/dev/null; then
        PIP="pip3"
    else
        PIP="pip"
    fi
fi

# Create virtual environment (optional)
read -p "🔄 Create a virtual environment? (y/n): " CREATE_VENV
if [[ $CREATE_VENV == "y" || $CREATE_VENV == "Y" ]]; then
    echo "📦 Creating virtual environment..."
    $PYTHON -m venv .venv
    
    # Activate the virtual environment
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        source .venv/Scripts/activate
    else
        # macOS/Linux
        source .venv/bin/activate
    fi
    
    echo "✅ Virtual environment created and activated"
    PIP=".venv/bin/pip"
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        PIP=".venv/Scripts/pip"
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
$PIP install -r requirements.txt

# Check for .env file
if [ ! -f .env ]; then
    echo "🔄 Creating .env file from template..."
    cp env.example .env
    echo "⚠️ Please edit the .env file with your API keys and settings"
else
    echo "✅ .env file already exists"
fi

# Make run script executable
chmod +x run_server.sh
echo "✅ Made run_server.sh executable"

echo "----------------------------------------"
echo "✅ Setup complete! Use the following commands to start the server:"
echo "🚀 ./run_server.sh (Unix/Mac)"
echo "🚀 run_server.bat (Windows)"
echo "----------------------------------------" 
#!/bin/bash

# Script to fix virtual environment issues
echo "🔧 Fixing virtual environment issues..."

# Check if Python is installed
if ! command -v python3 &>/dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+ first."
    exit 1
fi

# Create root .venv if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating root virtual environment..."
    python3 -m venv .venv
    echo "✅ Created root .venv"
else
    echo "✅ Root .venv already exists"
fi

# Remove webscrapper/.venv if it exists
if [ -d "webscrapper/.venv" ]; then
    echo "🗑️ Removing duplicate .venv in webscrapper directory..."
    rm -rf webscrapper/.venv
    echo "✅ Removed duplicate .venv"
fi

# Create symlink from webscrapper/.venv to root .venv
echo "🔗 Creating symlink from webscrapper/.venv to root .venv..."
ln -sf $(pwd)/.venv webscrapper/.venv
echo "✅ Created symlink"

# Install all required dependencies in the root .venv
echo "📦 Installing all required dependencies in the root .venv..."
source .venv/bin/activate

# Upgrade pip
echo "🔄 Upgrading pip..."
pip install --upgrade pip

# Install selenium and beautifulsoup4 for results_scrapper
echo "📦 Installing selenium and beautifulsoup4..."
pip install selenium beautifulsoup4

# Install other dependencies if needed
echo "📦 Installing other dependencies..."
pip install requests pandas numpy matplotlib

echo "✅ Dependencies installed"

# Create a .gitignore in webscrapper directory to ignore .venv
if [ ! -f "webscrapper/.gitignore" ]; then
    echo "📝 Creating .gitignore in webscrapper directory..."
    echo ".venv/" > webscrapper/.gitignore
    echo "✅ Created .gitignore"
fi

echo "🎉 Virtual environment issues fixed!"
echo "💡 To use the virtual environment, run:"
echo "    source .venv/bin/activate"
echo ""
echo "💡 To run the results scraper, activate the virtual environment first:"
echo "    source .venv/bin/activate"
echo "    python webscrapper/src/results_scrapper/tippmix_results_scraper.py"
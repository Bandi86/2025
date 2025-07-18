#!/bin/bash

# BettingMentor Python Environment Setup Script
echo "🐍 BettingMentor Python Environment Setup"
echo "========================================"

# Detect Python version
PYTHON_CMD=""
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python nem található. Kérlek telepítsd a Python 3.9+ verziót."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$($PYTHON_CMD -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 9 ]); then
    echo "❌ Python 3.9 vagy újabb verzió szükséges. Jelenlegi verzió: $PYTHON_VERSION"
    exit 1
fi

echo "✅ Python verzió: $PYTHON_VERSION"

# Function to create virtual environment
create_venv() {
    echo "🔧 Virtuális környezet létrehozása..."
    
    # Check if venv already exists
    if [ -d ".venv" ]; then
        echo "⚠️ A .venv mappa már létezik. Szeretnéd törölni és újra létrehozni? (i/n)"
        read -r response
        if [[ "$response" =~ ^([iI]|[iI][gG][eE][nN])$ ]]; then
            echo "🗑️ Régi virtuális környezet törlése..."
            rm -rf .venv
        else
            echo "✅ Meglévő virtuális környezet használata."
            return
        fi
    fi
    
    # Create virtual environment
    $PYTHON_CMD -m venv .venv
    
    echo "✅ Virtuális környezet létrehozva: .venv"
    echo "💡 Aktiválás: source .venv/bin/activate (Linux/Mac) vagy .venv\\Scripts\\activate (Windows)"
}

# Function to install dependencies
install_deps() {
    echo "📦 Függőségek telepítése..."
    
    # Activate virtual environment
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    elif [ -f ".venv/Scripts/activate" ]; then
        source .venv/Scripts/activate
    else
        echo "❌ Nem található aktivációs script. Hozd létre újra a virtuális környezetet."
        exit 1
    fi
    
    # Upgrade pip
    echo "🔄 pip frissítése..."
    pip install --upgrade pip
    
    # Install dependencies from each module
    echo "📚 Modulok függőségeinek telepítése..."
    
    # Create combined requirements file
    echo "# Combined requirements for BettingMentor Python modules" > requirements-combined.txt
    
    # Add soccerdata requirements
    if [ -f "soccerdata/pyproject.toml" ]; then
        echo "📋 soccerdata függőségek hozzáadása..."
        echo "# soccerdata dependencies" >> requirements-combined.txt
        echo "soccerdata" >> requirements-combined.txt
        echo "" >> requirements-combined.txt
    fi
    
    # Add pdfconverter requirements
    if [ -f "pdfconverter/requirements.txt" ]; then
        echo "📋 pdfconverter függőségek hozzáadása..."
        echo "# pdfconverter dependencies" >> requirements-combined.txt
        cat pdfconverter/requirements.txt >> requirements-combined.txt
        echo "" >> requirements-combined.txt
    fi
    
    # Add webscrapper requirements
    if [ -f "webscrapper/requirements.txt" ]; then
        echo "📋 webscrapper függőségek hozzáadása..."
        echo "# webscrapper dependencies" >> requirements-combined.txt
        cat webscrapper/requirements.txt >> requirements-combined.txt
        echo "" >> requirements-combined.txt
    fi
    
    # Add betmentors requirements
    if [ -f "betmentors/requirements.txt" ]; then
        echo "📋 betmentors függőségek hozzáadása..."
        echo "# betmentors dependencies" >> requirements-combined.txt
        cat betmentors/requirements.txt >> requirements-combined.txt
        echo "" >> requirements-combined.txt
    fi
    
    # Add test requirements
    if [ -f "test/soccerdata_test/requirements.txt" ]; then
        echo "📋 test függőségek hozzáadása..."
        echo "# test dependencies" >> requirements-combined.txt
        cat test/soccerdata_test/requirements.txt >> requirements-combined.txt
        echo "" >> requirements-combined.txt
    fi
    
    # Install combined requirements
    echo "🔄 Függőségek telepítése..."
    pip install -r requirements-combined.txt
    
    echo "✅ Függőségek telepítve!"
}

# Function to create .env files for Python modules
create_env_files() {
    echo "🔑 .env fájlok létrehozása a Python modulokhoz..."
    
    # pdfconverter .env
    if [ -d "pdfconverter" ] && [ ! -f "pdfconverter/.env" ]; then
        echo "📝 pdfconverter/.env létrehozása..."
        cat > pdfconverter/.env << EOF
# pdfconverter környezeti változók
DATABASE_URL=postgresql://sp3_user:sp3_password@localhost:55432/sp3_db?schema=public
PDF_INPUT_DIR=./pdfs
PDF_OUTPUT_DIR=./jsons
EOF
    fi
    
    # webscrapper .env
    if [ -d "webscrapper" ] && [ ! -f "webscrapper/.env" ]; then
        echo "📝 webscrapper/.env létrehozása..."
        cat > webscrapper/.env << EOF
# webscrapper környezeti változók
DATABASE_URL=postgresql://sp3_user:sp3_password@localhost:55432/sp3_db?schema=public
OUTPUT_DIR=./data
EOF
    fi
    
    # betmentors .env
    if [ -d "betmentors" ] && [ ! -f "betmentors/.env" ]; then
        echo "📝 betmentors/.env létrehozása..."
        cat > betmentors/.env << EOF
# betmentors környezeti változók
DATABASE_URL=postgresql://sp3_user:sp3_password@localhost:55432/sp3_db?schema=public
MODEL_DIR=./models
DATA_DIR=./data
EOF
    fi
    
    echo "✅ .env fájlok létrehozva!"
}

# Function to create Python module symlinks
create_symlinks() {
    echo "🔗 Szimbolikus linkek létrehozása a Python modulokhoz..."
    
    # Activate virtual environment
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    elif [ -f ".venv/Scripts/activate" ]; then
        source .venv/Scripts/activate
    else
        echo "❌ Nem található aktivációs script. Hozd létre újra a virtuális környezetet."
        exit 1
    fi
    
    # Get site-packages directory
    SITE_PACKAGES=$($PYTHON_CMD -c "import site; print(site.getsitepackages()[0])")
    
    # Create symlinks for each module
    if [ -d "pdfconverter" ]; then
        echo "🔗 pdfconverter link létrehozása..."
        $PYTHON_CMD -m pip install -e ./pdfconverter
    fi
    
    if [ -d "webscrapper" ]; then
        echo "🔗 webscrapper link létrehozása..."
        $PYTHON_CMD -m pip install -e ./webscrapper
    fi
    
    if [ -d "betmentors" ]; then
        echo "🔗 betmentors link létrehozása..."
        $PYTHON_CMD -m pip install -e ./betmentors
    fi
    
    echo "✅ Szimbolikus linkek létrehozva!"
}

# Function to update .gitignore
update_gitignore() {
    echo "🔄 .gitignore frissítése..."
    
    # Check if .venv is already in .gitignore
    if ! grep -q "^\.venv" .gitignore 2>/dev/null; then
        echo "" >> .gitignore
        echo "# Python virtual environment" >> .gitignore
        echo ".venv/" >> .gitignore
        echo "requirements-combined.txt" >> .gitignore
        echo "✅ .gitignore frissítve!"
    else
        echo "✅ .venv már szerepel a .gitignore fájlban."
    fi
}

# Function to create VSCode settings
create_vscode_settings() {
    echo "⚙️ VSCode beállítások létrehozása..."
    
    # Create .vscode directory if it doesn't exist
    mkdir -p .vscode
    
    # Create settings.json
    cat > .vscode/settings.json << EOF
{
    "python.defaultInterpreterPath": "\${workspaceFolder}/.venv/bin/python",
    "python.linting.enabled": true,
    "python.linting.pylintEnabled": true,
    "python.formatting.provider": "black",
    "python.formatting.blackArgs": [
        "--line-length",
        "100"
    ],
    "editor.formatOnSave": true,
    "[python]": {
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
            "source.organizeImports": true
        }
    },
    "python.testing.pytestEnabled": true,
    "python.testing.unittestEnabled": false,
    "python.testing.nosetestsEnabled": false,
    "python.testing.pytestArgs": [
        "test"
    ]
}
EOF
    
    echo "✅ VSCode beállítások létrehozva!"
}

# Main menu
case "$1" in
    "setup")
        create_venv
        install_deps
        create_env_files
        create_symlinks
        update_gitignore
        create_vscode_settings
        
        echo ""
        echo "🎉 Python környezet beállítása kész!"
        echo "💡 Aktiválás: source .venv/bin/activate (Linux/Mac) vagy .venv\\Scripts\\activate (Windows)"
        echo "💡 Tesztelés: python -c 'import soccerdata; print(soccerdata.__version__)'"
        ;;
    "update")
        install_deps
        create_symlinks
        
        echo ""
        echo "🎉 Python függőségek frissítve!"
        ;;
    *)
        echo "Használat: $0 {setup|update}"
        echo ""
        echo "Parancsok:"
        echo "  setup   - Teljes Python környezet beállítása"
        echo "  update  - Függőségek frissítése"
        echo ""
        echo "Példa: ./python-setup.sh setup"
        exit 1
        ;;
esac
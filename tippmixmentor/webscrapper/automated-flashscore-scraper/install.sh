#!/bin/bash

echo "🎯 BettingMentor Automatizált Flashscore Scraper Telepítő"
echo "========================================================"

# Ellenőrizzük, hogy Node.js telepítve van-e
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nincs telepítve. Kérlek telepítsd először!"
    exit 1
fi

echo "✅ Node.js verzió: $(node --version)"

# Ellenőrizzük, hogy npm telepítve van-e
if ! command -v npm &> /dev/null; then
    echo "❌ npm nincs telepítve. Kérlek telepítsd először!"
    exit 1
fi

echo "✅ npm verzió: $(npm --version)"

# Függőségek telepítése
echo ""
echo "📦 Függőségek telepítése..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Függőségek sikeresen telepítve!"
else
    echo "❌ Hiba a függőségek telepítése során!"
    exit 1
fi

# Könyvtárak létrehozása
echo ""
echo "📁 Könyvtárak létrehozása..."
mkdir -p logs
mkdir -p scraped_data

echo "✅ Könyvtárak létrehozva!"

# Jogosultságok beállítása
chmod +x src/index.js
chmod +x src/cli.js

echo ""
echo "🎉 Telepítés sikeresen befejezve!"
echo ""
echo "🚀 Használat:"
echo "   npm start          - Scraping indítása"
echo "   npm run config     - Konfiguráció megtekintése"
echo "   npm run status     - Státusz ellenőrzése"
echo "   npm run stats      - Statisztikák megtekintése"
echo ""
echo "📖 További információ: README.md"
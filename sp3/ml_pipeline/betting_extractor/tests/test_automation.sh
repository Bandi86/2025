#!/bin/bash
"""
Automatizálás teszt szkript
"""

echo "🧪 PDF Auto-Processor automatizálás tesztelése"
echo ""

# Aktuális helyzet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📂 Jelenlegi fájlok:"
echo "PDFs: $(ls -1 pdfs/ | wc -l) darab"
echo "TXTs: $(ls -1 txts/ | wc -l) darab"
echo "JSONs: $(ls -1 jsons/ | wc -l) darab"
echo ""

echo "📋 PDF fájlok:"
ls -la pdfs/
echo ""

echo "📋 TXT fájlok:"
ls -la txts/
echo ""

echo "📋 JSON fájlok:"
ls -la jsons/
echo ""

echo "🎯 Automatizálás tesztelési módjai:"
echo ""
echo "1. Kézi teszt:"
echo "   ./manage_auto_processor.sh test"
echo "   # Másik terminálban: cp your_new_file.pdf pdfs/"
echo ""
echo "2. Service telepítés:"
echo "   ./manage_auto_processor.sh install"
echo "   ./manage_auto_processor.sh start"
echo "   # PDF másolása: cp your_new_file.pdf pdfs/"
echo "   ./manage_auto_processor.sh logs  # Eredmény figyelése"
echo ""
echo "3. Szimulált teszt (PDF duplikálás):"
echo "   cp pdfs/Web__50sz__K__06-24.pdf pdfs/Web__TEST_$(date +%s).pdf"
echo "   # Az auto-processor automatikusan feldolgozza"
echo ""

read -p "🤔 Futtatni szeretnéd a szimulált tesztet? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Szimulált teszt futtatása..."

    # Létrehozunk egy teszt PDF-et egy meglévő másolásával
    TEST_PDF="pdfs/Web__TEST_$(date +%s).pdf"
    cp "pdfs/Web__50sz__K__06-24.pdf" "$TEST_PDF"

    echo "✅ Teszt PDF létrehozva: $(basename $TEST_PDF)"
    echo ""
    echo "🔄 Automatikus feldolgozás futtatása..."

    # Futtatjuk a process_all_pdfs.py-t
    python3 process_all_pdfs.py

    echo ""
    echo "📊 Teszt eredménye:"
    echo "PDFs: $(ls -1 pdfs/ | wc -l) darab (+1)"
    echo "TXTs: $(ls -1 txts/ | wc -l) darab"
    echo "JSONs: $(ls -1 jsons/ | wc -l) darab"

    echo ""
    echo "🧹 Teszt fájl törlése..."
    rm "$TEST_PDF"

    # Generált fájlok törlése
    TEST_BASE=$(basename "$TEST_PDF" .pdf)
    rm -f "txts/${TEST_BASE}_lines.txt"
    rm -f "jsons/${TEST_BASE}_lines.json"

    echo "✅ Teszt befejezve és tisztítva"
else
    echo "ℹ️  Teszt kihagyva"
fi

echo ""
echo "✅ Automatizálás tesztelése kész!"
echo "💡 A PDF Auto-Processor készen áll a használatra!"

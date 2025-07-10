#!/bin/bash
"""
PDF Auto-Processor telepítő és kezelő szkript
"""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="pdf-auto-processor"
SERVICE_FILE="$SCRIPT_DIR/$SERVICE_NAME.service"

function show_help() {
    echo "PDF Auto-Processor kezelő"
    echo ""
    echo "Használat:"
    echo "  $0 install    - Systemd service telepítése"
    echo "  $0 start      - Service indítása"
    echo "  $0 stop       - Service leállítása"
    echo "  $0 status     - Service állapota"
    echo "  $0 logs       - Service logok megtekintése"
    echo "  $0 remove     - Service eltávolítása"
    echo "  $0 test       - Kézi tesztelés (előtérben)"
    echo ""
}

function install_service() {
    echo "🔧 PDF Auto-Processor service telepítése..."

    if [ ! -f "$SERVICE_FILE" ]; then
        echo "❌ Service fájl nem található: $SERVICE_FILE"
        exit 1
    fi

    # Service fájl másolása
    sudo cp "$SERVICE_FILE" /etc/systemd/system/

    # Systemd reload
    sudo systemctl daemon-reload

    # Service engedélyezése (automatikus indítás)
    sudo systemctl enable $SERVICE_NAME

    echo "✅ Service telepítve és engedélyezve"
    echo "💡 Indítsd el: $0 start"
}

function start_service() {
    echo "🚀 PDF Auto-Processor indítása..."
    sudo systemctl start $SERVICE_NAME
    sleep 2
    sudo systemctl status $SERVICE_NAME --no-pager
}

function stop_service() {
    echo "🛑 PDF Auto-Processor leállítása..."
    sudo systemctl stop $SERVICE_NAME
    echo "✅ Service leállítva"
}

function status_service() {
    echo "📊 PDF Auto-Processor állapota:"
    sudo systemctl status $SERVICE_NAME --no-pager
}

function logs_service() {
    echo "📋 PDF Auto-Processor logok:"
    sudo journalctl -u $SERVICE_NAME -f --no-pager
}

function remove_service() {
    echo "🗑️  PDF Auto-Processor eltávolítása..."

    # Service leállítása és tiltása
    sudo systemctl stop $SERVICE_NAME 2>/dev/null || true
    sudo systemctl disable $SERVICE_NAME 2>/dev/null || true

    # Service fájl törlése
    sudo rm -f /etc/systemd/system/$SERVICE_NAME.service

    # Systemd reload
    sudo systemctl daemon-reload

    echo "✅ Service eltávolítva"
}

function test_manual() {
    echo "🧪 Kézi tesztelés (Ctrl+C a kilépéshez)..."
    echo ""
    cd "$SCRIPT_DIR"
    python3 auto_watcher.py
}

# Parancs feldolgozása
case "$1" in
    install)
        install_service
        ;;
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    status)
        status_service
        ;;
    logs)
        logs_service
        ;;
    remove)
        remove_service
        ;;
    test)
        test_manual
        ;;
    *)
        show_help
        exit 1
        ;;
esac

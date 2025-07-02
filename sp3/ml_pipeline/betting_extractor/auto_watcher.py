#!/usr/bin/env python3
"""
Automatikus PDF feldolgozó watcher
Figyeli a pdfs mappát és automatikusan feldolgozza az új PDF fájlokat
"""
import os
import sys
import time
import subprocess
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class PDFHandler(FileSystemEventHandler):
    """PDF fájl eseménykezelő"""

    def __init__(self, script_dir):
        self.script_dir = Path(script_dir)
        self.processing = False  # Megakadályozza a többszörös feldolgozást

    def on_created(self, event):
        """Új fájl létrehozásakor"""
        if event.is_directory:
            return

        file_path = Path(event.src_path)

        # Csak PDF fájlokra reagálunk
        if file_path.suffix.lower() == '.pdf':
            print(f"🆕 Új PDF fájl észlelve: {file_path.name}")
            self.process_new_pdf(file_path)

    def on_moved(self, event):
        """Fájl mozgatása/átnevezése esetén"""
        if event.is_directory:
            return

        dest_path = Path(event.dest_path)

        # Ha PDF fájlt mozgattak ide
        if dest_path.suffix.lower() == '.pdf':
            print(f"📁 PDF fájl áthelyezve: {dest_path.name}")
            self.process_new_pdf(dest_path)

    def process_new_pdf(self, pdf_path):
        """Új PDF feldolgozása"""
        if self.processing:
            print("⏳ Feldolgozás már folyamatban, várakozás...")
            return

        try:
            self.processing = True
            print(f"🔄 PDF feldolgozása elkezdődött: {pdf_path.name}")

            # Kis várakozás, hogy a fájl teljesen másolódjon
            time.sleep(2)

            # process_all_pdfs.py futtatása
            cmd = ["python3", "process_all_pdfs.py"]
            result = subprocess.run(
                cmd,
                cwd=self.script_dir,
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                print(f"✅ Sikeres feldolgozás: {pdf_path.name}")
                print("📊 Eredmény:")
                # Az utolsó néhány sor kiírása a kimenetből
                lines = result.stdout.strip().split('\n')
                for line in lines[-6:]:
                    if line.strip():
                        print(f"   {line}")
            else:
                print(f"❌ Hiba a feldolgozás során: {pdf_path.name}")
                print(f"Hiba: {result.stderr}")

        except Exception as e:
            print(f"❌ Váratlan hiba: {e}")
        finally:
            self.processing = False
            print("🎯 Feldolgozás befejezve, várakozás újabb fájlokra...\n")

def start_watcher():
    """PDF watcher indítása"""
    script_dir = Path(__file__).parent
    pdfs_dir = script_dir / "pdfs"

    # Ellenőrizzük hogy létezik-e a pdfs mappa
    if not pdfs_dir.exists():
        print("❌ Nincs pdfs mappa! Létrehozás...")
        pdfs_dir.mkdir()
        print(f"✅ pdfs mappa létrehozva: {pdfs_dir}")

    print(f"👁️  PDF watcher indítása...")
    print(f"📂 Figyelt mappa: {pdfs_dir.absolute()}")
    print(f"🎯 Automatikus feldolgozás: AKTÍV")
    print(f"💡 Tipp: Tegyél PDF fájlokat a {pdfs_dir.name}/ mappába")
    print("🔄 Ctrl+C a kilépéshez\n")

    # Event handler és observer létrehozása
    event_handler = PDFHandler(script_dir)
    observer = Observer()
    observer.schedule(event_handler, str(pdfs_dir), recursive=False)

    try:
        # Watcher indítása
        observer.start()
        print("✅ Watcher elindult, várakozás PDF fájlokra...")

        # Végtelen hurok - várunk eseményekre
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n🛑 Leállítás kérve...")
        observer.stop()
        print("✅ PDF watcher leállítva")

    observer.join()

if __name__ == "__main__":
    # Ellenőrizzük a függőségeket
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
    except ImportError:
        print("❌ Hiányzó függőség: watchdog")
        print("Telepítés: pip install watchdog")
        sys.exit(1)

    start_watcher()

#!/usr/bin/env python3
"""
Batch PDF feldolgozás: Az összes PDF fájl a pdfs mappából
"""
import sys
import subprocess
from pathlib import Path

def main():
    script_dir = Path(__file__).parent    # scripts mappa
    project_dir = script_dir.parent       # projekt gyökér mappa
    pdfs_dir = project_dir / "pdfs"       # pdfs mappa a projekt gyökérben

    if not pdfs_dir.exists():
        print(f"HIBA: {pdfs_dir} mappa nem található!")
        sys.exit(1)

    pdf_files = list(pdfs_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"HIBA: Nincs PDF fájl a {pdfs_dir} mappában!")
        sys.exit(1)

    print(f"📋 {len(pdf_files)} PDF fájl feldolgozása...")

    successful = 0
    failed = 0

    for pdf_file in pdf_files:
        print(f"\n🔄 Feldolgozása: {pdf_file.name}")

        try:
            result = subprocess.run([
                sys.executable,
                str(script_dir / "process_pdf.py"),
                str(pdf_file)
            ], capture_output=True, text=True, timeout=60, cwd=project_dir)

            if result.returncode == 0:
                print(f"✅ Sikeres: {pdf_file.name}")
                successful += 1
            else:
                print(f"❌ Hiba: {pdf_file.name}")
                print(result.stderr)
                failed += 1
        except subprocess.TimeoutExpired:
            print(f"⏰ Timeout: {pdf_file.name}")
            failed += 1
        except Exception as e:
            print(f"💥 Kivétel: {pdf_file.name} - {e}")
            failed += 1

    print(f"\n📊 Feldolgozás befejezve:")
    print(f"✅ Sikeres: {successful}")
    print(f"❌ Sikertelen: {failed}")
    print(f"📁 TXT fájlok: {project_dir}/txts/")
    print(f"📁 JSON fájlok: {project_dir}/jsons/")

if __name__ == "__main__":
    main()

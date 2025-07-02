#!/usr/bin/env python3
"""
PDF teljes feldolgozása: PDF -> TXT (txts mappába) -> JSON (jsons mappába)
"""
import sys
import subprocess
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        print("Használat: python3 process_pdf.py <pdf_path>")
        print("Példa: python3 process_pdf.py ./pdfs/sample.pdf")
        sys.exit(1)

    pdf_path = sys.argv[1]

    if not Path(pdf_path).exists():
        print(f"HIBA: PDF fájl nem található: {pdf_path}")
        sys.exit(1)

    script_dir = Path(__file__).parent

    print("🔄 1. lépés: PDF -> TXT konverzió...")
    result1 = subprocess.run([
        sys.executable,
        str(script_dir / "pdf_to_lines.py"),
        pdf_path
    ], capture_output=True, text=True)

    if result1.returncode != 0:
        print(f"HIBA a PDF feldolgozás során:")
        print(result1.stderr)
        sys.exit(1)

    print(result1.stdout)

    print("🔄 2. lépés: TXT -> JSON konverzió...")
    result2 = subprocess.run([
        sys.executable,
        str(script_dir / "extract_matches.py")
    ], capture_output=True, text=True)

    if result2.returncode != 0:
        print(f"HIBA a JSON létrehozás során:")
        print(result2.stderr)
        sys.exit(1)

    print(result2.stdout)
    print("✅ Teljes feldolgozás befejezve!")
    print(f"📁 TXT fájlok: {script_dir}/txts/")
    print(f"📁 JSON fájlok: {script_dir}/jsons/")

if __name__ == "__main__":
    main()

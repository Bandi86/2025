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
    pdf_file = Path(pdf_path)

    if not pdf_file.exists():
        print(f"HIBA: PDF fájl nem található: {pdf_path}")
        sys.exit(1)

    script_dir = Path(__file__).parent    # scripts mappa
    project_dir = script_dir.parent       # projekt gyökér mappa

    # Fájl nevek meghatározása
    txt_file = project_dir / "txts" / f"{pdf_file.stem}_lines.txt"
    json_file = project_dir / "jsons" / f"{pdf_file.stem}_lines.json"

    print("🔄 1. lépés: PDF -> TXT konverzió...")
    result1 = subprocess.run([
        sys.executable,
        str(project_dir / "pdf_to_lines.py"),
        pdf_path
    ], capture_output=True, text=True, cwd=project_dir)

    if result1.returncode != 0:
        print(f"HIBA a PDF feldolgozás során:")
        print(result1.stderr)
        sys.exit(1)

    print(result1.stdout)

    print("🔄 2. lépés: TXT -> JSON konverzió...")
    result2 = subprocess.run([
        sys.executable,
        str(project_dir / "extract_matches.py"),
        str(txt_file),
        str(json_file)
    ], capture_output=True, text=True, cwd=project_dir)

    if result2.returncode != 0:
        print(f"HIBA a JSON létrehozás során:")
        print(result2.stderr)
        sys.exit(1)

    print(result2.stdout)
    print("✅ Teljes feldolgozás befejezve!")
    print(f"📁 TXT fájlok: {project_dir}/txts/")
    print(f"📁 JSON fájlok: {project_dir}/jsons/")

if __name__ == "__main__":
    main()

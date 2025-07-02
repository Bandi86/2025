#!/usr/bin/env python3
"""
PDF soronkénti dump: minden oldal, minden sor sorszámmal kiírása.
Kimenet automatikusan a txts mappába kerül.
"""
import pdfplumber
import sys
import os
from pathlib import Path

def dump_pdf_lines(pdf_path):
    if not os.path.exists(pdf_path):
        print(f"HIBA: PDF nem található: {pdf_path}")
        sys.exit(1)
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            print(f"\n=== OLDAL {page_num+1} ===")
            text = page.extract_text()
            if not text:
                print("[ÜRES OLDAL]")
                continue
            for idx, line in enumerate(text.split('\n')):
                print(f"{page_num+1:02d}:{idx+1:03d}: {line}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Használat: python3 pdf_to_lines.py <pdf_path> [--force]")
        print("  --force: Erőltetett újrafeldolgozás, még ha már létezik is a TXT fájl")
        sys.exit(1)

    pdf_path = sys.argv[1]
    force_reprocess = "--force" in sys.argv

    # Automatikusan a txts mappába mentés
    script_dir = Path(__file__).parent
    txts_dir = script_dir / "txts"
    txts_dir.mkdir(exist_ok=True)

    # Kimeneti fájl neve a PDF alapján
    pdf_name = Path(pdf_path).stem
    output_file = txts_dir / f"{pdf_name}_lines.txt"

    # Ellenőrizzük hogy már létezik-e a TXT fájl
    if output_file.exists() and not force_reprocess:
        pdf_mtime = Path(pdf_path).stat().st_mtime
        txt_mtime = output_file.stat().st_mtime

        if txt_mtime >= pdf_mtime:
            print(f"⏩ TXT fájl már létezik és frissebb mint a PDF: {output_file}")
            print(f"✅ Feldolgozás kihagyva (használd --force a újrafeldolgozáshoz)")
            print(f"✅ Sikeres feldolgozás! Kimenet: {output_file}")
            sys.exit(0)
        else:
            print(f"🔄 PDF újabb mint a TXT fájl, újrafeldolgozás...")

    print(f"PDF feldolgozása: {pdf_path}")
    print(f"Kimenet mentése: {output_file}")

    with open(output_file, "w", encoding="utf-8") as out:
        sys.stdout = out
        dump_pdf_lines(pdf_path)

    # Stdout visszaállítása a konzolra
    sys.stdout = sys.__stdout__
    print(f"✅ Sikeres feldolgozás! Kimenet: {output_file}")

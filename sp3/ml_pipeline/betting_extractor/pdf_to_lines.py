#!/usr/bin/env python3
"""
PDF soronkénti dump: minden oldal, minden sor sorszámmal kiírása.
"""
import pdfplumber
import sys
import os

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
        print("Használat: python3 pdf_to_lines.py <pdf_path> [output_file]")
        sys.exit(1)
    pdf_path = sys.argv[1]
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]
        with open(output_file, "w", encoding="utf-8") as out:
            sys.stdout = out
            dump_pdf_lines(pdf_path)
    else:
        dump_pdf_lines(pdf_path)

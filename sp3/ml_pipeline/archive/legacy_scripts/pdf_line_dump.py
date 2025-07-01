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
        print("Használat: python3 pdf_line_dump.py <pdf_path>")
        sys.exit(1)
    dump_pdf_lines(sys.argv[1])

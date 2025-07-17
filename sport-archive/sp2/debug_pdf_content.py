#!/usr/bin/env python3
"""
PDF tartalom debug
"""

import PyPDF2

def extract_text_from_pdf(pdf_path: str) -> str:
    """PDF szöveg kinyerése"""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return text
    except Exception as e:
        print(f"Hiba a PDF olvasásnál {pdf_path}: {e}")
        return ""

# PDF szöveg kinyerése
print("Extracting PDF text...")
text = extract_text_from_pdf('pdf/organized/2025/06-Június/Web__48sz__K__06-17_2025.06.17.pdf')
print(f"Extracted {len(text)} characters")

# Sorok szétválasztása
lines = text.split('\n')

print(f"Total lines: {len(lines)}")
print("\nLooking for betting table patterns...")

# Keresés fogadási formátumra
import re

# Tippmix jellegű vonalakat keresünk
for i, line in enumerate(lines, 1):
    line = line.strip()
    if not line:
        continue

    # Keresünk mérkőzés sorokat (pl.: K 20:00 123 Team A - Team B 1.50 3.20 2.10)
    if re.match(r'^[KP]\s+\d{2}:\d{2}\s+\d+\s+.+?\s+\d+[,.]?\d*\s+\d+[,.]?\d*\s+\d+[,.]?\d*', line):
        print(f"MATCH LINE {i}: {repr(line)}")
        # Következő 5 sor fogadási opciók lehetnek
        for j in range(1, 6):
            if i + j < len(lines):
                next_line = lines[i + j - 1].strip()
                if next_line and re.match(r'^\d+\s+.+?\s+\d+[,.]?\d*', next_line):
                    print(f"  BET LINE {i+j}: {repr(next_line)}")

    # Keresünk napnéves sorokat (pl.: Szerda 20:00 123 Team A - Team B 1.50 3.20 2.10)
    elif re.match(r'^[A-Z][a-z]+\s+\d{2}:\d{2}\s+\d+\s+.+?\s+\d+[,.]?\d*\s+\d+[,.]?\d*\s+\d+[,.]?\d*', line):
        print(f"DAY MATCH LINE {i}: {repr(line)}")

    # Keresünk csak fogadási sorokat (pl.: 123 Over 2.5 2.10)
    elif re.match(r'^\d+\s+.+?\s+\d+[,.]?\d*(?:\s+\d+[,.]?\d*)?(?:\s+\d+[,.]?\d*)?\s*$', line):
        print(f"BET ONLY LINE {i}: {repr(line)}")

    # Ha már sok mintát találtunk, megállunk
    if i > 1000:
        break

print("\nSample lines around potential table area:")
# Keresünk egy jellegzetes részt
start_idx = None
for i, line in enumerate(lines):
    if 'K 20:00' in line or 'P 20:00' in line:
        start_idx = i
        break

if start_idx:
    for i in range(max(0, start_idx - 5), min(len(lines), start_idx + 20)):
        print(f"{i+1:3}: {repr(lines[i])}")

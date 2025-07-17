#!/usr/bin/env python3
"""
Egyszerű teszt PDF feldolgozó hibakereséshez
"""

import re
import subprocess
from pathlib import Path

def test_pdftotext():
    """Egyszerű pdftotext teszt"""

    pdf_path = Path("/home/bandi/Documents/code/2025/sport-prediction/data/szerencsemix_archive/organized/2023/01-Január/web_01sz__01-03_k16-4_2023.01.03.pdf")

    print(f"📄 PDF teszt: {pdf_path.name}")
    print(f"📏 Fájlméret: {pdf_path.stat().st_size / 1024 / 1024:.1f} MB")

    try:
        print("🔍 pdftotext futtatása...")
        result = subprocess.run([
            'pdftotext', '-layout', str(pdf_path), '-'
        ], capture_output=True, text=True, timeout=30)

        if result.returncode == 0:
            text = result.stdout
            print(f"✅ Szöveg kinyerve: {len(text)} karakter")
            print(f"📝 Sorok száma: {len(text.split())}")

            # Egyszerű keresések
            lines = text.split('\n')

            print("\n🔍 FUTBALL KERESÉS:")
            match_lines = []
            for i, line in enumerate(lines):
                if any(word in line.lower() for word in ['premier', 'liverpool', 'arsenal', 'chelsea', 'manchester']):
                    match_lines.append((i, line.strip()))
                    if len(match_lines) >= 10:  # Csak első 10
                        break

            for line_num, line in match_lines:
                print(f"  {line_num:4d}: {line}")

            print(f"\n📊 Futballal kapcsolatos sorok: {len(match_lines)}+")

            # Szorzó minták keresése
            print("\n🎲 SZORZÓ KERESÉS:")
            odds_lines = []
            for i, line in enumerate(lines):
                if re.search(r'\d+[.,]\d{2,3}\s+\d+[.,]\d{2,3}\s+\d+[.,]\d{2,3}', line):
                    odds_lines.append((i, line.strip()))
                    if len(odds_lines) >= 5:  # Csak első 5
                        break

            for line_num, line in odds_lines:
                print(f"  {line_num:4d}: {line}")

            print(f"\n📊 Szorzós sorok: {len(odds_lines)}+")

        else:
            print(f"❌ Hiba: {result.stderr}")

    except Exception as e:
        print(f"❌ Kivétel: {e}")

if __name__ == "__main__":
    test_pdftotext()

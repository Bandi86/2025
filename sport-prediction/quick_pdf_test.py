#!/usr/bin/env python3
"""
Gyors PDF teszt script
"""

import subprocess
from pathlib import Path

def quick_pdf_test():
    """Gyors PDF teszt"""

    pdf_path = "/home/bandi/Documents/code/2025/sport-prediction/data/szerencsemix_archive/organized/2025/06-Június/Web__51sz__P__06-27_2025.06.27.pdf"

    try:
        # PDF szöveg kinyerése
        result = subprocess.run([
            'pdftotext', '-layout', pdf_path, '-'
        ], capture_output=True, text=True, timeout=30)

        if result.returncode == 0:
            text = result.stdout
            lines = text.split('\n')

            print(f"📄 PDF fájl: {Path(pdf_path).name}")
            print(f"📏 Sorok száma: {len(lines)}")
            print()

            # Keresés időpontokra
            time_lines = []
            for i, line in enumerate(lines):
                if ':' in line and any(char.isdigit() for char in line):
                    time_lines.append((i, line.strip()))

            print(f"⏰ Időpontot tartalmazó sorok: {len(time_lines)}")
            for i, (line_num, line) in enumerate(time_lines[:10]):
                print(f"  {line_num:4d}: {line[:80]}")

            print()

            # Keresés csapatnevekre
            team_lines = []
            search_terms = ['benfica', 'chelsea', 'real', 'barcelona', 'bayern', 'liverpool']

            for i, line in enumerate(lines):
                for term in search_terms:
                    if term.lower() in line.lower():
                        team_lines.append((i, line.strip()))
                        break

            print(f"🏟️ Csapatot tartalmazó sorok: {len(team_lines)}")
            for i, (line_num, line) in enumerate(team_lines[:5]):
                print(f"  {line_num:4d}: {line[:80]}")

            print()

            # Keresés a szóra "vs", "-", ":"
            match_lines = []
            for i, line in enumerate(lines):
                if any(sep in line for sep in [' - ', ' vs ', ' : ']):
                    if any(char.isalpha() for char in line):  # Van betű
                        match_lines.append((i, line.strip()))

            print(f"⚽ Meccs jellegű sorok: {len(match_lines)}")
            for i, (line_num, line) in enumerate(match_lines[:10]):
                print(f"  {line_num:4d}: {line[:80]}")

        else:
            print(f"❌ pdftotext hiba: {result.stderr}")

    except Exception as e:
        print(f"❌ Hiba: {e}")

if __name__ == "__main__":
    quick_pdf_test()

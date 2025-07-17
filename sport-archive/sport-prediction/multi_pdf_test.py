#!/usr/bin/env python3
"""
Gyors PDF teszt több fájlra
"""

import subprocess
from pathlib import Path
import glob

def test_multiple_pdfs():
    """Több PDF teszt"""

    pdf_dir = "/home/bandi/Documents/code/2025/sport-prediction/data/szerencsemix_archive/organized/2025/06-Június/"
    pdf_files = sorted(glob.glob(pdf_dir + "*.pdf"), reverse=True)[:3]  # Legfrissebb 3

    for pdf_path in pdf_files:
        print(f"📄 Tesztelés: {Path(pdf_path).name}")
        print("="*60)

        try:
            # PDF szöveg kinyerése
            result = subprocess.run([
                'pdftotext', '-layout', pdf_path, '-'
            ], capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                text = result.stdout
                lines = text.split('\n')

                print(f"📏 Sorok száma: {len(lines)}")

                # Első 20 nem üres sor
                non_empty_lines = [line.strip() for line in lines if line.strip()]
                print("\n📋 Első 15 sor:")
                for i, line in enumerate(non_empty_lines[:15]):
                    print(f"  {i+1:2d}: {line[:70]}")

                # Keresés meccs jellegű sorokra
                match_lines = []
                for line in lines:
                    line = line.strip()
                    if len(line) > 10:  # Minimum hossz
                        if any(sep in line for sep in [' - ', ' vs ', ' : ']):
                            # Ellenőrizzük, hogy van-e két szó
                            words = line.split()
                            if len(words) >= 3:
                                match_lines.append(line)

                print(f"\n⚽ Lehetséges meccs sorok ({len(match_lines)}):")
                for i, line in enumerate(match_lines[:5]):
                    print(f"  {i+1}: {line[:80]}")

            else:
                print(f"❌ pdftotext hiba: {result.stderr}")

        except Exception as e:
            print(f"❌ Hiba: {e}")

        print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    test_multiple_pdfs()

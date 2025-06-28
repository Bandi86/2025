#!/usr/bin/env python3
"""
Egyszerű teszt a Benfica-Chelsea meccs kinyerésére
"""

import subprocess
import re
from pathlib import Path

def test_benfica_chelsea():
    """Benfica-Chelsea meccs keresése"""

    pdf_path = "data/szerencsemix_archive/organized/2025/06-Június/Web__51sz__P__06-27_2025.06.27.pdf"

    print("🔍 BENFICA-CHELSEA MECCS KERESÉSE")
    print("=" * 40)

    # PDF szöveg kinyerése
    try:
        result = subprocess.run([
            'pdftotext', '-layout', pdf_path, '-'
        ], capture_output=True, text=True, timeout=30)

        if result.returncode != 0:
            print("❌ PDF kinyerés sikertelen")
            return

        text = result.stdout
        print(f"✅ PDF szöveg kinyerve: {len(text)} karakter")

        # Benfica-Chelsea sorok keresése
        lines = text.split('\n')
        benfica_lines = [line for line in lines if 'Benfica' in line and 'Chelsea' in line]

        print(f"🎯 Benfica-Chelsea sorok: {len(benfica_lines)}")
        print()

        for i, line in enumerate(benfica_lines, 1):
            print(f"{i}. {line.strip()}")

            # Regex a meccs adatok kinyerésére
            # Minta: "Szo 22:00    04757            Benfica - Chelsea                                                                                                            3,55   3,45 1,86"
            match = re.search(r'(Szo|Vas|Hét|Kedd|Sze|Csü|Pén)\s+(\d{1,2}:\d{2})\s+(\d{4,5})\s+.*?Benfica.*?Chelsea.*?(\d+[.,]\d{2})\s+(\d+[.,]\d{2})\s+(\d+[.,]\d{2})', line)

            if match:
                day = match.group(1)
                time = match.group(2)
                match_id = match.group(3)
                odds_1 = match.group(4).replace(',', '.')
                odds_x = match.group(5).replace(',', '.')
                odds_2 = match.group(6).replace(',', '.')

                print(f"   📅 Nap: {day}")
                print(f"   🕒 Idő: {time}")
                print(f"   🆔 Meccs ID: {match_id}")
                print(f"   💰 Szorzók: {odds_1} / {odds_x} / {odds_2}")
                print(f"   🏆 Liga: Champions League (feltételezett)")
                print()

                # JSON formátum
                match_data = {
                    'home_team': 'Benfica',
                    'away_team': 'Chelsea',
                    'date': '2025-06-28',  # Szombat (PDF 06-27 után)
                    'time': time,
                    'league': 'Champions League',
                    'odds': {
                        '1': float(odds_1),
                        'X': float(odds_x),
                        '2': float(odds_2)
                    },
                    'match_id': match_id
                }

                print("📋 JSON formátum:")
                import json
                print(json.dumps(match_data, indent=2, ensure_ascii=False))
                print()

                return match_data

        if not benfica_lines:
            print("❌ Nem találtam Benfica-Chelsea meccset")

            # Általános futball sorok keresése
            football_patterns = [
                r'(Szo|Vas|Hét|Kedd|Sze|Csü|Pén)\s+(\d{1,2}:\d{2})\s+(\d{4,5})',
                r'\d+[.,]\d{2}\s+\d+[.,]\d{2}\s+\d+[.,]\d{2}'
            ]

            for pattern in football_patterns:
                matches = [line for line in lines if re.search(pattern, line)]
                print(f"📊 '{pattern}' minta: {len(matches)} találat")

                for match in matches[:3]:
                    print(f"   {match.strip()}")
                print()

    except Exception as e:
        print(f"❌ Hiba: {e}")

if __name__ == "__main__":
    test_benfica_chelsea()

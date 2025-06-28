#!/usr/bin/env python3
"""
Egyszerű teszt a fejlett tippmix processzorom számára
"""

from advanced_tippmix_processor import AdvancedTippmixProcessor
from pathlib import Path
import json

def main():
    processor = AdvancedTippmixProcessor()

    # Egy ismert PDF kiválasztása
    pdf_path = Path('data/szerencsemix_archive/organized/2025/06-Június/Web__50sz__K__06-24_2025.06.24.pdf')

    if not pdf_path.exists():
        print("❌ PDF nem található")
        return

    print(f"🧪 Teszt PDF: {pdf_path.name}")

    # Csak szöveg kinyerés teszt
    text = processor.extract_text_with_pdftotext(pdf_path)

    if text:
        print(f"✅ Szöveg kinyerve: {len(text):,} karakter")

        # Liga szekciók keresése
        sections = processor.parse_league_sections(text)
        print(f"✅ Liga szekciók: {len(sections)}")

        for section in sections[:5]:  # Első 5 szekció
            print(f"  - {section['league']}")

        # Egy szekció részletes feldolgozása
        if sections:
            print(f"\n🔍 Első szekció részletes elemzése:")
            first_section = sections[0]
            matches = processor.extract_matches_from_section(first_section)
            print(f"Liga: {first_section['league']}")
            print(f"Meccsek száma: {len(matches)}")

            for match in matches[:3]:  # Első 3 meccs
                print(f"  ⚽ {match['home_team']} - {match['away_team']}")
                print(f"     Liga: {match['league']}")
                print(f"     Bizonyosság: {match.get('confidence', 'N/A')}")

    else:
        print("❌ Szöveg kinyerés sikertelen")

if __name__ == "__main__":
    main()

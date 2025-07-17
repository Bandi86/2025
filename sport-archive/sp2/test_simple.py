#!/usr/bin/env python3
"""
Teszt a javított PDF feldolgozás tesztelésére
"""

import sys
import os
sys.path.append('/home/bandi/Documents/code/2025/sp2/backend')

from app.core.improved_pdf_processor import ImprovedPDFProcessor

def test_simple_processing():
    """Egyszerű teszt a PDF feldolgozásra"""

    # Egy kis PDF fájl keresése
    pdf_files = []
    for root, dirs, files in os.walk('/home/bandi/Documents/code/2025/sp2/pdf'):
        for file in files:
            if file.endswith('.pdf'):
                pdf_files.append(os.path.join(root, file))
                if len(pdf_files) >= 1:  # Csak az első fájlra van szükségünk
                    break
        if pdf_files:
            break

    if not pdf_files:
        print("❌ Nem találtam PDF fájlokat!")
        return

    test_pdf = pdf_files[0]
    print(f"🔍 Teszt PDF: {test_pdf}")

    try:
        processor = ImprovedPDFProcessor()
        result = processor.process_pdf(test_pdf)

        print(f"✅ Feldolgozás sikeres!")
        print(f"📊 Meccsek száma: {len(result)}")

        # Első 3 meccs részletei
        for i, match in enumerate(result[:3]):
            print(f"\n⚽ Meccs {i+1}:")
            print(f"   ID: {match.match_id}")
            print(f"   Csapatok: {match.team_home} vs {match.team_away}")
            print(f"   Fogadási opciók ({len(match.betting_options)}):")
            for j, bet in enumerate(match.betting_options):
                print(f"     {j+1}. {bet.bet_type.value}: {bet.bet_description}")

        return result

    except Exception as e:
        print(f"❌ Hiba a feldolgozás során: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = test_simple_processing()

#!/usr/bin/env python3
"""
Teszt script az adatfeldolgozás debuggolásához
"""

import sys
sys.path.append('/home/bandi/Documents/code/2025/sp2/backend')

from app.core.improved_pdf_processor import ImprovedPDFProcessor
from app.core.improved_match_extractor import ImprovedMatchExtractor
from app.core.improved_db_manager import ImprovedDatabaseManager
import logging

# Logging beállítása
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_processing():
    """PDF feldolgozás tesztelése"""

    # Komponensek létrehozása
    pdf_processor = ImprovedPDFProcessor()
    match_extractor = ImprovedMatchExtractor()
    db_manager = ImprovedDatabaseManager()

    # Teszt PDF fájl
    test_pdf = "/home/bandi/Documents/code/2025/sp2/pdf/organized/2023/01-Január/web_05sz__01-17_k16_2023.01.17.pdf"

    print(f"🔍 PDF feldolgozás tesztelése: {test_pdf}")

    # PDF szöveg kinyerése
    try:
        text = pdf_processor.extract_text_from_pdf(test_pdf)
        print(f"✅ PDF szöveg kinyerve: {len(text)} karakter")

        # Első 500 karakter megtekintése
        print("\n📄 Első 500 karakter:")
        print("-" * 50)
        print(text[:500])
        print("-" * 50)

    except Exception as e:
        print(f"❌ PDF olvasási hiba: {e}")
        return

    # Meccsek kinyerése
    try:
        matches = match_extractor.extract_matches_from_text(text)
        print(f"\n⚽ Kinyert meccsek száma: {len(matches)}")

        # Első 3 meccs részletei
        for i, match in enumerate(matches[:3]):
            print(f"\n🏆 Meccs {i+1}:")
            print(f"  ID: {match.match_id}")
            print(f"  Csapatok: {match.team_home} vs {match.team_away}")
            print(f"  Időpont: {match.match_time} ({match.match_day})")
            print(f"  Fogadási opciók: {len(match.betting_options)}")

            for j, bet in enumerate(match.betting_options):
                print(f"    {j+1}. {bet.bet_type.value}: {bet.bet_description} -> {bet.odds_1}, {bet.odds_2}, {bet.odds_3}")

    except Exception as e:
        print(f"❌ Meccs kinyerési hiba: {e}")
        return

    # Adatbázisba mentés tesztelése
    try:
        total_saved = 0
        for match in matches:
            match_data = {
                'match_id': match.match_id,
                'team_home': match.team_home,
                'team_away': match.team_away,
                'match_time': match.match_time,
                'match_day': match.match_day,
                'source_pdf': test_pdf.split('/')[-1]
            }

            betting_options = []
            for bet in match.betting_options:
                betting_options.append({
                    'bet_type': bet.bet_type.value,
                    'bet_description': bet.bet_description,
                    'odds_1': bet.odds_1,
                    'odds_2': bet.odds_2,
                    'odds_3': bet.odds_3,
                    'raw_line': bet.raw_line,
                    'line_number': bet.line_number
                })

            db_manager.save_match_with_bets(match_data, betting_options)
            total_saved += 1

        print(f"\n💾 Mentve az adatbázisba: {total_saved} meccs")

    except Exception as e:
        print(f"❌ Adatbázis mentési hiba: {e}")
        return

    print("\n🎉 Teszt sikeresen befejezve!")

if __name__ == "__main__":
    test_processing()

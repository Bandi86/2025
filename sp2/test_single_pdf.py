#!/usr/bin/env python3
"""
Egyetlen PDF teszt a javított logikával
"""

import sys
import os
import sqlite3
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import logging

# Logging beállítása
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Adatbázis beállítások
DB_PATH = Path("/home/bandi/Documents/code/2025/sp2/shared/data/optimized_sport_data.db")
PDF_FILE = Path("/home/bandi/Documents/code/2025/sp2/pdf/organized/2025/06-Június/Web__48sz__K__06-17_2025.06.17.pdf")

sys.path.append('.')
from process_june_pdfs import extract_text_from_pdf, extract_matches_from_text, save_matches_to_db, recreate_database

def test_single_pdf():
    """Egyetlen PDF tesztelése"""
    logger.info(f"🧪 Teszt PDF feldolgozása: {PDF_FILE.name}")

    # Adatbázis újra létrehozása
    recreate_database()

    try:
        # PDF szöveg kinyerése
        text = extract_text_from_pdf(str(PDF_FILE))
        if not text:
            logger.error(f"❌ Nem sikerült szöveget kinyerni: {PDF_FILE.name}")
            return

        # Meccsek kinyerése
        matches = extract_matches_from_text(text, PDF_FILE.name)
        logger.info(f"⚽ Kinyert meccsek: {len(matches)}")

        # Top 10 meccs kiírása
        for i, match in enumerate(matches[:10], 1):
            logger.info(f"  {i:2}: {match['match_id']} - {match['team_home']} vs {match['team_away']} ({len(match['betting_options'])} fogadás)")

        # Adatbázisba mentés
        saved_matches, saved_bets = save_matches_to_db(matches)
        logger.info(f"💾 Mentve: {saved_matches} meccs, {saved_bets} fogadási opció")

        # Top meccsek legtöbb fogadási opcióval
        import sqlite3
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT m.match_id, m.team_home, m.team_away, COUNT(b.id) as bet_count
            FROM matches m
            LEFT JOIN betting_options b ON m.match_id = b.match_id
            GROUP BY m.match_id
            ORDER BY bet_count DESC
            LIMIT 5
        """)

        print(f"\n🏆 Legtöbb fogadási opcióval rendelkező meccsek:")
        for row in cursor.fetchall():
            match_id, home, away, bet_count = row
            print(f"   {match_id}: {home} vs {away} ({bet_count} opció)")

        conn.close()

    except Exception as e:
        logger.error(f"❌ Hiba a PDF feldolgozásánál {PDF_FILE.name}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_single_pdf()

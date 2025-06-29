#!/usr/bin/env python3
"""
Javított adatbázis struktúra - egy meccshez több fogadási opció
"""

import sqlite3
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ImprovedDatabaseManager:
    """Javított adatbázis kezelő - egy meccshez több fogadási opció"""

    def __init__(self, db_path: str = "../../../shared/data/optimized_sport_data.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self.setup_database()

    def setup_database(self):
        """Javított adatbázis tábla létrehozása"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Fő meccs tábla
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT NOT NULL UNIQUE,
                team_home TEXT NOT NULL,
                team_away TEXT NOT NULL,
                match_time TEXT,
                match_day TEXT,
                source_pdf TEXT,
                extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Fogadási opciók tábla
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS betting_options (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT NOT NULL,
                bet_type TEXT NOT NULL,  -- 'main', 'goal', 'corner', 'card', stb.
                bet_description TEXT,   -- pl. "1X2", "Over/Under 2.5", "Corner szám"
                odds_1 REAL,
                odds_2 REAL,
                odds_3 REAL,
                raw_line TEXT,
                line_number INTEGER,
                FOREIGN KEY (match_id) REFERENCES matches (match_id)
            )
        ''')

        # Index a gyorsabb lekérdezésekhez
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_betting_options_match_id
            ON betting_options (match_id)
        ''')

        conn.commit()
        conn.close()
        logger.info(f"Javított adatbázis inicializálva: {self.db_path}")

    def save_match_with_bets(self, match_data: Dict[str, Any], betting_options: List[Dict[str, Any]]):
        """Meccs mentése az összes fogadási opcióval"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            # Fő meccs mentése
            cursor.execute('''
                INSERT OR REPLACE INTO matches
                (match_id, team_home, team_away, match_time, match_day, source_pdf)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                match_data['match_id'],
                match_data['team_home'],
                match_data['team_away'],
                match_data.get('match_time'),
                match_data.get('match_day'),
                match_data.get('source_pdf')
            ))

            # Fogadási opciók mentése
            for bet_option in betting_options:
                cursor.execute('''
                    INSERT INTO betting_options
                    (match_id, bet_type, bet_description, odds_1, odds_2, odds_3, raw_line, line_number)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    match_data['match_id'],
                    bet_option.get('bet_type', 'unknown'),
                    bet_option.get('bet_description', ''),
                    bet_option.get('odds_1'),
                    bet_option.get('odds_2'),
                    bet_option.get('odds_3'),
                    bet_option.get('raw_line', ''),
                    bet_option.get('line_number', 0)
                ))

            conn.commit()
            return True

        except Exception as e:
            logger.error(f"Hiba a meccs mentésekor: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()

    def get_matches_with_bets(self) -> List[Dict[str, Any]]:
        """Összes meccs lekérése a fogadási opciókkal"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT m.*,
                   b.bet_type, b.bet_description,
                   b.odds_1, b.odds_2, b.odds_3,
                   b.raw_line, b.line_number
            FROM matches m
            LEFT JOIN betting_options b ON m.match_id = b.match_id
            ORDER BY m.match_id, b.bet_type
        ''')

        results = cursor.fetchall()
        conn.close()

        # Csoportosítás meccs szerint
        matches = {}
        for row in results:
            match_id = row[1]
            if match_id not in matches:
                matches[match_id] = {
                    'id': row[0],
                    'match_id': row[1],
                    'team_home': row[2],
                    'team_away': row[3],
                    'match_time': row[4],
                    'match_day': row[5],
                    'source_pdf': row[6],
                    'extracted_at': row[7],
                    'betting_options': []
                }

            if row[8]:  # Van fogadási opció
                matches[match_id]['betting_options'].append({
                    'bet_type': row[8],
                    'bet_description': row[9],
                    'odds_1': row[10],
                    'odds_2': row[11],
                    'odds_3': row[12],
                    'raw_line': row[13],
                    'line_number': row[14]
                })

        return list(matches.values())

    def drop_all_tables(self):
        """Összes tábla törlése"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("DROP TABLE IF EXISTS betting_options")
        cursor.execute("DROP TABLE IF EXISTS matches")

        conn.commit()
        conn.close()
        logger.info("Összes tábla törölve")

if __name__ == "__main__":
    # Teszt
    db = ImprovedDatabaseManager()
    print("Javított adatbázis készen áll!")

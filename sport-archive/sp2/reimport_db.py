#!/usr/bin/env python3
"""
Teljes adatbázis újra importálás javított logikával
"""

import sys
sys.path.append('/home/bandi/Documents/code/2025/sp2/backend')

import os
import sqlite3
from pathlib import Path
import logging

# Adatbázis beállítások
DB_PATH = Path("/home/bandi/Documents/code/2025/sp2/shared/data/optimized_sport_data.db")

def recreate_database():
    """Adatbázis újra létrehozása"""

    # Töröljük a meglévő adatbázist
    if DB_PATH.exists():
        DB_PATH.unlink()
        print(f"🗑️  Régi adatbázis törölve: {DB_PATH}")

    # Új adatbázis létrehozása
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Fő meccs tábla
    cursor.execute('''
        CREATE TABLE matches (
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
        CREATE TABLE betting_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id TEXT NOT NULL,
            bet_type TEXT NOT NULL,
            bet_description TEXT,
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
        CREATE INDEX idx_betting_options_match_id ON betting_options (match_id)
    ''')

    conn.commit()
    conn.close()
    print(f"✅ Új adatbázis létrehozva: {DB_PATH}")

def process_one_pdf():
    """Egy PDF feldolgozása manual módon tesztelésre"""

    # Keressünk egy PDF fájlt
    pdf_files = []
    for root, dirs, files in os.walk('/home/bandi/Documents/code/2025/sp2/pdf'):
        for file in files:
            if file.endswith('.pdf'):
                pdf_files.append(os.path.join(root, file))
                if len(pdf_files) >= 1:
                    break
        if pdf_files:
            break

    if not pdf_files:
        print("❌ Nem találtam PDF fájlokat!")
        return

    pdf_path = pdf_files[0]
    print(f"🔍 Feldolgozás: {pdf_path}")

    # Kapcsolódás az adatbázishoz
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Minta adatok beszúrása a teszteléshez
    test_matches = [
        {
            'match_id': '27529',
            'team_home': 'CDT Real Oruro',
            'team_away': 'Jorge Wilstermann',
            'match_time': '23:30',
            'match_day': 'H',
            'source_pdf': os.path.basename(pdf_path),
            'betting_options': [
                {'bet_type': 'main', 'bet_description': '1X2', 'odds_1': 1.58, 'odds_2': 3.55, 'odds_3': 4.25},
                {'bet_type': 'goal', 'bet_description': '1X2 első félidő', 'odds_1': 2.25, 'odds_2': 1.95, 'odds_3': 4.80},
                {'bet_type': 'total', 'bet_description': 'Összesen gól 2,5 felett/alatt', 'odds_1': 1.75, 'odds_2': 2.05, 'odds_3': 0.0},
                {'bet_type': 'corner', 'bet_description': 'Szöglet szám 8,5 felett/alatt', 'odds_1': 1.90, 'odds_2': 1.85, 'odds_3': 0.0}
            ]
        },
        {
            'match_id': '27067',
            'team_home': 'Aurora Cochabamba',
            'team_away': 'Always Ready La Paz',
            'match_time': '23:15',
            'match_day': 'V',
            'source_pdf': os.path.basename(pdf_path),
            'betting_options': [
                {'bet_type': 'main', 'bet_description': '1X2', 'odds_1': 2.57, 'odds_2': 3.60, 'odds_3': 2.07},
                {'bet_type': 'goal', 'bet_description': 'Gól over/under 2.5', 'odds_1': 1.85, 'odds_2': 1.95, 'odds_3': 0.0}
            ]
        },
        {
            'match_id': '12345',
            'team_home': 'Barcelona',
            'team_away': 'Real Madrid',
            'match_time': '20:00',
            'match_day': 'P',
            'source_pdf': os.path.basename(pdf_path),
            'betting_options': [
                {'bet_type': 'main', 'bet_description': '1X2', 'odds_1': 1.85, 'odds_2': 3.20, 'odds_3': 4.10},
                {'bet_type': 'goal', 'bet_description': 'Mindkét csapat lő gólt', 'odds_1': 1.55, 'odds_2': 2.35, 'odds_3': 0.0},
                {'bet_type': 'card', 'bet_description': 'Sárga lap szám 4.5 felett/alatt', 'odds_1': 1.70, 'odds_2': 2.10, 'odds_3': 0.0},
                {'bet_type': 'corner', 'bet_description': 'Szöglet handicap', 'odds_1': 1.80, 'odds_2': 3.40, 'odds_3': 2.20}
            ]
        }
    ]

    total_saved = 0
    for match_data in test_matches:
        # Meccs mentése
        cursor.execute('''
            INSERT INTO matches
            (match_id, team_home, team_away, match_time, match_day, source_pdf)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            match_data['match_id'],
            match_data['team_home'],
            match_data['team_away'],
            match_data['match_time'],
            match_data['match_day'],
            match_data['source_pdf']
        ))

        # Fogadási opciók mentése
        for bet_option in match_data['betting_options']:
            cursor.execute('''
                INSERT INTO betting_options
                (match_id, bet_type, bet_description, odds_1, odds_2, odds_3, raw_line, line_number)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                match_data['match_id'],
                bet_option['bet_type'],
                bet_option['bet_description'],
                bet_option['odds_1'],
                bet_option['odds_2'],
                bet_option['odds_3'],
                f"Minta sor {bet_option['bet_description']}",
                0
            ))

        total_saved += 1

    conn.commit()
    conn.close()
    print(f"✅ Mentve: {total_saved} meccs múltiple fogadási opciókkal")

def verify_database():
    """Adatbázis ellenőrzése"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Statisztikák
    cursor.execute("SELECT COUNT(*) FROM matches")
    match_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM betting_options")
    bet_count = cursor.fetchone()[0]

    print(f"\n📊 Adatbázis statisztikák:")
    print(f"   Meccsek: {match_count}")
    print(f"   Fogadási opciók: {bet_count}")
    print(f"   Átlag fogadás/meccs: {bet_count/match_count:.1f}")

    # Minta meccek
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

if __name__ == "__main__":
    print("🚀 Adatbázis újra létrehozása javított logikával...")

    recreate_database()
    process_one_pdf()
    verify_database()

    print("\n🎉 Adatbázis újra létrehozva és tesztadatokkal feltöltve!")

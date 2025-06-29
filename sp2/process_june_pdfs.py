#!/usr/bin/env python3
"""
Júniusi PDF-ek teljes feldolgozása a javított logikával
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
PDF_DIR = Path("/home/bandi/Documents/code/2025/sp2/pdf/organized/2025/06-Június")

def recreate_database():
    """Adatbázis újra létrehozása"""

    if DB_PATH.exists():
        DB_PATH.unlink()
        logger.info(f"🗑️  Régi adatbázis törölve: {DB_PATH}")

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
    logger.info(f"✅ Új adatbázis létrehozva: {DB_PATH}")

def extract_text_from_pdf(pdf_path: str) -> str:
    """PDF szöveg kinyerése"""
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
    except ImportError:
        logger.warning("pdfplumber nem elérhető, próbálkozás PyPDF2-vel")
        try:
            import PyPDF2
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
                return text
        except ImportError:
            logger.error("Sem pdfplumber, sem PyPDF2 nem elérhető!")
            return ""
    except Exception as e:
        logger.error(f"Hiba a PDF olvasásnál {pdf_path}: {e}")
        return ""

def detect_bet_type(description: str) -> str:
    """Fogadási típus automatikus felismerése"""
    desc_lower = description.lower()

    if any(word in desc_lower for word in ['gól', 'goal', 'over', 'under', 'o/u', '2.5', '1.5', '3.5', 'összesen']):
        return 'goal'
    elif any(word in desc_lower for word in ['szöglet', 'corner', 'sarok']):
        return 'corner'
    elif any(word in desc_lower for word in ['lap', 'card', 'sárga', 'piros', 'yellow', 'red']):
        return 'card'
    elif any(word in desc_lower for word in ['félidő', 'halftime', 'half', 'félido']):
        return 'halftime'
    elif any(word in desc_lower for word in ['handicap', 'hendikep', 'asian']):
        return 'handicap'
    elif '1x2' in desc_lower:
        return 'main'
    else:
        return 'other'

def normalize_odds(odds_str: str) -> float:
    """Odds normalizálása"""
    if not odds_str:
        return 0.0
    try:
        return float(odds_str.replace(',', '.'))
    except ValueError:
        return 0.0

def extract_teams(teams_text: str) -> Tuple[str, str]:
    """Csapatok kinyerése"""
    teams_match = re.match(r'^(.+?)\s*-\s*(.+?)$', teams_text.strip())
    if teams_match:
        home = teams_match.group(1).strip()
        away = teams_match.group(2).strip()
        return home, away

    # Fallback: egyszerű split
    parts = teams_text.split(' - ')
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()

    return teams_text.strip(), ""

def extract_matches_from_text(text: str, source_pdf: str) -> List[Dict[str, Any]]:
    """Meccek kinyerése szövegből javított logikával"""

    # Mintázatok definiálása
    patterns = {
        # P/K formátum: P 20:00 123 Team A - Team B 1.50 3.20 2.10
        'p_k_format': re.compile(r'^([PK])\s+(\d{2}:\d{2})\s+(\d+)\s+(.+?)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s*$'),
        # Nap formátum: Szerda 20:00 123 Team A - Team B 1.50 3.20 2.10
        'day_format': re.compile(r'^([A-Za-z]\w*)\s+(\d{2}:\d{2})\s+(\d+)\s+(.+?)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s*$'),
        # Speciális fogadás mint Hendikep
        'special_bet_hendikep': re.compile(r'^([A-Za-z]\w*)\s+(\d{2}:\d{2})\s+(\d+)\s+(.+?)\s+Hendikep\s+(.+?)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s*$'),
        # Speciális fogadás mint Kétesély
        'special_bet_twoway': re.compile(r'^([A-Za-z]\w*)\s+(\d{2}:\d{2})\s+(\d+)\s+(.+?)\s+Kétesély\s+(.+?)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s*$'),
        # Speciális fogadás mint 1. félidő
        'special_bet_halftime': re.compile(r'^([A-Za-z]\w*)\s+(\d{2}:\d{2})\s+(\d+)\s+(.+?)\s+1\.\s+félidő\s+-\s+(.+?)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s*$'),
        # További fogadási opciók
        'betting_line': re.compile(r'^\s*(\d+)\s+(.+?)\s+(\d+[,.]?\d*)(?:\s+(\d+[,.]?\d*))?(?:\s+(\d+[,.]?\d*))?\s*$'),
    }

    lines = text.split('\n')
    matches = {}

    for line_num, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue

        # P/K formátum
        match = patterns['p_k_format'].match(line)
        if match:
            format_type, time_info, match_id, teams_text, odds1, odds2, odds3 = match.groups()
            team_home, team_away = extract_teams(teams_text)

            if match_id not in matches:
                matches[match_id] = {
                    'match_id': match_id,
                    'team_home': team_home,
                    'team_away': team_away,
                    'match_time': time_info,
                    'match_day': format_type,
                    'source_pdf': source_pdf,
                    'betting_options': []
                }

            # Alapfogadás hozzáadása
            matches[match_id]['betting_options'].append({
                'bet_type': 'main',
                'bet_description': '1X2',
                'odds_1': normalize_odds(odds1),
                'odds_2': normalize_odds(odds2),
                'odds_3': normalize_odds(odds3),
                'raw_line': line,
                'line_number': line_num
            })
            continue

        # Speciális fogadás - Hendikep
        match = patterns['special_bet_hendikep'].match(line)
        if match:
            day_info, time_info, match_id, teams_text, hendikep_info, odds1, odds2, odds3 = match.groups()
            team_home, team_away = extract_teams(teams_text)

            if match_id not in matches:
                matches[match_id] = {
                    'match_id': match_id,
                    'team_home': team_home,
                    'team_away': team_away,
                    'match_time': time_info,
                    'match_day': day_info,
                    'source_pdf': source_pdf,
                    'betting_options': []
                }

            # Hendikep fogadás hozzáadása
            matches[match_id]['betting_options'].append({
                'bet_type': 'handicap',
                'bet_description': f'Hendikep {hendikep_info}',
                'odds_1': normalize_odds(odds1),
                'odds_2': normalize_odds(odds2),
                'odds_3': normalize_odds(odds3),
                'raw_line': line,
                'line_number': line_num
            })
            continue

        # Speciális fogadás - Kétesély
        match = patterns['special_bet_twoway'].match(line)
        if match:
            day_info, time_info, match_id, teams_text, twoway_info, odds1, odds2, odds3 = match.groups()
            team_home, team_away = extract_teams(teams_text)

            if match_id not in matches:
                matches[match_id] = {
                    'match_id': match_id,
                    'team_home': team_home,
                    'team_away': team_away,
                    'match_time': time_info,
                    'match_day': day_info,
                    'source_pdf': source_pdf,
                    'betting_options': []
                }

            # Kétesély fogadás hozzáadása
            matches[match_id]['betting_options'].append({
                'bet_type': 'twoway',
                'bet_description': f'Kétesély {twoway_info}',
                'odds_1': normalize_odds(odds1),
                'odds_2': normalize_odds(odds2),
                'odds_3': normalize_odds(odds3),
                'raw_line': line,
                'line_number': line_num
            })
            continue

        # Speciális fogadás - 1. félidő
        match = patterns['special_bet_halftime'].match(line)
        if match:
            day_info, time_info, match_id, teams_text, halftime_type, odds1, odds2, odds3 = match.groups()
            team_home, team_away = extract_teams(teams_text)

            if match_id not in matches:
                matches[match_id] = {
                    'match_id': match_id,
                    'team_home': team_home,
                    'team_away': team_away,
                    'match_time': time_info,
                    'match_day': day_info,
                    'source_pdf': source_pdf,
                    'betting_options': []
                }

            # Félidő fogadás hozzáadása
            matches[match_id]['betting_options'].append({
                'bet_type': 'halftime',
                'bet_description': f'1. félidő - {halftime_type}',
                'odds_1': normalize_odds(odds1),
                'odds_2': normalize_odds(odds2),
                'odds_3': normalize_odds(odds3),
                'raw_line': line,
                'line_number': line_num
            })
            continue

        # Nap formátum
        match = patterns['day_format'].match(line)
        if match:
            day_info, time_info, match_id, teams_text, odds1, odds2, odds3 = match.groups()
            team_home, team_away = extract_teams(teams_text)

            if match_id not in matches:
                matches[match_id] = {
                    'match_id': match_id,
                    'team_home': team_home,
                    'team_away': team_away,
                    'match_time': time_info,
                    'match_day': day_info,
                    'source_pdf': source_pdf,
                    'betting_options': []
                }

            # Alapfogadás hozzáadása
            matches[match_id]['betting_options'].append({
                'bet_type': 'main',
                'bet_description': '1X2',
                'odds_1': normalize_odds(odds1),
                'odds_2': normalize_odds(odds2),
                'odds_3': normalize_odds(odds3),
                'raw_line': line,
                'line_number': line_num
            })
            continue

        # További fogadási opciók
        match = patterns['betting_line'].match(line)
        if match:
            bet_match_id = match.group(1)
            description = match.group(2)
            odds1 = match.group(3)
            odds2 = match.group(4) if match.group(4) else None
            odds3 = match.group(5) if match.group(5) else None

            # Ha ez a match_id már létezik
            if bet_match_id in matches:
                bet_type = detect_bet_type(description)

                matches[bet_match_id]['betting_options'].append({
                    'bet_type': bet_type,
                    'bet_description': description.strip(),
                    'odds_1': normalize_odds(odds1),
                    'odds_2': normalize_odds(odds2) if odds2 else 0.0,
                    'odds_3': normalize_odds(odds3) if odds3 else 0.0,
                    'raw_line': line,
                    'line_number': line_num
                })

    return list(matches.values())

def save_matches_to_db(matches: List[Dict[str, Any]]):
    """Meccsek mentése adatbázisba"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    saved_matches = 0
    saved_bets = 0

    for match_data in matches:
        try:
            # Meccs mentése
            cursor.execute('''
                INSERT OR REPLACE INTO matches
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

            # Régi fogadási opciók törlése
            cursor.execute('DELETE FROM betting_options WHERE match_id = ?', (match_data['match_id'],))

            # Új fogadási opciók mentése
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
                    bet_option['raw_line'],
                    bet_option['line_number']
                ))
                saved_bets += 1

            saved_matches += 1

        except Exception as e:
            logger.error(f"Hiba a meccs mentésénél {match_data['match_id']}: {e}")

    conn.commit()
    conn.close()

    return saved_matches, saved_bets

def process_all_june_pdfs():
    """Összes júniusi PDF feldolgozása"""

    logger.info("🚀 Júniusi PDF-ek teljes feldolgozása indítása...")

    # Adatbázis újra létrehozása
    recreate_database()

    # PDF fájlok keresése
    pdf_files = list(PDF_DIR.glob("*.pdf"))
    logger.info(f"📄 Találtam {len(pdf_files)} PDF fájlt")

    total_matches = 0
    total_bets = 0

    for i, pdf_path in enumerate(pdf_files, 1):
        logger.info(f"🔍 Feldolgozás ({i}/{len(pdf_files)}): {pdf_path.name}")

        try:
            # PDF szöveg kinyerése
            text = extract_text_from_pdf(str(pdf_path))
            if not text:
                logger.warning(f"❌ Nem sikerült szöveget kinyerni: {pdf_path.name}")
                continue

            # Meccsek kinyerése
            matches = extract_matches_from_text(text, pdf_path.name)
            logger.info(f"⚽ Kinyert meccsek: {len(matches)}")

            # Adatbázisba mentés
            saved_matches, saved_bets = save_matches_to_db(matches)
            total_matches += saved_matches
            total_bets += saved_bets

            logger.info(f"💾 Mentve: {saved_matches} meccs, {saved_bets} fogadási opció")

        except Exception as e:
            logger.error(f"❌ Hiba a PDF feldolgozásánál {pdf_path.name}: {e}")

    logger.info(f"🎉 Feldolgozás befejezve!")
    logger.info(f"📊 Összesen: {total_matches} meccs, {total_bets} fogadási opció")

    return total_matches, total_bets

def verify_database():
    """Adatbázis ellenőrzése"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Statisztikák
    cursor.execute("SELECT COUNT(*) FROM matches")
    match_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM betting_options")
    bet_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT source_pdf) FROM matches")
    pdf_count = cursor.fetchone()[0]

    print(f"\n📊 VÉGSŐ STATISZTIKÁK:")
    print(f"   📄 Feldolgozott PDF-ek: {pdf_count}")
    print(f"   ⚽ Meccsek: {match_count}")
    print(f"   🎯 Fogadási opciók: {bet_count}")
    print(f"   📈 Átlag fogadás/meccs: {bet_count/match_count:.1f}" if match_count > 0 else "   📈 Átlag fogadás/meccs: 0")

    # Top meccsek legtöbb fogadási opcióval
    cursor.execute("""
        SELECT m.match_id, m.team_home, m.team_away, COUNT(b.id) as bet_count, m.source_pdf
        FROM matches m
        LEFT JOIN betting_options b ON m.match_id = b.match_id
        GROUP BY m.match_id
        ORDER BY bet_count DESC
        LIMIT 10
    """)

    print(f"\n🏆 Legtöbb fogadási opcióval rendelkező meccsek:")
    for row in cursor.fetchall():
        match_id, home, away, bet_count, source = row
        print(f"   {match_id}: {home} vs {away} ({bet_count} opció) - {source}")

    # Fogadási típusok megoszlása
    cursor.execute("""
        SELECT bet_type, COUNT(*) as count
        FROM betting_options
        GROUP BY bet_type
        ORDER BY count DESC
    """)

    print(f"\n🎯 Fogadási típusok megoszlása:")
    for bet_type, count in cursor.fetchall():
        print(f"   {bet_type}: {count}")

    conn.close()

if __name__ == "__main__":
    try:
        process_all_june_pdfs()
        verify_database()
    except KeyboardInterrupt:
        logger.info("⚠️ Feldolgozás megszakítva felhasználó által")
    except Exception as e:
        logger.error(f"❌ Váratlan hiba: {e}")
        import traceback
        traceback.print_exc()

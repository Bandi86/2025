#!/usr/bin/env python3
"""
Liga tabella extraktor - Liga tabellák kinyerése PDF fájlokból
"""

import sqlite3
import re
import json
from datetime import datetime
from pathlib import Path
import logging
from typing import Dict, List, Tuple, Optional

class LeagueTableExtractor:
    def __init__(self, db_path: str = "data/football_database.db"):
        self.db_path = db_path
        self.setup_logging()

    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('data/table_extraction.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def extract_tables_from_text(self, text: str) -> List[Dict]:
        """Kinyeri a liga tabellákat a PDF szövegből"""
        tables = []
        lines = text.split('\n')

        # Liga tabella minták keresése
        table_patterns = [
            r'(Premier League|Bundesliga|Serie A|La Liga|Ligue 1|NB I)\s+tabella',
            r'Bajnokság\s+állása?\s*:?\s*(.*)',
            r'Liga\s+tabella\s*:?\s*(.*)',
            r'Helyezés.*Csapat.*Pontszám',
        ]

        current_league = None
        current_table = []
        in_table = False

        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            # Liga címe keresése
            for pattern in table_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    # Ha volt aktív tabella, lezárjuk
                    if current_table and current_league:
                        tables.append({
                            'league': current_league,
                            'teams': current_table,
                            'extracted_at': datetime.now().isoformat()
                        })

                    current_league = self.extract_league_name(line)
                    current_table = []
                    in_table = True
                    break

            # Tabella sorok keresése
            if in_table and current_league:
                team_data = self.parse_table_row(line)
                if team_data:
                    current_table.append(team_data)
                elif len(current_table) > 0 and self.is_table_end(line):
                    # Tabella vége
                    tables.append({
                        'league': current_league,
                        'teams': current_table,
                        'extracted_at': datetime.now().isoformat()
                    })
                    current_league = None
                    current_table = []
                    in_table = False

        # Utolsó tabella mentése ha maradt
        if current_table and current_league:
            tables.append({
                'league': current_league,
                'teams': current_table,
                'extracted_at': datetime.now().isoformat()
            })

        return tables

    def extract_league_name(self, line: str) -> str:
        """Kinyeri a liga nevét a sorból"""
        # Ismert ligák keresése
        known_leagues = {
            'premier league': 'Premier League',
            'bundesliga': 'Bundesliga',
            'serie a': 'Serie A',
            'la liga': 'La Liga',
            'ligue 1': 'Ligue 1',
            'nb i': 'NB I',
            'nb1': 'NB I',
            'magyar': 'NB I',
            'championship': 'Championship',
            'serie b': 'Serie B',
            'segunda division': 'Segunda Division'
        }

        line_lower = line.lower()
        for key, value in known_leagues.items():
            if key in line_lower:
                return value

        # Általános minta alapján
        match = re.search(r'([A-Za-z\s]+(?:liga|league|bajnokság))', line, re.IGNORECASE)
        if match:
            return match.group(1).strip()

        return "Ismeretlen Liga"

    def parse_table_row(self, line: str) -> Optional[Dict]:
        """Feldolgoz egy tabella sort"""
        # Több lehetséges formátum:
        # "1. Manchester City 25 12 2 1 45:15 38"
        # "1 Manchester City 25 12 2 1 45 15 38"
        # "1. Manchester City    25   12   2   1   45:15   38"

        patterns = [
            # Pozíció. Csapat Meccs Győzelem Döntetlen Vereség Gól:Kapott Pont
            r'^(\d+)\.?\s+([A-Za-z\s\.\-]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+):(\d+)\s+(\d+)$',
            # Pozíció. Csapat Meccs Győzelem Döntetlen Vereség Gól Kapott Pont
            r'^(\d+)\.?\s+([A-Za-z\s\.\-]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$',
            # Egyszerűbb formátum: Pozíció Csapat Pont
            r'^(\d+)\.?\s+([A-Za-z\s\.\-]+?)\s+(\d+)$',
        ]

        for pattern in patterns:
            match = re.match(pattern, line.strip())
            if match:
                groups = match.groups()

                if len(groups) == 9:  # Teljes adat
                    return {
                        'position': int(groups[0]),
                        'team_name': groups[1].strip(),
                        'matches_played': int(groups[2]),
                        'wins': int(groups[3]),
                        'draws': int(groups[4]),
                        'losses': int(groups[5]),
                        'goals_for': int(groups[6]),
                        'goals_against': int(groups[7]),
                        'points': int(groups[8])
                    }
                elif len(groups) == 9 and ':' not in line:  # Szeparált gólok
                    return {
                        'position': int(groups[0]),
                        'team_name': groups[1].strip(),
                        'matches_played': int(groups[2]),
                        'wins': int(groups[3]),
                        'draws': int(groups[4]),
                        'losses': int(groups[5]),
                        'goals_for': int(groups[6]),
                        'goals_against': int(groups[7]),
                        'points': int(groups[8])
                    }
                elif len(groups) == 3:  # Csak pozíció, csapat, pont
                    return {
                        'position': int(groups[0]),
                        'team_name': groups[1].strip(),
                        'points': int(groups[2]),
                        'matches_played': None,
                        'wins': None,
                        'draws': None,
                        'losses': None,
                        'goals_for': None,
                        'goals_against': None
                    }

        return None

    def is_table_end(self, line: str) -> bool:
        """Meghatározza, hogy véget ért-e a tabella"""
        end_indicators = [
            'következő',
            'mérkőzések',
            'fogadási',
            'odds',
            'következő oldal',
            'page',
            '---',
            '***',
            'szerencsemix'
        ]

        line_lower = line.lower()
        return any(indicator in line_lower for indicator in end_indicators)

    def find_or_create_team(self, team_name: str, league: str) -> int:
        """Megtalálja vagy létrehozza a csapatot az adatbázisban"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Normalizált név
        normalized_name = re.sub(r'\s+', ' ', team_name.strip())

        # Keresés az adatbázisban
        cursor.execute("""
            SELECT id FROM teams
            WHERE name = ? OR normalized_name = ?
        """, (team_name, normalized_name))

        result = cursor.fetchone()
        if result:
            conn.close()
            return result[0]

        # Fuzzy keresés
        cursor.execute("SELECT id, name, normalized_name FROM teams")
        teams = cursor.fetchall()

        for team_id, name, norm_name in teams:
            if (normalized_name.lower() in name.lower() or
                name.lower() in normalized_name.lower()):
                conn.close()
                return team_id

        # Új csapat létrehozása
        cursor.execute("""
            INSERT INTO teams (name, normalized_name, country, added_by)
            VALUES (?, ?, ?, ?)
        """, (team_name, normalized_name, 'International', 'table_extractor'))

        team_id = cursor.lastrowid
        conn.commit()
        conn.close()

        self.logger.info(f"Új csapat létrehozva: {team_name} (ID: {team_id})")
        return team_id

    def save_league_table(self, table_data: Dict, source_file: str = None):
        """Menti a liga tabellát az adatbázisba"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        league_name = table_data['league']
        extracted_at = table_data['extracted_at']

        try:
            # Törli a meglévő bejegyzéseket ugyanabból a ligából ugyanazon a napon
            today = datetime.now().strftime('%Y-%m-%d')
            cursor.execute("""
                DELETE FROM league_tables
                WHERE league_name = ? AND DATE(extracted_at) = ?
            """, (league_name, today))

            # Új bejegyzések mentése
            for team_data in table_data['teams']:
                team_id = self.find_or_create_team(team_data['team_name'], league_name)

                cursor.execute("""
                    INSERT INTO league_tables
                    (league_name, team_id, position, matches_played, wins, draws, losses,
                     goals_for, goals_against, points, extracted_at, source_file)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    league_name, team_id, team_data['position'],
                    team_data.get('matches_played'),
                    team_data.get('wins'),
                    team_data.get('draws'),
                    team_data.get('losses'),
                    team_data.get('goals_for'),
                    team_data.get('goals_against'),
                    team_data['points'],
                    extracted_at,
                    source_file
                ))

            conn.commit()
            self.logger.info(f"Liga tabella mentve: {league_name} ({len(table_data['teams'])} csapat)")

        except Exception as e:
            self.logger.error(f"Hiba a tabella mentésénél ({league_name}): {e}")
            conn.rollback()
        finally:
            conn.close()

    def process_pdf_for_tables(self, pdf_path: str):
        """Feldolgoz egy PDF fájlt liga tabellák kinyeréséhez"""
        import subprocess

        try:
            # PDF szöveg kinyerése
            result = subprocess.run(
                ['pdftotext', '-layout', pdf_path, '-'],
                capture_output=True, text=True, encoding='utf-8'
            )

            if result.returncode != 0:
                self.logger.error(f"Nem sikerült kinyerni a szöveget: {pdf_path}")
                return

            text = result.stdout
            tables = self.extract_tables_from_text(text)

            if not tables:
                self.logger.info(f"Nem találtunk tabellákat: {pdf_path}")
                return

            # Tabellák mentése
            for table in tables:
                self.save_league_table(table, Path(pdf_path).name)

            self.logger.info(f"Feldolgozva {len(tables)} tabella a {pdf_path} fájlból")

        except Exception as e:
            self.logger.error(f"Hiba a PDF feldolgozás során {pdf_path}: {e}")

    def batch_extract_from_directory(self, pdf_directory: str):
        """Kötegelt tabella kinyerés egy könyvtárból"""
        pdf_dir = Path(pdf_directory)

        if not pdf_dir.exists():
            self.logger.error(f"Nem létezik a könyvtár: {pdf_directory}")
            return

        pdf_files = list(pdf_dir.glob("*.pdf"))
        self.logger.info(f"Találtunk {len(pdf_files)} PDF fájlt a tabella kinyeréshez")

        for pdf_file in pdf_files:
            self.logger.info(f"Feldolgozás: {pdf_file.name}")
            self.process_pdf_for_tables(str(pdf_file))

    def get_latest_table(self, league_name: str) -> List[Dict]:
        """Visszaadja a legfrissebb tabellát egy ligára"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT lt.position, t.name, lt.matches_played, lt.wins, lt.draws, lt.losses,
                   lt.goals_for, lt.goals_against, lt.points, lt.extracted_at
            FROM league_tables lt
            LEFT JOIN teams t ON lt.team_id = t.id
            WHERE lt.league_name = ?
            AND lt.extracted_at = (
                SELECT MAX(extracted_at) FROM league_tables
                WHERE league_name = ?
            )
            ORDER BY lt.position
        """, (league_name, league_name))

        table = []
        for row in cursor.fetchall():
            table.append({
                'position': row[0],
                'team_name': row[1],
                'matches_played': row[2],
                'wins': row[3],
                'draws': row[4],
                'losses': row[5],
                'goals_for': row[6],
                'goals_against': row[7],
                'points': row[8],
                'extracted_at': row[9]
            })

        conn.close()
        return table

    def generate_table_report(self) -> Dict:
        """Jelentés generálása a tabellákról"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Liga számok
        cursor.execute("""
            SELECT league_name, COUNT(DISTINCT team_id) as team_count,
                   MAX(extracted_at) as last_update
            FROM league_tables
            GROUP BY league_name
            ORDER BY team_count DESC
        """)

        leagues = []
        for row in cursor.fetchall():
            leagues.append({
                'league': row[0],
                'team_count': row[1],
                'last_update': row[2]
            })

        # Összes bejegyzés
        cursor.execute("SELECT COUNT(*) FROM league_tables")
        total_entries = cursor.fetchone()[0]

        conn.close()

        return {
            'timestamp': datetime.now().isoformat(),
            'total_entries': total_entries,
            'leagues': leagues,
            'league_count': len(leagues)
        }

def main():
    extractor = LeagueTableExtractor()

    # Jelentés a jelenlegi állapotról
    report = extractor.generate_table_report()
    print(f"\n📊 LIGA TABELLA JELENTÉS")
    print(f"========================")
    print(f"📈 Összes bejegyzés: {report['total_entries']}")
    print(f"🏆 Ligák száma: {report['league_count']}")

    print(f"\n🔝 LIGÁK RÉSZLETESEN:")
    for league in report['leagues']:
        print(f"  📋 {league['league']}: {league['team_count']} csapat")
        print(f"      Utolsó frissítés: {league['last_update']}")

    # Premier League tabella megjelenítése példaként
    if report['leagues']:
        first_league = report['leagues'][0]['league']
        table = extractor.get_latest_table(first_league)

        if table:
            print(f"\n🏆 {first_league.upper()} TABELLA:")
            print(f"{'Pos':<3} {'Csapat':<20} {'M':<3} {'Gy':<3} {'D':<3} {'V':<3} {'GF':<3} {'GA':<3} {'Pont':<4}")
            print("-" * 60)

            for team in table[:10]:  # Top 10
                print(f"{team['position']:<3} {team['team_name'][:19]:<20} "
                      f"{team['matches_played'] or 0:<3} {team['wins'] or 0:<3} "
                      f"{team['draws'] or 0:<3} {team['losses'] or 0:<3} "
                      f"{team['goals_for'] or 0:<3} {team['goals_against'] or 0:<3} "
                      f"{team['points']:<4}")

if __name__ == "__main__":
    main()

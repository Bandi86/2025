#!/usr/bin/env python3
"""
PDF Adatbetöltési Pipeline
==========================

Ez a szkript kezeli a SzerencseMix PDF fájlok feldolgozását és adatbetöltését
az új adatbázis struktúrába.

Funkciók:
- PDF feldolgozás és adatextrakció
- Csapat nevek normalizálása és összekapcsolása
- Adatminőség ellenőrzés
- Hibakezelés és naplózás
- Batch feldolgozás lehetőség
"""

import sqlite3
import json
import logging
from pathlib import Path
from datetime import datetime, date
from typing import Dict, List, Optional, Tuple
import re

# Importáljuk a meglévő PDF feldolgozókat
import sys
sys.path.append(str(Path(__file__).parent / 'src' / 'tools'))
sys.path.append(str(Path(__file__).parent))

try:
    from ultra_precise_football_extractor import UltraPreciseFootballExtractor
    PDF_PROCESSOR_AVAILABLE = True
    PROCESSOR_TYPE = "ultra_precise"
except ImportError:
    try:
        from simple_pdf_processor import SimplePdfProcessor
        PDF_PROCESSOR_AVAILABLE = True
        PROCESSOR_TYPE = "simple"
        print("⚠️ Ultra precíz feldolgozó nem elérhető, egyszerű feldolgozó használata")
    except ImportError as e:
        print(f"❌ Hiba: Egyetlen PDF feldolgozó sem elérhető: {e}")
        PDF_PROCESSOR_AVAILABLE = False
        PROCESSOR_TYPE = None

class DatabaseLoader:
    """Adatbázis betöltő és kezelő osztály"""

    def __init__(self, db_path: str = None):
        if db_path is None:
            self.db_path = Path(__file__).parent / 'data' / 'football_database.db'
        else:
            self.db_path = Path(db_path)

        if not self.db_path.exists():
            raise FileNotFoundError(f"Adatbázis nem található: {self.db_path}")

        # Logging beállítás
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('data_loader.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def get_connection(self):
        """Adatbázis kapcsolat létrehozása"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row  # Dict-szerű hozzáférés
        return conn

    def normalize_team_name(self, team_name: str) -> str:
        """
        Csapat név normalizálása
        """
        if not team_name:
            return ""

        # Alapvető tisztítás
        normalized = team_name.strip()

        # Gyakori rövidítések és alternatívák
        replacements = {
            'FC': '',
            'F.C.': '',
            'AC': '',
            'SC': '',
            'BK': '',
            'MTK': 'MTK Budapest',
            'FTC': 'Ferencváros',
            'DVSC': 'Debrecen',
            'DVTK': 'Diósgyőr',
            'ZTE': 'Zalaegerszeg',
            'Paks': 'Paksi FC'
        }

        # Speciális magyar csapat nevek
        for old, new in replacements.items():
            if old in normalized:
                if new:
                    normalized = new
                else:
                    normalized = normalized.replace(old, '').strip()

        # Többszörös szóközök eltávolítása
        normalized = re.sub(r'\\s+', ' ', normalized)

        return normalized.strip()

    def find_or_create_team(self, team_name: str, league: str = None, country: str = None) -> int:
        """
        Csapat keresése vagy létrehozása az adatbázisban
        Visszaadja a team_id-t
        """
        if not team_name:
            return None

        normalized_name = self.normalize_team_name(team_name)

        with self.get_connection() as conn:
            # Először keresés normalizált név alapján
            cursor = conn.execute("""
                SELECT team_id FROM teams
                WHERE normalized_name = ? OR team_name = ?
            """, (normalized_name, team_name))

            result = cursor.fetchone()
            if result:
                return result['team_id']

            # Ha nem található, létrehozás
            self.logger.info(f"Új csapat létrehozása: {team_name} -> {normalized_name}")

            cursor = conn.execute("""
                INSERT INTO teams (team_name, normalized_name, country, last_seen)
                VALUES (?, ?, ?, ?)
            """, (team_name, normalized_name, country or 'Hungary', date.today()))

            return cursor.lastrowid

    def load_historical_match(self, match_data: Dict, source_pdf: str, confidence: float = 0.0) -> Optional[int]:
        """
        Történelmi meccs betöltése az adatbázisba
        """
        try:
            with self.get_connection() as conn:
                # Csapatok keresése/létrehozása
                home_team_id = self.find_or_create_team(
                    match_data.get('home_team', ''),
                    match_data.get('league', ''),
                    match_data.get('country', 'Hungary')
                )

                away_team_id = self.find_or_create_team(
                    match_data.get('away_team', ''),
                    match_data.get('league', ''),
                    match_data.get('country', 'Hungary')
                )

                # Meccs adatok
                cursor = conn.execute("""
                    INSERT INTO historical_matches (
                        date, time, home_team, away_team, home_team_id, away_team_id,
                        league, home_score, away_score, match_status, season,
                        source_pdf, extraction_confidence
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    match_data.get('date'),
                    match_data.get('time'),
                    match_data.get('home_team', ''),
                    match_data.get('away_team', ''),
                    home_team_id,
                    away_team_id,
                    match_data.get('league', ''),
                    match_data.get('home_score'),
                    match_data.get('away_score'),
                    match_data.get('status', 'completed'),
                    match_data.get('season', ''),
                    source_pdf,
                    confidence
                ))

                match_id = cursor.lastrowid
                self.logger.info(f"Meccs betöltve: {match_data.get('home_team')} vs {match_data.get('away_team')} (ID: {match_id})")
                return match_id

        except Exception as e:
            self.logger.error(f"Hiba meccs betöltéskor: {e}")
            return None

    def load_future_match(self, match_data: Dict, source_pdf: str, confidence: float = 0.0) -> Optional[int]:
        """
        Jövőbeli meccs betöltése az adatbázisba
        """
        try:
            with self.get_connection() as conn:
                # Csapatok keresése/létrehozása
                home_team_id = self.find_or_create_team(
                    match_data.get('home_team', ''),
                    match_data.get('league', ''),
                    match_data.get('country', 'Hungary')
                )

                away_team_id = self.find_or_create_team(
                    match_data.get('away_team', ''),
                    match_data.get('league', ''),
                    match_data.get('country', 'Hungary')
                )

                # Fogadási szorzók JSON formátumban
                betting_odds = None
                if 'odds' in match_data:
                    betting_odds = json.dumps(match_data['odds'])

                # Meccs adatok
                cursor = conn.execute("""
                    INSERT INTO future_matches (
                        date, time, home_team, away_team, home_team_id, away_team_id,
                        league, season, betting_odds, source_pdf, extraction_confidence
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    match_data.get('date'),
                    match_data.get('time'),
                    match_data.get('home_team', ''),
                    match_data.get('away_team', ''),
                    home_team_id,
                    away_team_id,
                    match_data.get('league', ''),
                    match_data.get('season', ''),
                    betting_odds,
                    source_pdf,
                    confidence
                ))

                match_id = cursor.lastrowid
                self.logger.info(f"Jövőbeli meccs betöltve: {match_data.get('home_team')} vs {match_data.get('away_team')} (ID: {match_id})")
                return match_id

        except Exception as e:
            self.logger.error(f"Hiba jövőbeli meccs betöltéskor: {e}")
            return None

    def load_league_table(self, table_data: Dict, source_pdf: str, confidence: float = 0.0) -> bool:
        """
        Liga táblázat betöltése az adatbázisba
        """
        try:
            with self.get_connection() as conn:
                for team_data in table_data.get('teams', []):
                    team_id = self.find_or_create_team(
                        team_data.get('team_name', ''),
                        table_data.get('league', ''),
                        'Hungary'
                    )

                    conn.execute("""
                        INSERT OR REPLACE INTO league_tables (
                            league, season, matchday, snapshot_date, team_id, team_name,
                            position, points, matches_played, wins, draws, losses,
                            goals_for, goals_against, goal_difference, source_pdf, extraction_confidence
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        table_data.get('league', ''),
                        table_data.get('season', ''),
                        table_data.get('matchday'),
                        table_data.get('date'),
                        team_id,
                        team_data.get('team_name', ''),
                        team_data.get('position', 0),  # Use the position from team_data
                        team_data.get('points', 0),
                        team_data.get('matches_played', 0),
                        team_data.get('wins', 0),
                        team_data.get('draws', 0),
                        team_data.get('losses', 0),
                        team_data.get('goals_for', 0),
                        team_data.get('goals_against', 0),
                        team_data.get('goal_difference', 0),
                        source_pdf,
                        confidence
                    ))

                self.logger.info(f"Liga táblázat betöltve: {table_data.get('league')} ({len(table_data.get('teams', []))} csapat)")
                return True

        except Exception as e:
            self.logger.error(f"Hiba liga táblázat betöltéskor: {e}")
            return False

    def log_extraction(self, pdf_filename: str, pdf_path: str, status: str = 'processing') -> int:
        """
        PDF feldolgozás naplózása
        """
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO extraction_logs (pdf_filename, pdf_path, status)
                VALUES (?, ?, ?)
            """, (pdf_filename, pdf_path, status))
            return cursor.lastrowid

    def update_extraction_log(self, log_id: int, status: str, stats: Dict = None):
        """
        Extraction log frissítése
        """
        with self.get_connection() as conn:
            if stats:
                conn.execute("""
                    UPDATE extraction_logs
                    SET status = ?, processing_completed = ?, records_extracted = ?,
                        matches_found = ?, tables_found = ?, avg_confidence = ?
                    WHERE log_id = ?
                """, (
                    status,
                    datetime.now(),
                    stats.get('records_extracted', 0),
                    stats.get('matches_found', 0),
                    stats.get('tables_found', 0),
                    stats.get('avg_confidence', 0.0),
                    log_id
                ))
            else:
                conn.execute("""
                    UPDATE extraction_logs
                    SET status = ?, processing_completed = ?
                    WHERE log_id = ?
                """, (status, datetime.now(), log_id))

def process_single_pdf(pdf_path: str, loader: DatabaseLoader) -> Dict:
    """
    Egyetlen PDF feldolgozása
    """
    pdf_path = Path(pdf_path)

    if not pdf_path.exists():
        return {'success': False, 'error': f'PDF nem található: {pdf_path}'}

    # Extraction log indítása
    log_id = loader.log_extraction(pdf_path.name, str(pdf_path))

    try:
        loader.logger.info(f"PDF feldolgozás kezdése: {pdf_path.name}")

        if PDF_PROCESSOR_AVAILABLE:
            # PDF feldolgozás a rendelkezésre álló processzorral
            if PROCESSOR_TYPE == "ultra_precise":
                extractor = UltraPreciseFootballExtractor()
            else:  # simple
                extractor = SimplePdfProcessor()

            matches = extractor.process_pdf(str(pdf_path))

            historical_matches = []
            future_matches = []
            league_tables = []

            if matches:
                for match in matches:
                    # Dátum alapján eldöntjük, hogy történelmi vagy jövőbeli meccs-e
                    match_date = match.match_date
                    if match_date:
                        try:
                            # Próbáljuk meg értelmezni a dátumot
                            match_datetime = datetime.strptime(match_date, '%Y-%m-%d')
                            today = datetime.now()

                            match_data = {
                                'home_team': match.home_team,
                                'away_team': match.away_team,
                                'date': match_date,
                                'time': match.match_time,
                                'league': match.league_info or 'Ismeretlen',
                                'season': '2024/25',  # Default érték
                                'odds': {
                                    '1': match.odds_1,
                                    'X': match.odds_x,
                                    '2': match.odds_2
                                }
                            }

                            if match_datetime < today:
                                # Történelmi meccs (ha van eredmény)
                                match_data.update({
                                    'status': 'completed'
                                })
                                historical_matches.append(match_data)
                            else:
                                # Jövőbeli meccs
                                future_matches.append(match_data)

                        except ValueError:
                            # Ha nem sikerült a dátum értelmezése, jövőbeli meccsnek tekintjük
                            match_data = {
                                'home_team': match.home_team,
                                'away_team': match.away_team,
                                'date': match_date,
                                'time': match.match_time,
                                'league': match.league_info or 'Ismeretlen',
                                'season': '2024/25',
                                'odds': {
                                    '1': match.odds_1,
                                    'X': match.odds_x,
                                    '2': match.odds_2
                                }
                            }
                            future_matches.append(match_data)

                # Adatok betöltése az adatbázisba
                for match_data in historical_matches:
                    loader.load_historical_match(
                        match_data,
                        pdf_path.name,
                        match.confidence
                    )

                for match_data in future_matches:
                    loader.load_future_match(
                        match_data,
                        pdf_path.name,
                        match.confidence
                    )

                # Statisztikák
                avg_confidence = sum(m.confidence for m in matches) / len(matches) if matches else 0.0
                stats = {
                    'records_extracted': len(historical_matches) + len(future_matches),
                    'matches_found': len(historical_matches) + len(future_matches),
                    'tables_found': len(league_tables),
                    'avg_confidence': avg_confidence
                }

            else:
                # Ha nem sikerült az extractálás
                stats = {
                    'records_extracted': 0,
                    'matches_found': 0,
                    'tables_found': 0,
                    'avg_confidence': 0.0
                }
        else:
            # Demo adatok, ha nincs PDF processor
            stats = {
                'records_extracted': 0,
                'matches_found': 0,
                'tables_found': 0,
                'avg_confidence': 0.0
            }

        # Log frissítése
        loader.update_extraction_log(log_id, 'completed', stats)

        return {
            'success': True,
            'stats': stats
        }

    except Exception as e:
        loader.logger.error(f"Hiba PDF feldolgozáskor: {e}")
        loader.update_extraction_log(log_id, 'failed')
        return {'success': False, 'error': str(e)}

def main():
    """Fő feldolgozási folyamat"""

    print("🚀 PDF Adatbetöltési Pipeline Indítása")
    print("=" * 50)

    # Adatbázis betöltő inicializálása
    try:
        loader = DatabaseLoader()
        print(f"✅ Adatbázis kapcsolat: {loader.db_path}")
    except Exception as e:
        print(f"❌ Hiba adatbázis kapcsolatnál: {e}")
        return False

    # Archívum könyvtár ellenőrzése
    archive_path = Path(__file__).parent / 'data' / 'szerencsemix_archive' / 'organized'

    if not archive_path.exists():
        print(f"❌ Archívum könyvtár nem található: {archive_path}")
        return False

    print(f"📁 Archívum könyvtár: {archive_path}")

    # PDF fájlok keresése
    pdf_files = list(archive_path.rglob("*.pdf"))

    print(f"📄 Talált PDF fájlok: {len(pdf_files)}")

    if len(pdf_files) == 0:
        print("⚠️ Nincs feldolgozható PDF fájl")
        return False

    # Első néhány PDF feldolgozása teszteléshez
    test_limit = 5
    test_files = pdf_files[:test_limit]

    print(f"🧪 Teszt feldolgozás: {len(test_files)} fájl")
    print("-" * 30)

    success_count = 0

    for pdf_file in test_files:
        result = process_single_pdf(pdf_file, loader)

        if result['success']:
            success_count += 1
            print(f"✅ {pdf_file.name}: {result['stats']['records_extracted']} rekord")
        else:
            print(f"❌ {pdf_file.name}: {result.get('error', 'Ismeretlen hiba')}")

    print("-" * 30)
    print(f"📊 Összesítés: {success_count}/{len(test_files)} siker")

    # Adatbázis állapot ellenőrzése
    with loader.get_connection() as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM historical_matches")
        historical_count = cursor.fetchone()[0]

        cursor = conn.execute("SELECT COUNT(*) FROM future_matches")
        future_count = cursor.fetchone()[0]

        cursor = conn.execute("SELECT COUNT(*) FROM teams")
        teams_count = cursor.fetchone()[0]

        cursor = conn.execute("SELECT COUNT(*) FROM extraction_logs")
        logs_count = cursor.fetchone()[0]

    print(f"📈 Adatbázis állapot:")
    print(f"   - Történelmi meccsek: {historical_count}")
    print(f"   - Jövőbeli meccsek: {future_count}")
    print(f"   - Csapatok: {teams_count}")
    print(f"   - Feldolgozási naplók: {logs_count}")

    return True

if __name__ == "__main__":
    main()

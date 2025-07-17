#!/usr/bin/env python3
"""
🕒 FORDÍTOTT IDŐRENDI PDF FELDOLGOZÓ
========================================

Célja: A legfrissebb PDF-ektől visszafelé haladva feldolgozni az archívumot
- Jövőbeli meccsek kinyerése (holnapi meccsek listája)
- Történelmi adatok mentése
- Időrendi sorrend: 2025.06.27 → 2019

Készítette: Sport Prediction System
Dátum: 2025-06-28
"""

import os
import sys
import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import glob

# Saját modulok importálása
sys.path.append('/home/bandi/Documents/code/2025/sport-prediction')
from szerencsemix_football_extractor import SzerencsMixFootballExtractor

class TimeReverseProcessor:
    """Visszafelé dolgozó PDF feldolgozó"""

    def __init__(self):
        self.project_root = Path(__file__).parent
        self.db_path = self.project_root / 'data' / 'football_database.db'
        self.archive_path = self.project_root / 'data' / 'szerencsemix_archive' / 'organized'

    def get_recent_pdfs(self, limit: int = 10) -> List[Path]:
        """Legfrissebb PDF fájlok listája"""
        pdf_files = []

        # 2025-ös fájlok keresése
        for year_dir in sorted(self.archive_path.iterdir(), reverse=True):
            if year_dir.is_dir() and year_dir.name.startswith('2025'):
                for month_dir in sorted(year_dir.iterdir(), reverse=True):
                    if month_dir.is_dir():
                        for pdf_file in sorted(month_dir.glob('*.pdf'), reverse=True):
                            pdf_files.append(pdf_file)
                            if len(pdf_files) >= limit:
                                return pdf_files

        return pdf_files

    def extract_date_from_filename(self, filename: str) -> str:
        """Dátum kinyerése fájlnévből"""
        # Minta: Web__51sz__P__06-27_2025.06.27.pdf
        date_pattern = r'(\d{4})\.(\d{2})\.(\d{2})'
        match = re.search(date_pattern, filename)

        if match:
            year, month, day = match.groups()
            return f"{year}-{month}-{day}"
        return None

    def simple_pdf_analysis(self, pdf_path: Path) -> Dict:
        """
        Egyszerű PDF elemzés fájlnév alapján (pdfplumber nélkül)
        Ez egy mock implementáció, hogy lássuk a folyamatot
        """
        filename = pdf_path.name
        date_str = self.extract_date_from_filename(filename)

        # Mock meccs adatok létrehozása a dátum alapján
        if date_str:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')

            # Jövőbeli meccsek generálása (date_obj után 1-7 nappal)
            future_matches = []
            for i in range(3):  # 3 jövőbeli meccs per PDF
                future_date = date_obj + timedelta(days=i+1)

                # Ha a jövőbeli dátum ma után van
                if future_date.date() > datetime.now().date():
                    future_matches.append({
                        'home_team': f'Csapat A{i+1}',
                        'away_team': f'Csapat B{i+1}',
                        'date': future_date.strftime('%Y-%m-%d'),
                        'time': f'{15+i}:00',
                        'league': 'NB I',
                        'odds': {
                            '1': round(1.8 + i*0.2, 2),
                            'X': round(3.0 + i*0.1, 2),
                            '2': round(2.5 + i*0.3, 2)
                        },
                        'confidence': 0.7
                    })

            # Történelmi meccsek (date_obj előtt)
            historical_matches = []
            for i in range(2):  # 2 történelmi meccs per PDF
                past_date = date_obj - timedelta(days=i+1)
                historical_matches.append({
                    'home_team': f'Csapat C{i+1}',
                    'away_team': f'Csapat D{i+1}',
                    'date': past_date.strftime('%Y-%m-%d'),
                    'time': f'{18+i}:00',
                    'league': 'NB I',
                    'home_score': i+1,
                    'away_score': 2-i,
                    'confidence': 0.8
                })

            return {
                'pdf_date': date_str,
                'future_matches': future_matches,
                'historical_matches': historical_matches,
                'success': True
            }

        return {'success': False, 'error': 'Nem sikerült dátumot kinyerni'}

    def load_matches_to_db(self, matches_data: Dict, source_pdf: str):
        """Meccsek betöltése az adatbázisba"""

        conn = sqlite3.connect(str(self.db_path))

        try:
            # Jövőbeli meccsek
            for match in matches_data.get('future_matches', []):
                # Csapatok keresése/létrehozása
                home_team_id = self.find_or_create_team(conn, match['home_team'])
                away_team_id = self.find_or_create_team(conn, match['away_team'])

                # Meccs beszúrása
                conn.execute("""
                    INSERT OR IGNORE INTO future_matches (
                        date, time, home_team, away_team, home_team_id, away_team_id,
                        league, betting_odds, source_pdf, extraction_confidence
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    match['date'],
                    match['time'],
                    match['home_team'],
                    match['away_team'],
                    home_team_id,
                    away_team_id,
                    match['league'],
                    json.dumps(match['odds']),
                    source_pdf,
                    match['confidence']
                ))

            # Történelmi meccsek
            for match in matches_data.get('historical_matches', []):
                home_team_id = self.find_or_create_team(conn, match['home_team'])
                away_team_id = self.find_or_create_team(conn, match['away_team'])

                conn.execute("""
                    INSERT OR IGNORE INTO historical_matches (
                        date, time, home_team, away_team, home_team_id, away_team_id,
                        league, home_score, away_score, source_pdf, extraction_confidence
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    match['date'],
                    match['time'],
                    match['home_team'],
                    match['away_team'],
                    home_team_id,
                    away_team_id,
                    match['league'],
                    match['home_score'],
                    match['away_score'],
                    source_pdf,
                    match['confidence']
                ))

            conn.commit()

        finally:
            conn.close()

    def find_or_create_team(self, conn, team_name: str) -> int:
        """Csapat keresése vagy létrehozása"""
        cursor = conn.execute("SELECT team_id FROM teams WHERE team_name = ?", (team_name,))
        result = cursor.fetchone()

        if result:
            return result[0]

        # Új csapat létrehozása
        cursor = conn.execute("""
            INSERT INTO teams (team_name, normalized_name, country, last_seen)
            VALUES (?, ?, ?, date('now'))
        """, (team_name, team_name, 'Hungary'))

        return cursor.lastrowid

    def process_recent_pdfs(self, limit: int = 10):
        """Legfrissebb PDF-ek feldolgozása"""

        print("🚀 VISSZAFELÉ DOLGOZÓ PDF FELDOLGOZÓ")
        print("=" * 50)

        # Legfrissebb PDF-ek lekérése
        recent_pdfs = self.get_recent_pdfs(limit)

        print(f"📁 Találtam {len(recent_pdfs)} friss PDF-et")
        print()

        total_future = 0
        total_historical = 0

        for i, pdf_path in enumerate(recent_pdfs, 1):
            print(f"📄 {i}/{len(recent_pdfs)}: {pdf_path.name}")

            # PDF elemzés
            result = self.simple_pdf_analysis(pdf_path)

            if result['success']:
                future_count = len(result['future_matches'])
                historical_count = len(result['historical_matches'])

                print(f"   📅 PDF dátum: {result['pdf_date']}")
                print(f"   🚀 Jövőbeli meccsek: {future_count}")
                print(f"   📊 Történelmi meccsek: {historical_count}")

                # Adatbázisba mentés
                self.load_matches_to_db(result, pdf_path.name)

                total_future += future_count
                total_historical += historical_count

                # Jövőbeli meccsek listázása
                for match in result['future_matches']:
                    print(f"      🎯 {match['date']} {match['time']}: {match['home_team']} vs {match['away_team']}")
                    print(f"         Szorzók: {match['odds']['1']}/{match['odds']['X']}/{match['odds']['2']}")

            else:
                print(f"   ❌ Hiba: {result.get('error', 'Ismeretlen hiba')}")

            print()

        print("📈 ÖSSZESÍTÉS:")
        print(f"   🚀 Összes jövőbeli meccs: {total_future}")
        print(f"   📊 Összes történelmi meccs: {total_historical}")

        # Adatbázis állapot
        self.check_database_status()

    def check_database_status(self):
        """Adatbázis állapot ellenőrzése"""

        conn = sqlite3.connect(str(self.db_path))

        try:
            cursor = conn.execute("SELECT COUNT(*) FROM future_matches")
            future_count = cursor.fetchone()[0]

            cursor = conn.execute("SELECT COUNT(*) FROM historical_matches")
            historical_count = cursor.fetchone()[0]

            cursor = conn.execute("SELECT COUNT(*) FROM teams")
            teams_count = cursor.fetchone()[0]

            print("💾 ADATBÁZIS ÁLLAPOT:")
            print(f"   🚀 Jövőbeli meccsek: {future_count}")
            print(f"   📊 Történelmi meccsek: {historical_count}")
            print(f"   👥 Csapatok: {teams_count}")

            # Mai/holnapi meccsek
            cursor = conn.execute("""
                SELECT date, time, home_team, away_team, league
                FROM future_matches
                WHERE date >= date('now')
                ORDER BY date, time
                LIMIT 5
            """)

            upcoming = cursor.fetchall()

            if upcoming:
                print("\n🎯 KÖVETKEZŐ MECCSEK:")
                for match in upcoming:
                    print(f"   {match[0]} {match[1]}: {match[2]} vs {match[3]} ({match[4]})")

        finally:
            conn.close()

def main():
    processor = TimeReverseProcessor()
    processor.process_recent_pdfs(limit=5)  # Első 5 PDF tesztelésre

if __name__ == "__main__":
    main()

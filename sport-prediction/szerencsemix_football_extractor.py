#!/usr/bin/env python3
"""
Komplett futball meccs kinyerő SzerencseMix PDF-ekből
"""

import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
import sqlite3

class SzerencseMixFootballExtractor:
    """SzerencseMix PDF-ekből futball meccseket kinyerő"""

    def __init__(self):
        self.project_root = Path(__file__).parent
        self.db_path = self.project_root / 'data' / 'football_database.db'

    def extract_pdf_text(self, pdf_path: Path) -> Optional[str]:
        """PDF szöveg kinyerése"""
        try:
            result = subprocess.run([
                'pdftotext', '-layout', str(pdf_path), '-'
            ], capture_output=True, text=True, timeout=30)

            if result.returncode == 0:
                return result.stdout
            return None
        except:
            return None

    def parse_football_matches(self, text: str, pdf_date: str) -> List[Dict]:
        """Futball meccsek felismerése a szövegből"""

        matches = []
        lines = text.split('\n')

        # Napok magyar nevei
        day_mapping = {
            'Hét': 'Monday', 'Kedd': 'Tuesday', 'Sze': 'Wednesday',
            'Csü': 'Thursday', 'Pén': 'Friday', 'Szo': 'Saturday', 'Vas': 'Sunday'
        }

        current_date = None

        for line in lines:
            # Futball meccs felismerése
            # Minta: "Szo 22:00    04757            Benfica - Chelsea                                                                                                            3,55   3,45 1,86"

            # Nap és időpont felismerése
            day_time_match = re.match(r'(Hét|Kedd|Sze|Csü|Pén|Szo|Vas)\s+(\d{1,2}:\d{2})', line)
            if day_time_match:
                day_hun = day_time_match.group(1)
                time_str = day_time_match.group(2)

                # Dátum kiszámítása
                pdf_datetime = datetime.strptime(pdf_date, '%Y-%m-%d')
                current_date = self.calculate_match_date(pdf_datetime, day_hun)

                # Meccs adatok felismerése ugyanabban a sorban
                match_pattern = r'(Hét|Kedd|Sze|Csü|Pén|Szo|Vas)\s+(\d{1,2}:\d{2})\s+(\d{4,5})\s+(.+?)\s+(\d+[.,]\d{2})\s+(\d+[.,]\d{2})\s+(\d+[.,]\d{2})'
                match_match = re.search(match_pattern, line)

                if match_match:
                    time_str = match_match.group(2)
                    match_id = match_match.group(3)
                    teams_str = match_match.group(4).strip()
                    odds_1 = float(match_match.group(5).replace(',', '.'))
                    odds_x = float(match_match.group(6).replace(',', '.'))
                    odds_2 = float(match_match.group(7).replace(',', '.'))

                    # Csapatok szétválasztása
                    if ' - ' in teams_str:
                        home_team, away_team = teams_str.split(' - ', 1)
                        home_team = home_team.strip()
                        away_team = away_team.strip()

                        # Liga felismerése
                        league = self.detect_league(home_team, away_team)

                        # Meccs objektum
                        match_data = {
                            'home_team': home_team,
                            'away_team': away_team,
                            'date': current_date.strftime('%Y-%m-%d') if current_date else pdf_date,
                            'time': time_str,
                            'league': league,
                            'odds_1': odds_1,
                            'odds_x': odds_x,
                            'odds_2': odds_2,
                            'match_id': match_id,
                            'confidence': 0.85,
                            'source_line': line.strip()
                        }

                        matches.append(match_data)

        return matches

    def calculate_match_date(self, pdf_date: datetime, day_hun: str) -> datetime:
        """Meccs dátumának kiszámítása PDF dátuma és nap alapján"""

        day_mapping = {
            'Hét': 0, 'Kedd': 1, 'Sze': 2, 'Csü': 3,
            'Pén': 4, 'Szo': 5, 'Vas': 6
        }

        target_weekday = day_mapping.get(day_hun, 0)
        current_weekday = pdf_date.weekday()

        # Hány nappal előre van a célnap
        days_ahead = target_weekday - current_weekday

        # Ha negatív, akkor a következő héten van
        if days_ahead < 0:
            days_ahead += 7

        return pdf_date + timedelta(days=days_ahead)

    def detect_league(self, home_team: str, away_team: str) -> str:
        """Liga felismerése csapat nevek alapján"""

        teams_text = f"{home_team} {away_team}".lower()

        # Európai topligák
        if any(keyword in teams_text for keyword in [
            'real madrid', 'barcelona', 'atletico', 'valencia', 'sevilla'
        ]):
            return 'La Liga'

        elif any(keyword in teams_text for keyword in [
            'liverpool', 'manchester', 'arsenal', 'chelsea', 'tottenham',
            'city', 'united', 'everton', 'leicester'
        ]):
            return 'Premier League'

        elif any(keyword in teams_text for keyword in [
            'bayern', 'dortmund', 'leipzig', 'leverkusen', 'stuttgart',
            'frankfurt', 'union', 'gladbach'
        ]):
            return 'Bundesliga'

        elif any(keyword in teams_text for keyword in [
            'juventus', 'milan', 'inter', 'napoli', 'roma', 'lazio',
            'fiorentina', 'atalanta'
        ]):
            return 'Serie A'

        elif any(keyword in teams_text for keyword in [
            'psg', 'marseille', 'lyon', 'lille', 'monaco', 'nice'
        ]):
            return 'Ligue 1'

        # Magyar bajnokság
        elif any(keyword in teams_text for keyword in [
            'ferencváros', 'ftc', 'újpest', 'mtk', 'honvéd', 'vasas',
            'debrecen', 'dvsc', 'paks', 'fehérvár', 'vidi', 'kisvárda'
        ]):
            return 'NB I'

        # Nemzetközi tornák
        elif any(keyword in teams_text for keyword in [
            'benfica', 'porto', 'ajax', 'psv', 'galatasaray'
        ]):
            return 'Champions League'

        else:
            return 'Ismeretlen Liga'

    def load_matches_to_database(self, matches: List[Dict], source_pdf: str):
        """Meccsek betöltése az adatbázisba"""

        conn = sqlite3.connect(str(self.db_path))

        try:
            for match in matches:
                # Csapatok létrehozása/keresése
                home_team_id = self.find_or_create_team(conn, match['home_team'])
                away_team_id = self.find_or_create_team(conn, match['away_team'])

                # Jövőbeli meccs-e?
                match_date = datetime.strptime(match['date'], '%Y-%m-%d')
                is_future = match_date.date() > datetime.now().date()

                if is_future:
                    # Jövőbeli meccs
                    conn.execute("""
                        INSERT OR IGNORE INTO future_matches (
                            date, time, home_team, away_team, home_team_id, away_team_id,
                            league, betting_odds, source_pdf, extraction_confidence
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        match['date'], match['time'], match['home_team'], match['away_team'],
                        home_team_id, away_team_id, match['league'],
                        json.dumps({
                            '1': match['odds_1'],
                            'X': match['odds_x'],
                            '2': match['odds_2']
                        }),
                        source_pdf, match['confidence']
                    ))
                else:
                    # Történelmi meccs
                    conn.execute("""
                        INSERT OR IGNORE INTO historical_matches (
                            date, time, home_team, away_team, home_team_id, away_team_id,
                            league, source_pdf, extraction_confidence
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        match['date'], match['time'], match['home_team'], match['away_team'],
                        home_team_id, away_team_id, match['league'],
                        source_pdf, match['confidence']
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

        cursor = conn.execute("""
            INSERT INTO teams (team_name, normalized_name, country, last_seen)
            VALUES (?, ?, ?, date('now'))
        """, (team_name, team_name, 'International'))

        return cursor.lastrowid

    def process_recent_pdfs(self, limit: int = 5):
        """Legfrissebb PDF-ek feldolgozása"""

        print("⚽ SZERENCSEMIX FUTBALL EXTRACTOR")
        print("=" * 50)

        # Legfrissebb PDF-ek keresése
        archive_path = self.project_root / 'data' / 'szerencsemix_archive' / 'organized'

        pdf_files = []
        for year_dir in sorted(archive_path.iterdir(), reverse=True):
            if year_dir.is_dir() and year_dir.name.startswith('2025'):
                for month_dir in sorted(year_dir.iterdir(), reverse=True):
                    if month_dir.is_dir():
                        for pdf_file in sorted(month_dir.glob('*.pdf'), reverse=True):
                            pdf_files.append(pdf_file)
                            if len(pdf_files) >= limit:
                                break
                    if len(pdf_files) >= limit:
                        break
                if len(pdf_files) >= limit:
                    break

        print(f"📁 Feldolgozandó PDF-ek: {len(pdf_files)}")
        print()

        total_matches = 0
        future_matches = 0

        for i, pdf_path in enumerate(pdf_files, 1):
            print(f"📄 {i}/{len(pdf_files)}: {pdf_path.name}")

            # Dátum kinyerése
            date_pattern = r'(\d{4})\.(\d{2})\.(\d{2})'
            date_match = re.search(date_pattern, pdf_path.name)

            if not date_match:
                print("   ❌ Nem sikerült dátumot kinyerni")
                continue

            year, month, day = date_match.groups()
            pdf_date = f"{year}-{month}-{day}"

            # PDF szöveg kinyerése
            text = self.extract_pdf_text(pdf_path)

            if not text:
                print("   ❌ Nem sikerült szöveget kinyerni")
                continue

            # Meccsek felismerése
            matches = self.parse_football_matches(text, pdf_date)

            print(f"   📅 PDF dátum: {pdf_date}")
            print(f"   ⚽ Talált meccsek: {len(matches)}")

            # Jövőbeli meccsek számlálása
            today = datetime.now().date()
            future_count = sum(1 for m in matches if datetime.strptime(m['date'], '%Y-%m-%d').date() > today)

            print(f"   🚀 Jövőbeli meccsek: {future_count}")

            # Meccsek kiírása
            for match in matches[:3]:  # Első 3 meccs
                future_mark = "🚀" if datetime.strptime(match['date'], '%Y-%m-%d').date() > today else "📊"
                odds_str = f"{match['odds_1']}/{match['odds_x']}/{match['odds_2']}"
                print(f"      {future_mark} {match['date']} {match['time']}: {match['home_team']} vs {match['away_team']} ({odds_str}) - {match['league']}")

            if len(matches) > 3:
                print(f"      ... és még {len(matches)-3} meccs")

            # Adatbázisba mentés
            if matches:
                self.load_matches_to_database(matches, pdf_path.name)

            total_matches += len(matches)
            future_matches += future_count

            print()

        print("📈 ÖSSZESÍTÉS:")
        print(f"   ⚽ Összes meccs: {total_matches}")
        print(f"   🚀 Jövőbeli meccsek: {future_matches}")
        print(f"   📊 Történelmi meccsek: {total_matches - future_matches}")

        # Adatbázis állapot
        self.show_database_status()

    def show_database_status(self):
        """Adatbázis állapot megjelenítése"""

        conn = sqlite3.connect(str(self.db_path))

        try:
            # Számlálások
            cursor = conn.execute("SELECT COUNT(*) FROM future_matches")
            future_total = cursor.fetchone()[0]

            cursor = conn.execute("SELECT COUNT(*) FROM historical_matches")
            historical_total = cursor.fetchone()[0]

            cursor = conn.execute("SELECT COUNT(*) FROM teams")
            teams_total = cursor.fetchone()[0]

            print("💾 ADATBÁZIS ÁLLAPOT:")
            print(f"   🚀 Jövőbeli meccsek: {future_total}")
            print(f"   📊 Történelmi meccsek: {historical_total}")
            print(f"   👥 Csapatok: {teams_total}")

            # Következő meccsek
            cursor = conn.execute("""
                SELECT date, time, home_team, away_team, league
                FROM future_matches
                WHERE date >= date('now')
                ORDER BY date, time
                LIMIT 10
            """)

            upcoming = cursor.fetchall()

            if upcoming:
                print("\n🎯 KÖVETKEZŐ MECCSEK:")
                for match in upcoming:
                    print(f"   {match[0]} {match[1]}: {match[2]} vs {match[3]} ({match[4]})")

            # Liga statisztikák
            cursor = conn.execute("""
                SELECT league, COUNT(*) as count
                FROM future_matches
                GROUP BY league
                ORDER BY count DESC
                LIMIT 5
            """)

            leagues = cursor.fetchall()

            if leagues:
                print("\n🏆 JÖVŐBELI MECCSEK LIGÁK SZERINT:")
                for league, count in leagues:
                    print(f"   {league}: {count} meccs")

        finally:
            conn.close()

def main():
    extractor = SzerencseMixFootballExtractor()
    extractor.process_recent_pdfs(limit=3)  # Első 3 PDF feldolgozása

if __name__ == "__main__":
    main()

import PyPDF2
import pdfplumber
import pandas as pd
import re
import json
import sqlite3
from datetime import datetime
import os
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class MatchResult:
    """Lejátszott meccs eredmény"""
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    date: Optional[str] = None
    league: Optional[str] = None
    matchday: Optional[int] = None
    season: str = "2025"

@dataclass
class TeamStats:
    """Csapat statisztikák egy bajnokságban"""
    team_name: str
    league: str
    position: int
    matches_played: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int
    form: Optional[str] = None  # Utolsó 5 meccs formája
    season: str = "2025"

@dataclass
class UpcomingMatch:
    """Jövőbeli meccs odds-okkal"""
    home_team: str
    away_team: str
    date: Optional[str] = None
    time: Optional[str] = None
    league: Optional[str] = None
    odds_home: Optional[float] = None
    odds_draw: Optional[float] = None
    odds_away: Optional[float] = None
    bet_type: Optional[str] = None
    season: str = "2025"

class EnhancedPDFProcessor:
    """
    Továbbfejlesztett PDF feldolgozó:
    - Meccs eredmények
    - Bajnoki táblázatok
    - Jövőbeli meccsek odds-okkal
    - SQLite adatbázis integráció
    """

    def __init__(self, db_path: str = "football_data.db"):
        self.db_path = db_path
        self.match_results: List[MatchResult] = []
        self.team_stats: List[TeamStats] = []
        self.upcoming_matches: List[UpcomingMatch] = []
        self.debug_output = []

        # Adatbázis inicializálása
        self.init_database()

    def init_database(self):
        """SQLite adatbázis létrehozása és táblák inicializálása"""
        print("🗃️ Adatbázis inicializálása...")

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Meccs eredmények tábla
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS match_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                home_team TEXT NOT NULL,
                away_team TEXT NOT NULL,
                home_score INTEGER NOT NULL,
                away_score INTEGER NOT NULL,
                date TEXT,
                league TEXT,
                matchday INTEGER,
                season TEXT DEFAULT '2025',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Csapat statisztikák tábla
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS team_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_name TEXT NOT NULL,
                league TEXT NOT NULL,
                position INTEGER,
                matches_played INTEGER,
                wins INTEGER,
                draws INTEGER,
                losses INTEGER,
                goals_for INTEGER,
                goals_against INTEGER,
                goal_difference INTEGER,
                points INTEGER,
                form TEXT,
                season TEXT DEFAULT '2025',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(team_name, league, season)
            )
        ''')

        # Jövőbeli meccsek tábla
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS upcoming_matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                home_team TEXT NOT NULL,
                away_team TEXT NOT NULL,
                date TEXT,
                time TEXT,
                league TEXT,
                odds_home REAL,
                odds_draw REAL,
                odds_away REAL,
                bet_type TEXT,
                season TEXT DEFAULT '2025',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        conn.commit()
        conn.close()
        print("✅ Adatbázis sikeresen inicializálva")

    def extract_text_with_structure(self, pdf_path: str) -> str:
        """PDF szöveg kinyerése strukturált formában"""
        print(f"📄 PDF feldolgozása: {pdf_path}")

        text_content = ""

        try:
            with pdfplumber.open(pdf_path) as pdf:
                print(f"📊 PDF oldalak száma: {len(pdf.pages)}")

                for page_num, page in enumerate(pdf.pages):
                    print(f"🔍 Oldal {page_num + 1} feldolgozása...")

                    # Szöveg kinyerése
                    page_text = page.extract_text()
                    if page_text:
                        text_content += f"\n=== OLDAL {page_num + 1} ===\n"
                        text_content += page_text
                        text_content += "\n\n"

                    # Táblázatok strukturált kinyerése
                    tables = page.extract_tables()
                    if tables:
                        print(f"📋 {len(tables)} táblázat találva")
                        for table_idx, table in enumerate(tables):
                            text_content += f"\n=== TÁBLÁZAT {page_num + 1}.{table_idx + 1} ===\n"
                            self._process_table(table, text_content)

        except Exception as e:
            print(f"❌ PDF feldolgozási hiba: {e}")
            return ""

        return text_content

    def _process_table(self, table: List[List], text_content: str) -> str:
        """Táblázat strukturált feldolgozása"""
        if not table:
            return text_content

        # Fejléc detektálása
        header = table[0] if table else []

        # Bajnoki táblázat detektálása
        if self._is_league_table(header):
            self._extract_league_table(table)

        # Eredmény táblázat detektálása
        elif self._is_results_table(header):
            self._extract_results_table(table)

        # Táblázat hozzáadása a szöveghez
        for row in table:
            if row:
                text_content += " | ".join([str(cell) if cell else "" for cell in row]) + "\n"

        return text_content

    def _is_league_table(self, header: List) -> bool:
        """Ellenőrzi, hogy bajnoki táblázat-e"""
        if not header:
            return False

        header_text = " ".join([str(cell) for cell in header if cell]).lower()
        keywords = ["pos", "position", "team", "pts", "points", "w", "d", "l", "gf", "ga", "gd"]

        return sum(1 for keyword in keywords if keyword in header_text) >= 3

    def _is_results_table(self, header: List) -> bool:
        """Ellenőrzi, hogy eredmény táblázat-e"""
        if not header:
            return False

        header_text = " ".join([str(cell) for cell in header if cell]).lower()
        keywords = ["home", "away", "score", "result", "date", "match"]

        return sum(1 for keyword in keywords if keyword in header_text) >= 2

    def _extract_league_table(self, table: List[List]):
        """Bajnoki táblázat kinyerése"""
        print("📊 Bajnoki táblázat feldolgozása...")

        if len(table) < 2:
            return

        header = table[0]

        # Oszlop indexek keresése
        pos_idx = self._find_column_index(header, ["pos", "position", "#"])
        team_idx = self._find_column_index(header, ["team", "club", "csapat"])
        mp_idx = self._find_column_index(header, ["mp", "m", "játszott", "meccs"])
        w_idx = self._find_column_index(header, ["w", "win", "győzelem", "gy"])
        d_idx = self._find_column_index(header, ["d", "draw", "döntetlen", "d"])
        l_idx = self._find_column_index(header, ["l", "loss", "vereség", "v"])
        gf_idx = self._find_column_index(header, ["gf", "goals for", "rúgott"])
        ga_idx = self._find_column_index(header, ["ga", "goals against", "kapott"])
        gd_idx = self._find_column_index(header, ["gd", "goal difference", "különbség"])
        pts_idx = self._find_column_index(header, ["pts", "points", "pont"])

        for row_idx, row in enumerate(table[1:], 1):
            if not row or len(row) < 3:
                continue

            try:
                team_name = self._safe_get_cell(row, team_idx, "").strip()
                if not team_name:
                    continue

                position = self._safe_get_int(row, pos_idx, row_idx)
                matches_played = self._safe_get_int(row, mp_idx, 0)
                wins = self._safe_get_int(row, w_idx, 0)
                draws = self._safe_get_int(row, d_idx, 0)
                losses = self._safe_get_int(row, l_idx, 0)
                goals_for = self._safe_get_int(row, gf_idx, 0)
                goals_against = self._safe_get_int(row, ga_idx, 0)
                goal_difference = self._safe_get_int(row, gd_idx, goals_for - goals_against)
                points = self._safe_get_int(row, pts_idx, 0)

                # Liga név becslése
                league = self._estimate_league_name(team_name)

                team_stat = TeamStats(
                    team_name=team_name,
                    league=league,
                    position=position,
                    matches_played=matches_played,
                    wins=wins,
                    draws=draws,
                    losses=losses,
                    goals_for=goals_for,
                    goals_against=goals_against,
                    goal_difference=goal_difference,
                    points=points
                )

                self.team_stats.append(team_stat)
                print(f"📊 {team_name}: {position}. hely, {points} pont")

            except Exception as e:
                print(f"⚠️ Táblázat sor feldolgozási hiba: {e}")
                continue

    def _extract_results_table(self, table: List[List]):
        """Eredmény táblázat kinyerése"""
        print("⚽ Eredmények feldolgozása...")

        # Itt implementálnánk az eredmények kinyerését
        # Hasonlóan a bajnoki táblázathoz
        pass

    def extract_match_results_from_text(self, text: str):
        """Meccs eredmények kinyerése szövegből regex alapon"""
        print("⚽ Meccs eredmények keresése...")

        # Különböző eredmény patternek
        result_patterns = [
            # "Team1 vs Team2 2:1"
            r'([A-Za-z\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+?)\s+vs\s+([A-Za-z\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+?)\s+(\d+):(\d+)',
            # "Team1 - Team2 2-1"
            r'([A-Za-z\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+?)\s*-\s*([A-Za-z\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+?)\s+(\d+)-(\d+)',
            # "Team1 2:1 Team2"
            r'([A-Za-z\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+?)\s+(\d+):(\d+)\s+([A-Za-z\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)',
        ]

        for pattern in result_patterns:
            matches = re.finditer(pattern, text, re.MULTILINE)

            for match in matches:
                try:
                    if len(match.groups()) == 4:
                        home_team = match.group(1).strip()
                        away_team = match.group(2).strip()
                        home_score = int(match.group(3))
                        away_score = int(match.group(4))
                    else:
                        continue

                    # Csapat név tisztítása
                    home_team = self._clean_team_name(home_team)
                    away_team = self._clean_team_name(away_team)

                    if len(home_team) < 3 or len(away_team) < 3:
                        continue

                    result = MatchResult(
                        home_team=home_team,
                        away_team=away_team,
                        home_score=home_score,
                        away_score=away_score,
                        league=self._estimate_league_name(home_team)
                    )

                    self.match_results.append(result)
                    print(f"⚽ {home_team} {home_score}:{away_score} {away_team}")

                except Exception as e:
                    print(f"⚠️ Eredmény feldolgozási hiba: {e}")
                    continue

    def extract_upcoming_matches_from_text(self, text: str):
        """Jövőbeli meccsek és odds-ok kinyerése"""
        print("🔮 Jövőbeli meccsek keresése...")

        # Odds pattern-ek
        odds_patterns = [
            # "Team1 vs Team2 1.50 3.20 2.10"
            r'([A-Za-z\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+?)\s+vs\s+([A-Za-z\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+?)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)',
            # "Team1 - Team2 Odds: [1.50, 3.20, 2.10]"
            r'([A-Za-z\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+?)\s*-\s*([A-Za-z\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+?)\s+Odds:\s*\[(\d+\.\d+),\s*(\d+\.\d+),\s*(\d+\.\d+)\]',
        ]

        for pattern in odds_patterns:
            matches = re.finditer(pattern, text, re.MULTILINE)

            for match in matches:
                try:
                    home_team = self._clean_team_name(match.group(1).strip())
                    away_team = self._clean_team_name(match.group(2).strip())
                    odds_home = float(match.group(3))
                    odds_draw = float(match.group(4))
                    odds_away = float(match.group(5))

                    if len(home_team) < 3 or len(away_team) < 3:
                        continue

                    upcoming = UpcomingMatch(
                        home_team=home_team,
                        away_team=away_team,
                        odds_home=odds_home,
                        odds_draw=odds_draw,
                        odds_away=odds_away,
                        league=self._estimate_league_name(home_team),
                        bet_type="1X2"
                    )

                    self.upcoming_matches.append(upcoming)
                    print(f"🔮 {home_team} vs {away_team}: {odds_home}-{odds_draw}-{odds_away}")

                except Exception as e:
                    print(f"⚠️ Odds feldolgozási hiba: {e}")
                    continue

    def _find_column_index(self, header: List, keywords: List[str]) -> int:
        """Oszlop index keresése kulcsszavak alapján"""
        for i, cell in enumerate(header):
            if cell:
                cell_text = str(cell).lower().strip()
                for keyword in keywords:
                    if keyword in cell_text:
                        return i
        return -1

    def _safe_get_cell(self, row: List, index: int, default: str = "") -> str:
        """Biztonságos cella érték kinyerése"""
        if index < 0 or index >= len(row):
            return default
        return str(row[index]) if row[index] is not None else default

    def _safe_get_int(self, row: List, index: int, default: int = 0) -> int:
        """Biztonságos integer érték kinyerése"""
        cell_value = self._safe_get_cell(row, index, str(default))
        try:
            # Számok kinyerése szövegből
            numbers = re.findall(r'\d+', cell_value)
            return int(numbers[0]) if numbers else default
        except:
            return default

    def _clean_team_name(self, name: str) -> str:
        """Csapat név tisztítása"""
        # Felesleges karakterek eltávolítása
        name = re.sub(r'[^\w\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]', '', name)
        name = re.sub(r'\s+', ' ', name).strip()

        # Rövidítések javítása
        replacements = {
            'FC': 'FC',
            'CF': 'CF',
            'AC': 'AC',
            'SC': 'SC',
            'BK': 'BK',
            'FTC': 'Ferencváros',
            'MTK': 'MTK Budapest'
        }

        for old, new in replacements.items():
            if old in name:
                name = name.replace(old, new)

        return name.title()

    def _estimate_league_name(self, team_name: str) -> str:
        """Liga név becslése csapat alapján"""
        # Magyar csapatok
        hungarian_teams = ['ferencváros', 'fradi', 'ftc', 'újpest', 'honvéd', 'mtk', 'debrecen', 'videoton', 'fehérvár']
        if any(hungarian in team_name.lower() for hungarian in hungarian_teams):
            return "Magyar NB I"

        # Premier League
        epl_teams = ['arsenal', 'chelsea', 'liverpool', 'manchester', 'tottenham', 'city', 'united']
        if any(epl in team_name.lower() for epl in epl_teams):
            return "Premier League"

        # La Liga
        laliga_teams = ['barcelona', 'real madrid', 'atletico', 'valencia', 'sevilla']
        if any(team in team_name.lower() for team in laliga_teams):
            return "La Liga"

        # Bundesliga
        bundesliga_teams = ['bayern', 'dortmund', 'leipzig', 'frankfurt', 'leverkusen']
        if any(team in team_name.lower() for team in bundesliga_teams):
            return "Bundesliga"

        return "Unknown League"

    def save_to_database(self):
        """Adatok mentése SQLite adatbázisba"""
        print("💾 Adatok mentése adatbázisba...")

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Meccs eredmények mentése
        for result in self.match_results:
            cursor.execute('''
                INSERT OR REPLACE INTO match_results
                (home_team, away_team, home_score, away_score, date, league, season)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                result.home_team, result.away_team, result.home_score, result.away_score,
                result.date, result.league, result.season
            ))

        # Csapat statisztikák mentése
        for stat in self.team_stats:
            cursor.execute('''
                INSERT OR REPLACE INTO team_stats
                (team_name, league, position, matches_played, wins, draws, losses,
                 goals_for, goals_against, goal_difference, points, form, season)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                stat.team_name, stat.league, stat.position, stat.matches_played,
                stat.wins, stat.draws, stat.losses, stat.goals_for, stat.goals_against,
                stat.goal_difference, stat.points, stat.form, stat.season
            ))

        # Jövőbeli meccsek mentése
        for match in self.upcoming_matches:
            cursor.execute('''
                INSERT OR REPLACE INTO upcoming_matches
                (home_team, away_team, date, time, league, odds_home, odds_draw, odds_away, bet_type, season)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                match.home_team, match.away_team, match.date, match.time, match.league,
                match.odds_home, match.odds_draw, match.odds_away, match.bet_type, match.season
            ))

        conn.commit()
        conn.close()

        print(f"✅ Mentve: {len(self.match_results)} eredmény, {len(self.team_stats)} stat, {len(self.upcoming_matches)} jövőbeli meccs")

    def export_to_csv(self):
        """Adatok exportálása CSV fájlokba"""
        print("📊 CSV exportálás...")

        # Meccs eredmények
        if self.match_results:
            results_df = pd.DataFrame([
                {
                    'home_team': r.home_team,
                    'away_team': r.away_team,
                    'home_score': r.home_score,
                    'away_score': r.away_score,
                    'date': r.date,
                    'league': r.league,
                    'season': r.season
                }
                for r in self.match_results
            ])
            results_df.to_csv('match_results.csv', index=False, encoding='utf-8')
            print(f"✅ match_results.csv: {len(results_df)} eredmény")

        # Csapat statisztikák
        if self.team_stats:
            stats_df = pd.DataFrame([
                {
                    'team_name': s.team_name,
                    'league': s.league,
                    'position': s.position,
                    'matches_played': s.matches_played,
                    'wins': s.wins,
                    'draws': s.draws,
                    'losses': s.losses,
                    'goals_for': s.goals_for,
                    'goals_against': s.goals_against,
                    'goal_difference': s.goal_difference,
                    'points': s.points,
                    'season': s.season
                }
                for s in self.team_stats
            ])
            stats_df.to_csv('team_stats.csv', index=False, encoding='utf-8')
            print(f"✅ team_stats.csv: {len(stats_df)} csapat")

        # Jövőbeli meccsek
        if self.upcoming_matches:
            upcoming_df = pd.DataFrame([
                {
                    'home_team': m.home_team,
                    'away_team': m.away_team,
                    'date': m.date,
                    'time': m.time,
                    'league': m.league,
                    'odds_home': m.odds_home,
                    'odds_draw': m.odds_draw,
                    'odds_away': m.odds_away,
                    'bet_type': m.bet_type,
                    'season': m.season
                }
                for m in self.upcoming_matches
            ])
            upcoming_df.to_csv('upcoming_matches.csv', index=False, encoding='utf-8')
            print(f"✅ upcoming_matches.csv: {len(upcoming_df)} meccs")

    def get_database_summary(self):
        """Adatbázis tartalom összefoglalása"""
        print("📋 Adatbázis összefoglaló...")

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Eredmények száma
        cursor.execute("SELECT COUNT(*) FROM match_results")
        results_count = cursor.fetchone()[0]

        # Csapatok száma
        cursor.execute("SELECT COUNT(DISTINCT team_name) FROM team_stats")
        teams_count = cursor.fetchone()[0]

        # Ligák száma
        cursor.execute("SELECT COUNT(DISTINCT league) FROM team_stats")
        leagues_count = cursor.fetchone()[0]

        # Jövőbeli meccsek száma
        cursor.execute("SELECT COUNT(*) FROM upcoming_matches WHERE odds_home IS NOT NULL")
        upcoming_count = cursor.fetchone()[0]

        conn.close()

        print(f"📊 Adatbázis statisztikák:")
        print(f"   🏆 {results_count} meccs eredmény")
        print(f"   👥 {teams_count} különböző csapat")
        print(f"   🏟️ {leagues_count} különböző liga")
        print(f"   🔮 {upcoming_count} jövőbeli meccs odds-okkal")

def main():
    """Enhanced PDF feldolgozás tesztelése"""
    pdf_path = '/home/bandi/Documents/code/2025/sp3/pdf/Web__51sz__P__06-27_2025.06.27.pdf'

    if not os.path.exists(pdf_path):
        print(f"❌ PDF fájl nem található: {pdf_path}")
        return

    processor = EnhancedPDFProcessor()

    print("🚀 TOVÁBBFEJLESZTETT PDF FELDOLGOZÓ")
    print("=" * 50)

    # 1. PDF szöveg kinyerése
    print("\n1️⃣ PDF SZÖVEG KINYERÉSE")
    text_content = processor.extract_text_with_structure(pdf_path)

    if text_content:
        # Szöveg mentése
        with open('enhanced_extracted_text.txt', 'w', encoding='utf-8') as f:
            f.write(text_content)
        print("✅ enhanced_extracted_text.txt mentve")

        # 2. Meccs eredmények kinyerése
        print("\n2️⃣ MECCS EREDMÉNYEK KINYERÉSE")
        processor.extract_match_results_from_text(text_content)

        # 3. Jövőbeli meccsek kinyerése
        print("\n3️⃣ JÖVŐBELI MECCSEK ÉS ODDS-OK")
        processor.extract_upcoming_matches_from_text(text_content)

        # 4. Adatbázisba mentés
        print("\n4️⃣ ADATBÁZISBA MENTÉS")
        processor.save_to_database()

        # 5. CSV exportálás
        print("\n5️⃣ CSV EXPORTÁLÁS")
        processor.export_to_csv()

        # 6. Összefoglaló
        print("\n6️⃣ ÖSSZEFOGLALÓ")
        processor.get_database_summary()

        print("\n✅ TOVÁBBFEJLESZTETT FELDOLGOZÁS BEFEJEZVE")
        print("📁 Fájlok:")
        print("   📄 enhanced_extracted_text.txt")
        print("   🗃️ football_data.db")
        print("   📊 match_results.csv")
        print("   📊 team_stats.csv")
        print("   📊 upcoming_matches.csv")
    else:
        print("❌ Nem sikerült kinyerni a szöveget")

if __name__ == "__main__":
    main()

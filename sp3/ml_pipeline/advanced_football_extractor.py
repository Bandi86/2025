#!/usr/bin/env python3
"""
🚀 FEJLETT FUTBALL ADATKINYERŐ RENDSZER

Komplex PDF feldolgozó amely képes:
- Lejátszott meccsek eredményeinek automatikus felismerésére
- Bajnoki táblázatok strukturált kinyerésére
- Jövőbeli meccsek és odds-ok felismerésére
- Kisebb ligák és csapatok adatainak kezelésére
- Intelligens szöveg pattern felismerésre
- Hibatűrő adatfeldolgozásra
"""

import PyPDF2
import pdfplumber
import pandas as pd
import re
import json
import sqlite3
from datetime import datetime, timedelta
import os
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

@dataclass
class MatchResult:
    """Lejátszott meccs eredmény"""
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    date: Optional[str] = None
    time: Optional[str] = None
    league: Optional[str] = None
    matchday: Optional[int] = None
    season: str = "2025"
    competition: Optional[str] = None
    venue: Optional[str] = None

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
    form: Optional[str] = None
    home_wins: Optional[int] = None
    away_wins: Optional[int] = None
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
    over_under_odds: Optional[Dict[str, float]] = None
    btts_odds: Optional[Dict[str, float]] = None
    handicap_odds: Optional[Dict[str, float]] = None
    bet_type: Optional[str] = None
    season: str = "2025"
    bookmaker: Optional[str] = None

class AdvancedFootballExtractor:
    """
    Fejlett futball adatkinyerő osztály
    """

    def __init__(self, db_path: str = "football_master.db"):
        self.db_path = db_path
        self.match_results: List[MatchResult] = []
        self.team_stats: List[TeamStats] = []
        self.upcoming_matches: List[UpcomingMatch] = []
        self.debug_info = []

        # Liga és csapat referencia adatok
        self.league_patterns = self._init_league_patterns()
        self.team_patterns = self._init_team_patterns()

        # Adatbázis inicializálása
        self.init_database()

    def _init_league_patterns(self) -> Dict[str, List[str]]:
        """Liga felismerő pattern-ek"""
        return {
            "Premier League": ["premier", "epl", "english", "england"],
            "La Liga": ["la liga", "primera", "spain", "spanyol", "espana"],
            "Bundesliga": ["bundesliga", "german", "germany", "német"],
            "Serie A": ["serie a", "italian", "italy", "olasz"],
            "Ligue 1": ["ligue 1", "french", "france", "francia"],
            "Magyar NB I": ["nb i", "otp bank liga", "magyar", "hungary", "hungarian"],
            "Champions League": ["champions", "ucl", "cl", "bajnokok"],
            "Europa League": ["europa", "uel", "európa"],
            "Conference League": ["conference", "uecl", "konferencia"],
            "Championship": ["championship", "second tier", "másodosztály"],
            "Eredivisie": ["eredivisie", "dutch", "holland", "netherlands"],
            "Scottish Premiership": ["scottish", "scotland", "skót"],
            "Austrian Bundesliga": ["austrian", "austria", "osztrák"],
            "Swiss Super League": ["swiss", "switzerland", "svájci"],
        }

    def _init_team_patterns(self) -> Dict[str, str]:
        """Csapat név normalizáló pattern-ek"""
        return {
            # Magyar csapatok
            "ftc": "Ferencváros",
            "fradi": "Ferencváros",
            "ferencváros": "Ferencváros",
            "újpest": "Újpest",
            "ujpest": "Újpest",
            "honvéd": "Budapest Honvéd",
            "honved": "Budapest Honvéd",
            "mtk": "MTK Budapest",
            "debrecen": "Debreceni VSC",
            "videoton": "Fehérvár",
            "fehérvár": "Fehérvár",
            "paks": "Paksi FC",
            "kisvárda": "Kisvárda",

            # Premier League
            "arsenal": "Arsenal",
            "chelsea": "Chelsea",
            "liverpool": "Liverpool",
            "man city": "Manchester City",
            "man utd": "Manchester United",
            "tottenham": "Tottenham",
            "spurs": "Tottenham",

            # La Liga
            "barcelona": "Barcelona",
            "real madrid": "Real Madrid",
            "atletico": "Atletico Madrid",
            "valencia": "Valencia",
            "sevilla": "Sevilla",

            # Bundesliga
            "bayern": "Bayern Munich",
            "dortmund": "Borussia Dortmund",
            "bvb": "Borussia Dortmund",
            "leipzig": "RB Leipzig",
            "frankfurt": "Eintracht Frankfurt",
            "leverkusen": "Bayer Leverkusen",
        }

    def init_database(self):
        """Továbbfejlesztett adatbázis struktúra"""
        print("🗃️ Fejlett adatbázis inicializálása...")

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Meccs eredmények tábla (bővített)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS match_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                home_team TEXT NOT NULL,
                away_team TEXT NOT NULL,
                home_score INTEGER NOT NULL,
                away_score INTEGER NOT NULL,
                date TEXT,
                time TEXT,
                league TEXT,
                matchday INTEGER,
                season TEXT DEFAULT '2025',
                competition TEXT,
                venue TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(home_team, away_team, date, home_score, away_score)
            )
        ''')

        # Csapat statisztikák tábla (bővített)
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
                home_wins INTEGER,
                away_wins INTEGER,
                season TEXT DEFAULT '2025',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(team_name, league, season)
            )
        ''')

        # Jövőbeli meccsek tábla (bővített)
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
                over_under_odds TEXT, -- JSON
                btts_odds TEXT, -- JSON
                handicap_odds TEXT, -- JSON
                bet_type TEXT,
                season TEXT DEFAULT '2025',
                bookmaker TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(home_team, away_team, date, bookmaker)
            )
        ''')

        # Liga információk tábla
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS league_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                league_name TEXT UNIQUE NOT NULL,
                country TEXT,
                level INTEGER,
                teams_count INTEGER,
                season TEXT DEFAULT '2025',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        conn.commit()
        conn.close()
        print("✅ Fejlett adatbázis sikeresen inicializálva")

    def extract_comprehensive_data(self, pdf_path: str) -> bool:
        """Komplex PDF feldolgozás minden adattípusra"""
        print(f"🚀 Komplex feldolgozás: {os.path.basename(pdf_path)}")

        if not os.path.exists(pdf_path):
            print(f"❌ PDF fájl nem található: {pdf_path}")
            return False

        try:
            # 1. PDF szöveg kinyerése mindkét módszerrel
            text_pdfplumber = self._extract_with_pdfplumber(pdf_path)
            text_pypdf2 = self._extract_with_pypdf2(pdf_path)

            # Kombinált szöveg a legjobb eredményért
            combined_text = f"{text_pdfplumber}\n\n=== PYPDF2 BACKUP ===\n\n{text_pypdf2}"

            # 2. Strukturált adatok kinyerése
            success = True

            # Meccs eredmények
            results_found = self._extract_match_results_comprehensive(combined_text)
            print(f"⚽ {results_found} meccs eredmény találva")

            # Bajnoki táblázatok
            tables_found = self._extract_league_tables_comprehensive(combined_text, pdf_path)
            print(f"📊 {tables_found} bajnoki táblázat feldolgozva")

            # Jövőbeli meccsek és odds-ok
            upcoming_found = self._extract_upcoming_matches_comprehensive(combined_text)
            print(f"🔮 {upcoming_found} jövőbeli meccs találva")

            # Liga információk
            leagues_found = self._extract_league_info(combined_text)
            print(f"🏟️ {leagues_found} liga azonosítva")

            return success

        except Exception as e:
            print(f"❌ Feldolgozási hiba: {e}")
            self.debug_info.append(f"Error: {e}")
            return False

    def _extract_with_pdfplumber(self, pdf_path: str) -> str:
        """PDFplumber szöveg kinyerése fejlett táblázat kezeléssel"""
        text_content = ""

        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    print(f"📄 PDFplumber - Oldal {page_num + 1}")

                    # Szöveg kinyerése
                    page_text = page.extract_text()
                    if page_text:
                        text_content += f"\n=== OLDAL {page_num + 1} ===\n"
                        text_content += page_text + "\n"

                    # Táblázatok fejlett kinyerése
                    tables = page.extract_tables()
                    if tables:
                        for table_idx, table in enumerate(tables):
                            text_content += f"\n=== TÁBLÁZAT {page_num + 1}.{table_idx + 1} ===\n"
                            text_content += self._format_table_text(table)

        except Exception as e:
            print(f"⚠️ PDFplumber hiba: {e}")

        return text_content

    def _extract_with_pypdf2(self, pdf_path: str) -> str:
        """PyPDF2 backup kinyerés"""
        text_content = ""

        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page_num, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_content += f"\n=== BACKUP OLDAL {page_num + 1} ===\n"
                        text_content += page_text + "\n"

        except Exception as e:
            print(f"⚠️ PyPDF2 hiba: {e}")

        return text_content

    def _format_table_text(self, table: List[List]) -> str:
        """Táblázat szöveggé formázása"""
        if not table:
            return ""

        formatted = ""
        for row in table:
            if row:
                clean_row = [str(cell).strip() if cell else "" for cell in row]
                formatted += " | ".join(clean_row) + "\n"
        return formatted

    def _extract_match_results_comprehensive(self, text: str) -> int:
        """Komplex meccs eredmény kinyerés fejlett pattern-ekkel"""
        initial_count = len(self.match_results)

        # Fejlett eredmény pattern-ek
        patterns = [
            # "Ferencváros - Újpest 2:1"
            r'([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s*[-–]\s*([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s+(\d+):(\d+)',
            # "Arsenal vs Chelsea 2-1"
            r'([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s+vs\s+([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s+(\d+)[-:](\d+)',
            # "Barcelona 3:0 Real Madrid"
            r'([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s+(\d+):(\d+)\s+([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+)',
            # "2:1 (Bayern - Dortmund)"
            r'(\d+):(\d+)\s*\(\s*([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s*[-–]\s*([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s*\)',
            # Táblázatos eredmények
            r'([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s*\|\s*([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s*\|\s*(\d+)\s*[-:]\s*(\d+)',
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)

            for match in matches:
                try:
                    groups = match.groups()

                    if len(groups) == 4:
                        if pattern == patterns[2]:  # "Barcelona 3:0 Real Madrid" format
                            home_team = groups[0].strip()
                            home_score = int(groups[1])
                            away_score = int(groups[2])
                            away_team = groups[3].strip()
                        elif pattern == patterns[3]:  # "2:1 (Bayern - Dortmund)" format
                            home_score = int(groups[0])
                            away_score = int(groups[1])
                            home_team = groups[2].strip()
                            away_team = groups[3].strip()
                        else:  # Standard formátum
                            home_team = groups[0].strip()
                            away_team = groups[1].strip()
                            home_score = int(groups[2])
                            away_score = int(groups[3])

                        # Csapat nevek tisztítása és normalizálása
                        home_team = self._normalize_team_name(home_team)
                        away_team = self._normalize_team_name(away_team)

                        # Validálás
                        if self._validate_match_result(home_team, away_team, home_score, away_score):
                            # Dátum és liga becslése
                            date = self._extract_date_from_context(text, match.start())
                            league = self._estimate_league(home_team, away_team)

                            result = MatchResult(
                                home_team=home_team,
                                away_team=away_team,
                                home_score=home_score,
                                away_score=away_score,
                                date=date,
                                league=league
                            )

                            # Duplikáció ellenőrzése
                            if not self._is_duplicate_result(result):
                                self.match_results.append(result)
                                print(f"⚽ {home_team} {home_score}:{away_score} {away_team}")

                except Exception as e:
                    self.debug_info.append(f"Result parsing error: {e}")
                    continue

        return len(self.match_results) - initial_count

    def _extract_league_tables_comprehensive(self, text: str, pdf_path: str) -> int:
        """Komplex bajnoki táblázat kinyerés"""
        initial_count = len(self.team_stats)

        # PDFplumber-rel táblázatok újra feldolgozása
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        if self._is_league_table_advanced(table):
                            self._process_league_table_advanced(table)
        except:
            pass

        # Szöveges táblázatok keresése
        self._extract_text_based_tables(text)

        return len(self.team_stats) - initial_count

    def _is_league_table_advanced(self, table: List[List]) -> bool:
        """Fejlett bajnoki táblázat felismerés"""
        if not table or len(table) < 3:
            return False

        # Header elemzése
        header = table[0] if table else []
        if not header:
            return False

        header_text = " ".join([str(cell).lower() for cell in header if cell])

        # Bajnoki táblázat kulcsszavak
        table_keywords = [
            "pos", "position", "team", "club", "csapat", "pts", "points", "pont",
            "w", "win", "győzelem", "d", "draw", "döntetlen", "l", "loss", "vereség",
            "gf", "goals for", "rúgott", "ga", "goals against", "kapott", "gd", "diff"
        ]

        # Minimum 4 kulcsszó kell
        keyword_count = sum(1 for keyword in table_keywords if keyword in header_text)

        # Sorok száma ellenőrzése (min 5 csapat)
        data_rows = len([row for row in table[1:] if row and any(cell for cell in row)])

        return keyword_count >= 4 and data_rows >= 5

    def _process_league_table_advanced(self, table: List[List]):
        """Fejlett bajnoki táblázat feldolgozás"""
        if len(table) < 2:
            return

        header = table[0]

        # Oszlop pozíciók azonosítása
        col_map = self._map_table_columns(header)

        # Liga név becslése
        league_name = self._estimate_league_from_table(table)

        print(f"📊 Bajnoki táblázat feldolgozása: {league_name}")

        for row_idx, row in enumerate(table[1:], 1):
            if not row or len([cell for cell in row if cell]) < 3:
                continue

            try:
                # Adatok kinyerése
                team_name = self._safe_get_cell(row, col_map.get('team', -1))
                if not team_name or len(team_name) < 2:
                    continue

                team_name = self._normalize_team_name(team_name)
                position = self._safe_get_int(row, col_map.get('position', -1), row_idx)
                matches_played = self._safe_get_int(row, col_map.get('matches_played', -1))
                wins = self._safe_get_int(row, col_map.get('wins', -1))
                draws = self._safe_get_int(row, col_map.get('draws', -1))
                losses = self._safe_get_int(row, col_map.get('losses', -1))
                goals_for = self._safe_get_int(row, col_map.get('goals_for', -1))
                goals_against = self._safe_get_int(row, col_map.get('goals_against', -1))
                goal_difference = self._safe_get_int(row, col_map.get('goal_difference', -1), goals_for - goals_against)
                points = self._safe_get_int(row, col_map.get('points', -1))

                # Form kinyerése ha van
                form = self._safe_get_cell(row, col_map.get('form', -1))

                team_stat = TeamStats(
                    team_name=team_name,
                    league=league_name,
                    position=position,
                    matches_played=matches_played,
                    wins=wins,
                    draws=draws,
                    losses=losses,
                    goals_for=goals_for,
                    goals_against=goals_against,
                    goal_difference=goal_difference,
                    points=points,
                    form=form if form and len(form) < 20 else None
                )

                # Duplikáció ellenőrzése
                if not self._is_duplicate_team_stat(team_stat):
                    self.team_stats.append(team_stat)
                    print(f"📊 {position:2d}. {team_name:20s} {points:2d} pont")

            except Exception as e:
                self.debug_info.append(f"Table row error: {e}")
                continue

    def _map_table_columns(self, header: List) -> Dict[str, int]:
        """Táblázat oszlopok automatikus leképezése"""
        col_map = {}

        for i, cell in enumerate(header):
            if not cell:
                continue

            cell_lower = str(cell).lower().strip()

            # Pozíció
            if any(word in cell_lower for word in ["pos", "position", "#", "helyezés"]):
                col_map['position'] = i
            # Csapat
            elif any(word in cell_lower for word in ["team", "club", "csapat", "név"]):
                col_map['team'] = i
            # Meccsek száma
            elif any(word in cell_lower for word in ["mp", "matches", "játszott", "meccs"]):
                col_map['matches_played'] = i
            # Győzelem
            elif any(word in cell_lower for word in ["w", "win", "győzelem", "gy"]):
                col_map['wins'] = i
            # Döntetlen
            elif any(word in cell_lower for word in ["d", "draw", "döntetlen", "dö"]):
                col_map['draws'] = i
            # Vereség
            elif any(word in cell_lower for word in ["l", "loss", "vereség", "v"]):
                col_map['losses'] = i
            # Rúgott gól
            elif any(word in cell_lower for word in ["gf", "goals for", "rúgott", "r"]):
                col_map['goals_for'] = i
            # Kapott gól
            elif any(word in cell_lower for word in ["ga", "goals against", "kapott", "k"]):
                col_map['goals_against'] = i
            # Gólkülönbség
            elif any(word in cell_lower for word in ["gd", "goal diff", "különbség", "+/-"]):
                col_map['goal_difference'] = i
            # Pontok
            elif any(word in cell_lower for word in ["pts", "points", "pont", "p"]):
                col_map['points'] = i
            # Forma
            elif any(word in cell_lower for word in ["form", "forma", "last 5"]):
                col_map['form'] = i

        return col_map

    def _extract_upcoming_matches_comprehensive(self, text: str) -> int:
        """Jövőbeli meccsek és odds-ok komplex kinyerése"""
        initial_count = len(self.upcoming_matches)

        # Odds pattern-ek
        odds_patterns = [
            # "Arsenal vs Chelsea 1.85 3.40 2.10"
            r'([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s+vs\s+([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)',
            # "Barcelona - Real Madrid [1.90, 3.20, 2.05]"
            r'([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s*[-–]\s*([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s*\[(\d+\.\d+),\s*(\d+\.\d+),\s*(\d+\.\d+)\]',
            # Odds táblázat formátum
            r'([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s*\|\s*([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\.\-]+?)\s*\|\s*(\d+\.\d+)\s*\|\s*(\d+\.\d+)\s*\|\s*(\d+\.\d+)',
        ]

        for pattern in odds_patterns:
            matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)

            for match in matches:
                try:
                    home_team = self._normalize_team_name(match.group(1).strip())
                    away_team = self._normalize_team_name(match.group(2).strip())
                    odds_home = float(match.group(3))
                    odds_draw = float(match.group(4))
                    odds_away = float(match.group(5))

                    if self._validate_odds(odds_home, odds_draw, odds_away):
                        # Dátum és idő becslése
                        date, time = self._extract_match_datetime(text, match.start())
                        league = self._estimate_league(home_team, away_team)

                        upcoming = UpcomingMatch(
                            home_team=home_team,
                            away_team=away_team,
                            date=date,
                            time=time,
                            league=league,
                            odds_home=odds_home,
                            odds_draw=odds_draw,
                            odds_away=odds_away,
                            bet_type="1X2"
                        )

                        if not self._is_duplicate_upcoming_match(upcoming):
                            self.upcoming_matches.append(upcoming)
                            print(f"🔮 {home_team} vs {away_team}: {odds_home}-{odds_draw}-{odds_away}")

                except Exception as e:
                    self.debug_info.append(f"Odds parsing error: {e}")
                    continue

        return len(self.upcoming_matches) - initial_count

    def _normalize_team_name(self, name: str) -> str:
        """Fejlett csapat név normalizálás"""
        if not name:
            return ""

        # Tisztítás
        name = re.sub(r'[^\w\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]', '', name)
        name = re.sub(r'\s+', ' ', name).strip()

        # Kisbetűs keresés
        name_lower = name.lower()

        # Pattern alapú normalizálás
        for pattern, normalized in self.team_patterns.items():
            if pattern in name_lower:
                return normalized

        # Általános javítások
        name = name.title()
        name = re.sub(r'\b(Fc|CF|AC|SC|BK)\b', lambda m: m.group().upper(), name)

        return name

    def _estimate_league(self, home_team: str, away_team: str) -> str:
        """Liga becslése csapat nevek alapján"""
        teams = f"{home_team} {away_team}".lower()

        for league, patterns in self.league_patterns.items():
            for pattern in patterns:
                if pattern in teams:
                    return league

        return "Unknown League"

    def _validate_match_result(self, home_team: str, away_team: str, home_score: int, away_score: int) -> bool:
        """Meccs eredmény validálása"""
        return (
            len(home_team) >= 3 and len(away_team) >= 3 and
            home_team != away_team and
            0 <= home_score <= 20 and 0 <= away_score <= 20
        )

    def _validate_odds(self, odds_home: float, odds_draw: float, odds_away: float) -> bool:
        """Odds validálása"""
        return (
            1.0 <= odds_home <= 50.0 and
            1.0 <= odds_draw <= 50.0 and
            1.0 <= odds_away <= 50.0
        )

    def _extract_date_from_context(self, text: str, position: int) -> Optional[str]:
        """Dátum kinyerése a szöveg kontextusából"""
        # Egyszerű dátum pattern keresés a pozíció körül
        context = text[max(0, position-200):position+200]

        date_patterns = [
            r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})',
            r'(\d{1,2}\.\d{1,2}\.\d{4})',
        ]

        for pattern in date_patterns:
            match = re.search(pattern, context)
            if match:
                return match.group(1)

        return None

    def _extract_match_datetime(self, text: str, position: int) -> Tuple[Optional[str], Optional[str]]:
        """Meccs dátum és idő kinyerése"""
        date = self._extract_date_from_context(text, position)

        # Idő keresése
        context = text[max(0, position-100):position+100]
        time_pattern = r'(\d{1,2}:\d{2})'
        time_match = re.search(time_pattern, context)
        time = time_match.group(1) if time_match else None

        return date, time

    def _extract_text_based_tables(self, text: str):
        """Szöveges táblázatok keresése és feldolgozása"""
        lines = text.split('\n')

        for i, line in enumerate(lines):
            # Fejléc keresése
            if self._looks_like_table_header(line):
                # Táblázat sorok összegyűjtése
                table_lines = [line]
                for j in range(i+1, min(i+25, len(lines))):
                    if self._looks_like_table_row(lines[j]):
                        table_lines.append(lines[j])
                    elif lines[j].strip() == "":
                        continue
                    else:
                        break

                if len(table_lines) > 3:
                    self._process_text_table(table_lines)

    def _looks_like_table_header(self, line: str) -> bool:
        """Táblázat fejléc felismerése"""
        header_keywords = ["pos", "team", "pts", "w", "d", "l", "gf", "ga"]
        line_lower = line.lower()
        return sum(1 for kw in header_keywords if kw in line_lower) >= 3

    def _looks_like_table_row(self, line: str) -> bool:
        """Táblázat sor felismerése"""
        # Számok és szöveg keveréke
        numbers = len(re.findall(r'\d+', line))
        return numbers >= 3 and len(line.split()) >= 5

    def _process_text_table(self, table_lines: List[str]):
        """Szöveges táblázat feldolgozása"""
        # TODO: Implementálni a szöveges táblázat parse-olását
        pass

    def _safe_get_cell(self, row: List, index: int, default: str = "") -> str:
        """Biztonságos cella érték kinyerése"""
        if index < 0 or index >= len(row):
            return default
        return str(row[index]).strip() if row[index] is not None else default

    def _safe_get_int(self, row: List, index: int, default: int = 0) -> int:
        """Biztonságos integer érték kinyerése"""
        cell_value = self._safe_get_cell(row, index, str(default))
        try:
            numbers = re.findall(r'-?\d+', cell_value)
            return int(numbers[0]) if numbers else default
        except:
            return default

    def _estimate_league_from_table(self, table: List[List]) -> str:
        """Liga becslése táblázat csapatai alapján"""
        team_names = []
        for row in table[1:6]:  # Első 5 csapat
            if row:
                for cell in row:
                    if cell and isinstance(cell, str) and len(cell) > 3:
                        team_names.append(cell.lower())

        all_teams = " ".join(team_names)

        for league, patterns in self.league_patterns.items():
            for pattern in patterns:
                if pattern in all_teams:
                    return league

        return "Unknown League"

    def _extract_league_info(self, text: str) -> int:
        """Liga információk kinyerése"""
        # TODO: Liga információk implementálása
        return 0

    def _is_duplicate_result(self, result: MatchResult) -> bool:
        """Duplikált eredmény ellenőrzése"""
        for existing in self.match_results:
            if (existing.home_team == result.home_team and
                existing.away_team == result.away_team and
                existing.home_score == result.home_score and
                existing.away_score == result.away_score):
                return True
        return False

    def _is_duplicate_team_stat(self, stat: TeamStats) -> bool:
        """Duplikált csapat stat ellenőrzése"""
        for existing in self.team_stats:
            if (existing.team_name == stat.team_name and
                existing.league == stat.league):
                return True
        return False

    def _is_duplicate_upcoming_match(self, match: UpcomingMatch) -> bool:
        """Duplikált jövőbeli meccs ellenőrzése"""
        for existing in self.upcoming_matches:
            if (existing.home_team == match.home_team and
                existing.away_team == match.away_team):
                return True
        return False

    def save_all_data(self):
        """Minden adat mentése adatbázisba"""
        print("💾 Adatok mentése...")

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Meccs eredmények
        for result in self.match_results:
            cursor.execute('''
                INSERT OR REPLACE INTO match_results
                (home_team, away_team, home_score, away_score, date, time, league, season)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                result.home_team, result.away_team, result.home_score, result.away_score,
                result.date, result.time, result.league, result.season
            ))

        # Csapat statisztikák
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

        # Jövőbeli meccsek
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

        print(f"✅ Mentve: {len(self.match_results)} eredmény, {len(self.team_stats)} stat, {len(self.upcoming_matches)} upcoming")

    def export_comprehensive_data(self):
        """Komplex adatok CSV exportálása"""
        print("📊 Komplex CSV exportálás...")

        # Meccs eredmények
        if self.match_results:
            df = pd.DataFrame([asdict(r) for r in self.match_results])
            df.to_csv('comprehensive_match_results.csv', index=False, encoding='utf-8')
            print(f"✅ comprehensive_match_results.csv: {len(df)} meccs")

        # Csapat statisztikák
        if self.team_stats:
            df = pd.DataFrame([asdict(s) for s in self.team_stats])
            df.to_csv('comprehensive_team_stats.csv', index=False, encoding='utf-8')
            print(f"✅ comprehensive_team_stats.csv: {len(df)} csapat")

        # Jövőbeli meccsek
        if self.upcoming_matches:
            df = pd.DataFrame([asdict(m) for m in self.upcoming_matches])
            df.to_csv('comprehensive_upcoming_matches.csv', index=False, encoding='utf-8')
            print(f"✅ comprehensive_upcoming_matches.csv: {len(df)} meccs")

    def get_comprehensive_summary(self):
        """Részletes összefoglaló"""
        print("\n" + "="*60)
        print("📋 KOMPLEX ADATKINYERÉS ÖSSZEFOGLALÓJA")
        print("="*60)

        print(f"⚽ Meccs eredmények: {len(self.match_results)}")
        print(f"📊 Csapat statisztikák: {len(self.team_stats)}")
        print(f"🔮 Jövőbeli meccsek: {len(self.upcoming_matches)}")

        # Liga bontás
        if self.match_results:
            leagues = {}
            for result in self.match_results:
                league = result.league or "Unknown"
                leagues[league] = leagues.get(league, 0) + 1

            print(f"\n🏟️ Ligák meccs eredményei:")
            for league, count in sorted(leagues.items(), key=lambda x: x[1], reverse=True):
                print(f"   {league}: {count} meccs")

        if self.team_stats:
            team_leagues = {}
            for stat in self.team_stats:
                league = stat.league or "Unknown"
                team_leagues[league] = team_leagues.get(league, 0) + 1

            print(f"\n📊 Ligák csapat statisztikái:")
            for league, count in sorted(team_leagues.items(), key=lambda x: x[1], reverse=True):
                print(f"   {league}: {count} csapat")

        if self.debug_info:
            print(f"\n⚠️ Debug információk: {len(self.debug_info)}")


def main():
    """Fejlett PDF feldolgozó tesztelése"""
    pdf_path = '/home/bandi/Documents/code/2025/sp3/pdf/Web__51sz__P__06-27_2025.06.27.pdf'

    print("🚀 FEJLETT FUTBALL ADATKINYERŐ RENDSZER")
    print("=" * 60)

    extractor = AdvancedFootballExtractor()

    if extractor.extract_comprehensive_data(pdf_path):
        # Adatok mentése
        extractor.save_all_data()

        # CSV exportálás
        extractor.export_comprehensive_data()

        # Összefoglaló
        extractor.get_comprehensive_summary()

        print("\n✅ FEJLETT FELDOLGOZÁS BEFEJEZVE")
    else:
        print("❌ Fejlett feldolgozás sikertelen")

if __name__ == "__main__":
    main()

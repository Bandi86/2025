#!/usr/bin/env python3
"""
Egységes adatfeldolgozó különböző forrású futball adatokhoz
Támogatott formátumok:
1. Football Data UK (Premier League, Bundesliga, stb.)
2. ESPN Soccer Data
3. ClubElo/Football-Data.co.uk formátum
"""

import pandas as pd
import numpy as np
import sqlite3
import os
import glob
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UnifiedDataProcessor:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.processed_matches = []

    def process_all_data_sources(self):
        """Minden adatforrás feldolgozása és egységesítése"""
        logger.info("Kezdem az összes adatforrás feldolgozását...")

        # 1. Football Data UK formátum (ligák mappái)
        self._process_football_data_uk()

        # 2. ESPN Soccer Data
        self._process_espn_data()

        # 3. ClubElo/Football-Data.co.uk
        self._process_clubelo_data()

        logger.info(f"Összesen {len(self.processed_matches)} meccs feldolgozva")
        return self.processed_matches

    def _process_football_data_uk(self):
        """Football Data UK formátum feldolgozása (Premier League, Bundesliga, stb.)"""
        logger.info("Football Data UK formátum feldolgozása...")

        # Ligák mappáinak keresése
        league_dirs = ['premier-league', 'bundesliga', 'la-liga', 'serie-a', 'ligue-1', 'brazil']

        for league in league_dirs:
            league_path = os.path.join(self.data_dir, league)
            if not os.path.exists(league_path):
                continue

            logger.info(f"Feldolgozom: {league}")

            # Összes szezon fájl keresése
            season_files = glob.glob(os.path.join(league_path, "season-*.csv"))

            for file_path in season_files:
                try:
                    df = pd.read_csv(file_path)

                    # Ellenőrizzük a szükséges oszlopokat
                    required_cols = ['Date', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR']
                    if not all(col in df.columns for col in required_cols):
                        logger.warning(f"Hiányzó oszlopok: {file_path}")
                        continue

                    # Adatok normalizálása
                    for _, row in df.iterrows():
                        match_data = self._normalize_football_data_uk_match(row, league)
                        if match_data:
                            self.processed_matches.append(match_data)

                except Exception as e:
                    logger.error(f"Hiba a fájl feldolgozásában {file_path}: {e}")

    def _normalize_football_data_uk_match(self, row, league):
        """Football Data UK meccs normalizálása"""
        try:
            # Dátum feldolgozás
            date_str = str(row['Date'])
            try:
                # DD/MM/YY formátum
                if '/' in date_str and len(date_str.split('/')[2]) == 2:
                    day, month, year = date_str.split('/')
                    year = f"20{year}" if int(year) < 50 else f"19{year}"
                    date_obj = datetime.strptime(f"{day}/{month}/{year}", "%d/%m/%Y")
                else:
                    date_obj = pd.to_datetime(date_str)
            except:
                logger.warning(f"Nem sikerült feldolgozni a dátumot: {date_str}")
                return None

            return {
                'source': 'football_data_uk',
                'league': league,
                'date': date_obj,
                'home_team': str(row['HomeTeam']).strip(),
                'away_team': str(row['AwayTeam']).strip(),
                'home_goals': int(row['FTHG']) if pd.notna(row['FTHG']) else None,
                'away_goals': int(row['FTAG']) if pd.notna(row['FTAG']) else None,
                'result': str(row['FTR']) if pd.notna(row['FTR']) else None,
                'ht_home_goals': int(row['HTHG']) if 'HTHG' in row and pd.notna(row['HTHG']) else None,
                'ht_away_goals': int(row['HTAG']) if 'HTAG' in row and pd.notna(row['HTAG']) else None,
                'home_shots': int(row['HS']) if 'HS' in row and pd.notna(row['HS']) else None,
                'away_shots': int(row['AS']) if 'AS' in row and pd.notna(row['AS']) else None,
                'home_shots_target': int(row['HST']) if 'HST' in row and pd.notna(row['HST']) else None,
                'away_shots_target': int(row['AST']) if 'AST' in row and pd.notna(row['AST']) else None,
                'home_corners': int(row['HC']) if 'HC' in row and pd.notna(row['HC']) else None,
                'away_corners': int(row['AC']) if 'AC' in row and pd.notna(row['AC']) else None,
                'home_yellows': int(row['HY']) if 'HY' in row and pd.notna(row['HY']) else None,
                'away_yellows': int(row['AY']) if 'AY' in row and pd.notna(row['AY']) else None,
                'home_reds': int(row['HR']) if 'HR' in row and pd.notna(row['HR']) else None,
                'away_reds': int(row['AR']) if 'AR' in row and pd.notna(row['AR']) else None,
            }
        except Exception as e:
            logger.error(f"Hiba a meccs normalizálásában: {e}")
            return None

    def _process_espn_data(self):
        """ESPN Soccer Data feldolgozása"""
        logger.info("ESPN Soccer Data feldolgozása...")

        fixtures_path = os.path.join(self.data_dir, 'espn_soccer_data', 'base_data', 'fixtures.csv')
        teams_path = os.path.join(self.data_dir, 'espn_soccer_data', 'base_data', 'teams.csv')
        leagues_path = os.path.join(self.data_dir, 'espn_soccer_data', 'base_data', 'leagues.csv')

        if not all(os.path.exists(p) for p in [fixtures_path, teams_path, leagues_path]):
            logger.warning("ESPN adatok hiányosak, kihagyom")
            return

        try:
            teams_df = pd.read_csv(teams_path)
            leagues_df = pd.read_csv(leagues_path)
            fixtures_df = pd.read_csv(fixtures_path)

            # Rugalmas oszlopnév keresés
            def find_col(df, candidates):
                for c in candidates:
                    for col in df.columns:
                        if col.lower() == c.lower():
                            return col
                # Próbáljunk részleges egyezést
                for c in candidates:
                    for col in df.columns:
                        if c.lower() in col.lower():
                            return col
                return None

            team_id_col = find_col(teams_df, ['teamId', 'id'])
            team_name_col = find_col(teams_df, ['teamName', 'name', 'team', 'fullName'])
            league_id_col = find_col(leagues_df, ['leagueId', 'id'])
            league_name_col = find_col(leagues_df, ['leagueName', 'name', 'league', 'fullName'])

            if not team_id_col or not team_name_col:
                logger.warning(f"Nem található csapatnév/id oszlop a teams.csv-ben! ({teams_df.columns.tolist()})")
                return
            if not league_id_col or not league_name_col:
                logger.warning(f"Nem található liganév/id oszlop a leagues.csv-ben! ({leagues_df.columns.tolist()})")
                return

            team_mapping = dict(zip(teams_df[team_id_col], teams_df[team_name_col]))
            league_mapping = dict(zip(leagues_df[league_id_col], leagues_df[league_name_col]))

            logger.info(f"ESPN adatok: {len(fixtures_df)} meccs | Csapatnév oszlop: {team_name_col} | Ligaoszlop: {league_name_col}")

            for _, row in fixtures_df.iterrows():
                match_data = self._normalize_espn_match(row, team_mapping, league_mapping)
                if match_data:
                    self.processed_matches.append(match_data)

        except Exception as e:
            logger.error(f"Hiba az ESPN adatok feldolgozásában: {e}")

    def _normalize_espn_match(self, row, team_mapping, league_mapping):
        """ESPN meccs normalizálása"""
        try:
            home_team = team_mapping.get(row['homeTeamId'], f"Team_{row['homeTeamId']}")
            away_team = team_mapping.get(row['awayTeamId'], f"Team_{row['awayTeamId']}")
            league = league_mapping.get(row['leagueId'], f"League_{row['leagueId']}")

            # Eredmény meghatározása
            home_goals = int(row['homeTeamScore']) if pd.notna(row['homeTeamScore']) else None
            away_goals = int(row['awayTeamScore']) if pd.notna(row['awayTeamScore']) else None

            if home_goals is not None and away_goals is not None:
                if home_goals > away_goals:
                    result = 'H'
                elif away_goals > home_goals:
                    result = 'A'
                else:
                    result = 'D'
            else:
                result = None

            return {
                'source': 'espn',
                'league': league,
                'date': pd.to_datetime(row['date']),
                'home_team': home_team,
                'away_team': away_team,
                'home_goals': home_goals,
                'away_goals': away_goals,
                'result': result,
                'ht_home_goals': None,
                'ht_away_goals': None,
                'home_shots': None,
                'away_shots': None,
                'home_shots_target': None,
                'away_shots_target': None,
                'home_corners': None,
                'away_corners': None,
                'home_yellows': None,
                'away_yellows': None,
                'home_reds': None,
                'away_reds': None,
            }
        except Exception as e:
            logger.error(f"Hiba az ESPN meccs normalizálásában: {e}")
            return None

    def _process_clubelo_data(self):
        """ClubElo/Football-Data.co.uk feldolgozása"""
        logger.info("ClubElo adatok feldolgozása...")

        matches_path = os.path.join(self.data_dir, 'clubmatch', 'Matches.csv')

        if not os.path.exists(matches_path):
            logger.warning("ClubElo adatok nem találhatók")
            return

        # Explicit dtype beállítás a kulcsoszlopokra, hogy elkerüljük a DtypeWarning-ot
        dtype = {
            'Division': str,
            'HomeTeam': str,
            'AwayTeam': str,
            'FTResult': str,
            'MatchDate': str,
            'FTHome': object,
            'FTAway': object,
            'HTHome': object,
            'HTAway': object,
            'HomeShots': object,
            'AwayShots': object,
            'HomeTarget': object,
            'AwayTarget': object,
            'HomeCorners': object,
            'AwayCorners': object,
            'HomeYellow': object,
            'AwayYellow': object,
            'HomeRed': object,
            'AwayRed': object,
            'HomeElo': object,
            'AwayElo': object,
            'OddHome': object,
            'OddDraw': object,
            'OddAway': object
        }

        try:
            df = pd.read_csv(matches_path, dtype=dtype, low_memory=False)
            logger.info(f"ClubElo adatok: {len(df)} meccs")

            # Hibás sorok logolása: ellenőrizzük, hogy minden kulcsoszlop helyes-e
            required_cols = ['MatchDate', 'Division', 'HomeTeam', 'AwayTeam', 'FTHome', 'FTAway', 'FTResult']
            for idx, row in df.iterrows():
                missing = [col for col in required_cols if pd.isna(row[col]) or row[col] == '']
                if missing:
                    logger.warning(f"Hibás vagy hiányzó kulcsoszlop(ok) a(z) {idx}. sorban: {missing}")
                    continue
                match_data = self._normalize_clubelo_match(row)
                if match_data:
                    self.processed_matches.append(match_data)

        except Exception as e:
            logger.error(f"Hiba a ClubElo adatok feldolgozásában: {e}")

    def _normalize_clubelo_match(self, row):
        """ClubElo meccs normalizálása"""
        def parse_int(val):
            try:
                if pd.isna(val) or val == '':
                    return None
                return int(float(val))
            except Exception:
                return None
        def parse_float(val):
            try:
                if pd.isna(val) or val == '':
                    return None
                return float(val)
            except Exception:
                return None
        try:
            # Dátum feldolgozás
            date_obj = pd.to_datetime(row['MatchDate'])

            return {
                'source': 'clubelo',
                'league': str(row['Division']),
                'date': date_obj,
                'home_team': str(row['HomeTeam']).strip(),
                'away_team': str(row['AwayTeam']).strip(),
                'home_goals': parse_int(row['FTHome']),
                'away_goals': parse_int(row['FTAway']),
                'result': str(row['FTResult']) if pd.notna(row['FTResult']) else None,
                'ht_home_goals': parse_int(row['HTHome']) if 'HTHome' in row else None,
                'ht_away_goals': parse_int(row['HTAway']) if 'HTAway' in row else None,
                'home_shots': parse_int(row['HomeShots']) if 'HomeShots' in row else None,
                'away_shots': parse_int(row['AwayShots']) if 'AwayShots' in row else None,
                'home_shots_target': parse_int(row['HomeTarget']) if 'HomeTarget' in row else None,
                'away_shots_target': parse_int(row['AwayTarget']) if 'AwayTarget' in row else None,
                'home_corners': parse_int(row['HomeCorners']) if 'HomeCorners' in row else None,
                'away_corners': parse_int(row['AwayCorners']) if 'AwayCorners' in row else None,
                'home_yellows': parse_int(row['HomeYellow']) if 'HomeYellow' in row else None,
                'away_yellows': parse_int(row['AwayYellow']) if 'AwayYellow' in row else None,
                'home_reds': parse_int(row['HomeRed']) if 'HomeRed' in row else None,
                'away_reds': parse_int(row['AwayRed']) if 'AwayRed' in row else None,
                # Extra adatok ClubElo-ból
                'home_elo': parse_float(row['HomeElo']) if 'HomeElo' in row else None,
                'away_elo': parse_float(row['AwayElo']) if 'AwayElo' in row else None,
                'odds_home': parse_float(row['OddHome']) if 'OddHome' in row else None,
                'odds_draw': parse_float(row['OddDraw']) if 'OddDraw' in row else None,
                'odds_away': parse_float(row['OddAway']) if 'OddAway' in row else None,
            }
        except Exception as e:
            logger.error(f"Hiba a ClubElo meccs normalizálásában: {e}")
            return None

    def save_to_database(self, db_path="models/unified_football.db"):
        """Egységesített adatok mentése adatbázisba"""
        logger.info(f"Adatok mentése: {db_path}")

        # DataFrame létrehozása
        df = pd.DataFrame(self.processed_matches)

        if df.empty:
            logger.warning("Nincsenek adatok a mentéshez")
            return

        # Duplikátumok eltávolítása
        before_dedup = len(df)
        df = df.drop_duplicates(subset=['date', 'home_team', 'away_team'], keep='first')
        after_dedup = len(df)
        logger.info(f"Duplikátumok eltávolítva: {before_dedup} -> {after_dedup}")

        # Adatbázis mentés
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

        with sqlite3.connect(db_path) as conn:
            df.to_sql('matches', conn, if_exists='replace', index=False)

            # Indexek létrehozása
            conn.execute("CREATE INDEX IF NOT EXISTS idx_date ON matches(date)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_teams ON matches(home_team, away_team)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_league ON matches(league)")

        logger.info(f"Összesen {len(df)} meccs mentve az adatbázisba")
        return len(df)

    def get_data_summary(self):
        """Adatok összefoglalása"""
        if not self.processed_matches:
            return "Nincsenek feldolgozott adatok"

        df = pd.DataFrame(self.processed_matches)

        summary = {
            'total_matches': len(df),
            'sources': df['source'].value_counts().to_dict(),
            'leagues': df['league'].value_counts().head(10).to_dict(),
            'date_range': {
                'earliest': df['date'].min(),
                'latest': df['date'].max()
            },
            'data_quality': {
                'with_scores': len(df.dropna(subset=['home_goals', 'away_goals'])),
                'with_shots': len(df.dropna(subset=['home_shots', 'away_shots'])),
                'with_elo': len(df.dropna(subset=['home_elo', 'away_elo'])),
                'with_odds': len(df.dropna(subset=['odds_home', 'odds_draw', 'odds_away']))
            }
        }

        return summary

if __name__ == "__main__":
    processor = UnifiedDataProcessor()
    matches = processor.process_all_data_sources()
    processor.save_to_database()

    summary = processor.get_data_summary()
    print("\n=== ADATFELDOLGOZÁS ÖSSZEFOGLALÓ ===")
    for key, value in summary.items():
        print(f"{key}: {value}")

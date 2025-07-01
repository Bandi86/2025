import requests
import pandas as pd
from datetime import datetime, timedelta
import time
import json
import os

class FootballDataProvider:
    """
    Futball adatok letöltése különböző forrásokból:
    - API-FOOTBALL (ingyenes tier)
    - football-data.org
    - Web scraping alternatívák
    """

    def __init__(self):
        self.api_football_key = os.getenv('API_FOOTBALL_KEY')  # RapidAPI key
        self.football_data_key = os.getenv('FOOTBALL_DATA_KEY')  # football-data.org token
        self.base_url_api = "https://v3.football.api-sports.io"
        self.base_url_fd = "https://api.football-data.org/v4"

    def get_upcoming_fixtures(self, days_ahead=7, leagues=None):
        """
        Jövőbeli meccsek letöltése

        Args:
            days_ahead: Hány napra előre
            leagues: Lista a liga ID-kről (None = összes)
        """
        print(f"Jövőbeli meccsek letöltése ({days_ahead} napra előre)...")

        if self.api_football_key:
            return self._get_fixtures_api_football(days_ahead, leagues)
        elif self.football_data_key:
            return self._get_fixtures_football_data(days_ahead, leagues)
        else:
            print("❌ Nincs API kulcs beállítva! Próbálom web scraping-gel...")
            return self._get_fixtures_scraping(days_ahead)

    def _get_fixtures_api_football(self, days_ahead, leagues):
        """API-FOOTBALL (RapidAPI) használata"""
        headers = {
            'X-RapidAPI-Key': self.api_football_key,
            'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }

        fixtures = []
        start_date = datetime.now().strftime('%Y-%m-%d')
        end_date = (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')

        # Ha nincs megadva liga, használjuk a főbb ligákat
        if leagues is None:
            leagues = [140, 78, 135, 61, 39]  # La Liga, Bundesliga, Serie A, Ligue 1, Premier League

        for league_id in leagues:
            url = f"{self.base_url_api}/fixtures"
            params = {
                'league': league_id,
                'from': start_date,
                'to': end_date,
                'status': 'NS'  # Not Started
            }

            try:
                response = requests.get(url, headers=headers, params=params)
                data = response.json()

                if data.get('response'):
                    for match in data['response']:
                        fixture = {
                            'external_id': match['fixture']['id'],
                            'date': match['fixture']['date'],
                            'league_id': match['league']['id'],
                            'league_name': match['league']['name'],
                            'home_team_id': match['teams']['home']['id'],
                            'home_team_name': match['teams']['home']['name'],
                            'away_team_id': match['teams']['away']['id'],
                            'away_team_name': match['teams']['away']['name'],
                            'venue': match['fixture']['venue']['name'] if match['fixture']['venue'] else 'TBD'
                        }
                        fixtures.append(fixture)

                # Rate limiting
                time.sleep(1)

            except Exception as e:
                print(f"❌ Hiba {league_id} liga letöltésénél: {e}")

        return pd.DataFrame(fixtures)

    def _get_fixtures_football_data(self, days_ahead, leagues):
        """football-data.org API használata"""
        headers = {'X-Auth-Token': self.football_data_key}

        # football-data.org specifikus liga mappelés
        fd_leagues = {
            2014: 'Premier League',  # England
            2002: 'Bundesliga',     # Germany
            2019: 'Serie A',        # Italy
            2015: 'Ligue 1',       # France
            2014: 'La Liga'        # Spain
        }

        fixtures = []

        for league_id, league_name in fd_leagues.items():
            url = f"{self.base_url_fd}/competitions/{league_id}/matches"
            params = {
                'status': 'SCHEDULED',
                'dateFrom': datetime.now().strftime('%Y-%m-%d'),
                'dateTo': (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
            }

            try:
                response = requests.get(url, headers=headers, params=params)
                data = response.json()

                if 'matches' in data:
                    for match in data['matches']:
                        fixture = {
                            'external_id': match['id'],
                            'date': match['utcDate'],
                            'league_id': league_id,
                            'league_name': league_name,
                            'home_team_id': match['homeTeam']['id'],
                            'home_team_name': match['homeTeam']['name'],
                            'away_team_id': match['awayTeam']['id'],
                            'away_team_name': match['awayTeam']['name'],
                            'venue': 'TBD'
                        }
                        fixtures.append(fixture)

                time.sleep(1)

            except Exception as e:
                print(f"❌ Hiba {league_name} letöltésénél: {e}")

        return pd.DataFrame(fixtures)

    def _get_fixtures_scraping(self, days_ahead):
        """Web scraping fallback (ESPN vagy FlashScore)"""
        print("🕸️ Web scraping módszer használata...")

        # Egyszerű példa - ESPN scraping (be kell fejleszteni)
        try:
            import requests
            from bs4 import BeautifulSoup

            fixtures = []

            # ESPN soccer fixtures oldal
            url = "https://www.espn.com/soccer/fixtures"
            response = requests.get(url)

            if response.status_code == 200:
                # Itt kellene BeautifulSoup-pal kielemezni az oldalt
                # Most csak egy dummy fixture-t adunk vissza
                fixture = {
                    'external_id': 'scraped_001',
                    'date': (datetime.now() + timedelta(days=1)).isoformat(),
                    'league_id': 999,
                    'league_name': 'Scraped League',
                    'home_team_id': 83,
                    'home_team_name': 'Barcelona',
                    'away_team_id': 86,
                    'away_team_name': 'Real Madrid',
                    'venue': 'Camp Nou'
                }
                fixtures.append(fixture)

            return pd.DataFrame(fixtures)

        except ImportError:
            print("❌ BeautifulSoup4 nincs telepítve. pip install beautifulsoup4")
            return pd.DataFrame()
        except Exception as e:
            print(f"❌ Scraping hiba: {e}")
            return pd.DataFrame()

    def map_external_teams_to_local(self, fixtures_df, team_mapping_file='team_mapping.json'):
        """
        Külső csapat ID-k mappelése a helyi adatbázis ID-kre
        """
        if os.path.exists(team_mapping_file):
            with open(team_mapping_file, 'r') as f:
                mapping = json.load(f)
        else:
            mapping = {}
            print(f"⚠️ {team_mapping_file} nem található. Üres mappelés használata.")

        # Mappelés alkalmazása
        fixtures_df['local_home_team_id'] = fixtures_df['home_team_id'].map(mapping).fillna(fixtures_df['home_team_id'])
        fixtures_df['local_away_team_id'] = fixtures_df['away_team_id'].map(mapping).fillna(fixtures_df['away_team_id'])

        return fixtures_df

    def save_fixtures(self, fixtures_df, filename='upcoming_fixtures.csv'):
        """Fixtures mentése CSV-be"""
        fixtures_df.to_csv(filename, index=False)
        print(f"✅ {len(fixtures_df)} jövőbeli meccs elmentve: {filename}")

    def setup_api_keys(self):
        """API kulcsok beállítási útmutató"""
        print("🔑 API kulcsok beállítása:")
        print("=" * 50)
        print("1. API-FOOTBALL (RapidAPI):")
        print("   - Regisztráció: https://rapidapi.com/api-sports/api/api-football")
        print("   - Ingyenes: 100 request/nap")
        print("   - export API_FOOTBALL_KEY='your_key_here'")
        print()
        print("2. football-data.org:")
        print("   - Regisztráció: https://www.football-data.org/")
        print("   - Ingyenes: 10 request/perc")
        print("   - export FOOTBALL_DATA_KEY='your_token_here'")
        print()
        print("3. Környezeti változók beállítása:")
        print("   echo 'export API_FOOTBALL_KEY=\"your_key\"' >> ~/.bashrc")
        print("   echo 'export FOOTBALL_DATA_KEY=\"your_token\"' >> ~/.bashrc")
        print("   source ~/.bashrc")

# Példa használat és tesztelés
if __name__ == "__main__":
    provider = FootballDataProvider()

    # API kulcsok ellenőrzése
    if not provider.api_football_key and not provider.football_data_key:
        provider.setup_api_keys()
        print("\n⚠️ Állítsd be az API kulcsokat, majd futtasd újra!")
    else:
        # Jövőbeli meccsek letöltése
        fixtures = provider.get_upcoming_fixtures(days_ahead=7)

        if not fixtures.empty:
            print(f"✅ {len(fixtures)} jövőbeli meccs letöltve!")
            print(fixtures.head())

            # Mentés
            provider.save_fixtures(fixtures)
        else:
            print("❌ Nem sikerült jövőbeli meccseket letölteni.")

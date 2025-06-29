import requests
import os
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv

class FootballDataAPI:
    def __init__(self):
        # Load environment variables
        load_dotenv('/home/bandi/Documents/code/2025/sp3/.env')
        self.api_key = os.getenv('FOOTBALL_DATA_KEY')
        self.base_url = "https://api.football-data.org/v4"
        self.headers = {'X-Auth-Token': self.api_key}

        if not self.api_key:
            raise ValueError("FOOTBALL_DATA_KEY environment variable not found!")

    def get_upcoming_matches(self, days_ahead=7):
        """Jövőbeli meccsek lekérése (következő N nap)"""
        date_from = datetime.now().strftime('%Y-%m-%d')
        date_to = (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')

        url = f"{self.base_url}/matches"
        params = {
            'dateFrom': date_from,
            'dateTo': date_to
        }

        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()

            data = response.json()
            matches = []

            for match in data.get('matches', []):
                matches.append({
                    'id': match['id'],
                    'date': match['utcDate'],
                    'competition': match['competition']['name'],
                    'home_team': match['homeTeam']['name'],
                    'away_team': match['awayTeam']['name'],
                    'home_team_id': match['homeTeam']['id'],
                    'away_team_id': match['awayTeam']['id'],
                    'status': match['status']
                })

            return pd.DataFrame(matches)

        except requests.exceptions.RequestException as e:
            print(f"API hívás hiba: {e}")
            return pd.DataFrame()

    def get_competitions(self):
        """Elérhető bajnokságok listája"""
        url = f"{self.base_url}/competitions"

        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()

            data = response.json()
            competitions = []

            for comp in data.get('competitions', []):
                competitions.append({
                    'id': comp['id'],
                    'name': comp['name'],
                    'area': comp['area']['name'],
                    'type': comp['type']
                })

            return pd.DataFrame(competitions)

        except requests.exceptions.RequestException as e:
            print(f"API hívás hiba: {e}")
            return pd.DataFrame()

    def test_connection(self):
        """API kapcsolat tesztelése"""
        url = f"{self.base_url}/competitions"

        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()

            print(f"✅ API kapcsolat sikeres!")
            print(f"Status: {response.status_code}")
            print(f"Rate limit: {response.headers.get('X-Requests-Available-Minute', 'N/A')}/10 kérés/perc")

            data = response.json()
            print(f"Elérhető bajnokságok száma: {len(data.get('competitions', []))}")

            return True

        except requests.exceptions.RequestException as e:
            print(f"❌ API kapcsolat hiba: {e}")
            return False

if __name__ == "__main__":
    # Teszt
    api = FootballDataAPI()

    print("🔌 API kapcsolat tesztelése...")
    if api.test_connection():
        print("\n📋 Bajnokságok (top 10):")
        competitions = api.get_competitions()
        print(competitions.head(10))

        print("\n⚽ Jövőbeli meccsek (következő 3 nap):")
        upcoming = api.get_upcoming_matches(days_ahead=3)
        print(upcoming.head(10))

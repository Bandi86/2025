import requests
import pandas as pd
from datetime import datetime, timedelta
import json

class FreeFootballAPI:
    """
    Ingyenes futball API-k használata valós meccsadatokhoz
    """

    def __init__(self):
        self.headers = {
            'User-Agent': 'SportsPrediction/1.0'
        }

    def get_api_football_matches(self):
        """
        API-Football (RapidAPI) - ingyenes tier
        https://api-football-v1.p.rapidapi.com
        """
        matches = []
        try:
            # Próbálkozás ingyenes végponttal
            url = "https://api.football-data.org/v4/matches"

            # Mai naptól 7 napra előre
            date_from = datetime.now().strftime('%Y-%m-%d')
            date_to = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')

            params = {
                'dateFrom': date_from,
                'dateTo': date_to,
                'status': 'SCHEDULED'
            }

            response = requests.get(url, params=params, headers=self.headers, timeout=10)
            print(f"API Football status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                for match in data.get('matches', []):
                    matches.append({
                        'home_team': match['homeTeam']['name'],
                        'away_team': match['awayTeam']['name'],
                        'date': match['utcDate'],
                        'competition': match['competition']['name'],
                        'source': 'Football Data API'
                    })

        except Exception as e:
            print(f"API Football hiba: {e}")

        return matches

    def get_footapi_matches(self):
        """
        FootAPI.com - ingyenes public API
        """
        matches = []
        try:
            # FootAPI fixtures endpoint
            url = "https://www.footapi.com/api/matches/live"

            response = requests.get(url, headers=self.headers, timeout=10)
            print(f"FootAPI status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                # FootAPI response struktúra alapján
                if 'events' in data:
                    for event in data['events']:
                        if event.get('status', {}).get('type') == 'notstarted':
                            matches.append({
                                'home_team': event['homeTeam']['name'],
                                'away_team': event['awayTeam']['name'],
                                'date': event['startTimestamp'],
                                'source': 'FootAPI'
                            })

        except Exception as e:
            print(f"FootAPI hiba: {e}")

        return matches

    def get_sportmonks_matches(self):
        """
        SportMonks API - alapcsomag ingyenes
        """
        matches = []
        try:
            # SportMonks fixtures (ingyenes tier)
            url = "https://soccer.sportmonks.com/api/v2.0/fixtures"

            params = {
                'api_token': 'YOUR_TOKEN_HERE',  # Regisztráció szükséges
                'include': 'localTeam,visitorTeam',
                'leagues': '8,564,82,501,2'  # Top ligák
            }

            response = requests.get(url, params=params, headers=self.headers, timeout=10)
            print(f"SportMonks status: {response.status_code}")

        except Exception as e:
            print(f"SportMonks hiba: {e}")

        return matches

    def get_simple_scheduled_matches(self):
        """
        Egyszerű, valószínűleg működő sources
        """
        matches = []

        # 1. Próbáljunk egy egyszerű JSON endpoint-ot
        try:
            # API-SPORTS.io ingyenes tier
            url = "https://v3.football.api-sports.io/fixtures"
            headers = {
                'X-RapidAPI-Key': 'YOUR_KEY_HERE',  # Ingyenes regisztráció szükséges
                'X-RapidAPI-Host': 'v3.football.api-sports.io'
            }

            params = {
                'date': datetime.now().strftime('%Y-%m-%d'),
                'timezone': 'Europe/Budapest'
            }

            response = requests.get(url, headers=headers, params=params, timeout=10)
            print(f"API-Sports status: {response.status_code}")

        except Exception as e:
            print(f"API-Sports hiba: {e}")

        return matches

    def get_mock_realistic_matches(self):
        """
        Valósághű mock meccsek a jelenlegi szezon alapján
        """
        print("🎭 Valósághű mock meccsek generálása...")

        # Jelenleg futó bajnokságok és csapataik (2024/2025 szezon)
        leagues = {
            'Premier League': [
                'Arsenal', 'Aston Villa', 'Brighton', 'Burnley', 'Chelsea',
                'Crystal Palace', 'Everton', 'Liverpool', 'Manchester City',
                'Manchester United', 'Newcastle', 'Tottenham', 'West Ham'
            ],
            'La Liga': [
                'Barcelona', 'Real Madrid', 'Atletico Madrid', 'Sevilla',
                'Real Betis', 'Valencia', 'Villarreal', 'Athletic Bilbao'
            ],
            'Serie A': [
                'Juventus', 'AC Milan', 'Inter', 'Roma', 'Napoli',
                'Lazio', 'Atalanta', 'Fiorentina'
            ],
            'Bundesliga': [
                'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
                'Borussia Monchengladbach', 'Frankfurt', 'Union Berlin', 'Wolfsburg'
            ]
        }

        matches = []
        match_id = 1

        for league, teams in leagues.items():
            # 3-4 meccs liga-nként
            for i in range(min(4, len(teams)//2)):
                home_idx = i * 2
                away_idx = i * 2 + 1

                if away_idx < len(teams):
                    # Valósághű időpontok (hétvégék, este)
                    days_ahead = (i % 7) + 1  # 1-7 nap múlva
                    hours = [15, 17, 19, 20, 21][i % 5]  # Valósághű időpontok

                    match_date = datetime.now() + timedelta(days=days_ahead)
                    match_time = f"{match_date.strftime('%Y-%m-%d')} {hours}:00"

                    matches.append({
                        'id': match_id,
                        'home_team': teams[home_idx],
                        'away_team': teams[away_idx],
                        'date': match_time,
                        'league': league,
                        'source': 'Realistic Mock'
                    })
                    match_id += 1

        return matches

    def get_upcoming_matches(self, days_ahead=7):
        """
        Összes elérhető forrásból jövőbeli meccsek
        """
        all_matches = []

        print("🔍 Valós API-k próbálása...")

        # 1. API Football
        api_matches = self.get_api_football_matches()
        if api_matches:
            print(f"✅ API Football: {len(api_matches)} meccs")
            all_matches.extend(api_matches)

        # 2. FootAPI
        foot_matches = self.get_footapi_matches()
        if foot_matches:
            print(f"✅ FootAPI: {len(foot_matches)} meccs")
            all_matches.extend(foot_matches)

        # 3. Ha nincs valós adat, reális mock-ot használunk
        if not all_matches:
            print("❌ Valós API-k nem elérhetők, reális mock adatok használata...")
            all_matches = self.get_mock_realistic_matches()

        if all_matches:
            df = pd.DataFrame(all_matches)
            print(f"📊 Összesen {len(df)} meccs")
            return df
        else:
            print("❌ Nem sikerült meccseket találni")
            return pd.DataFrame()

if __name__ == "__main__":
    api = FreeFootballAPI()

    print("🏈 Ingyenes futball API-k tesztelése...")
    matches = api.get_upcoming_matches()

    if not matches.empty:
        print(f"\n📋 Talált meccsek:")
        print(matches[['home_team', 'away_team', 'league', 'source']].head(20))
    else:
        print("❌ Nem találtam meccseket")

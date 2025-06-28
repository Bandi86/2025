#!/usr/bin/env python3
"""
🔄 VALÓS API INTEGRÁCIÓ - API-Sports
Valós MLS adatok letöltése és feldolgozása
"""

import requests
import pandas as pd
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class APISportsClient:
    """API-Sports kliens MLS adatokhoz"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('API_SPORTS_KEY')
        self.base_url = "https://v3.football.api-sports.io"
        self.headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "v3.football.api-sports.io"
        }

        # MLS Liga ID az API-Sports-ban
        self.mls_league_id = 253
        self.current_season = 2025

    def test_connection(self) -> bool:
        """API kapcsolat tesztelése"""
        try:
            response = requests.get(
                f"{self.base_url}/status",
                headers=self.headers,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                print(f"✅ API kapcsolat OK")
                print(f"📊 Napi limit: {data['response']['requests']['limit_day']}")
                print(f"🔄 Felhasznált: {data['response']['requests']['current']}")
                return True
            else:
                print(f"❌ API hiba: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Kapcsolódási hiba: {e}")
            return False

    def get_mls_teams(self) -> List[Dict]:
        """MLS csapatok letöltése"""
        try:
            url = f"{self.base_url}/teams"
            params = {
                'league': self.mls_league_id,
                'season': self.current_season
            }

            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                data = response.json()
                teams = data['response']
                print(f"✅ {len(teams)} MLS csapat letöltve")
                return teams
            else:
                print(f"❌ Csapatok letöltése sikertelen: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ Hiba a csapatok letöltésekor: {e}")
            return []

    def get_mls_fixtures(self, date_from: str = None, date_to: str = None) -> List[Dict]:
        """MLS meccsek letöltése"""
        try:
            url = f"{self.base_url}/fixtures"
            params = {
                'league': self.mls_league_id,
                'season': self.current_season
            }

            if date_from:
                params['from'] = date_from
            if date_to:
                params['to'] = date_to

            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                data = response.json()
                fixtures = data['response']
                print(f"✅ {len(fixtures)} MLS meccs letöltve")
                return fixtures
            else:
                print(f"❌ Meccsek letöltése sikertelen: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ Hiba a meccsek letöltésekor: {e}")
            return []

    def get_todays_fixtures(self) -> List[Dict]:
        """Mai MLS meccsek"""
        today = datetime.now().strftime('%Y-%m-%d')
        return self.get_mls_fixtures(date_from=today, date_to=today)

    def convert_fixtures_to_df(self, fixtures: List[Dict]) -> pd.DataFrame:
        """API válasz konvertálása DataFrame-re"""
        matches = []

        for fixture in fixtures:
            if fixture['fixture']['status']['short'] in ['FT', 'AET', 'PEN']:
                # Befejezett meccs
                match = {
                    'Date': fixture['fixture']['date'][:10],
                    'HomeTeam': fixture['teams']['home']['name'],
                    'AwayTeam': fixture['teams']['away']['name'],
                    'FTHG': fixture['goals']['home'] or 0,
                    'FTAG': fixture['goals']['away'] or 0,
                    'FTR': self._get_result(fixture['goals']['home'], fixture['goals']['away']),
                    'Season': fixture['league']['season'],
                    'Round': fixture['league']['round']
                }

                # Odds ha vannak
                if 'odds' in fixture and fixture['odds']:
                    # Itt lehetne odds adatokat is feldolgozni
                    pass

                matches.append(match)

        df = pd.DataFrame(matches)
        if not df.empty:
            df['Date'] = pd.to_datetime(df['Date'])
            df = df.sort_values('Date').reset_index(drop=True)

        return df

    def _get_result(self, home_goals: int, away_goals: int) -> str:
        """Meccs eredmény meghatározása"""
        if home_goals > away_goals:
            return 'H'
        elif away_goals > home_goals:
            return 'A'
        else:
            return 'D'

    def save_teams_info(self, teams: List[Dict], filename: str = None):
        """Csapat információk mentése"""
        if not filename:
            filename = f"data/mls/teams_{self.current_season}.json"

        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(teams, f, indent=2, ensure_ascii=False)

        print(f"✅ Csapat info mentve: {filename}")

def demo_without_api_key():
    """Demo verzió API kulcs nélkül"""
    print("🔑 API kulcs nem található!")
    print("📝 Demo verzió: szimulált valós adatstruktúra")

    # Szimulált API válasz struktúra
    sample_fixture = {
        'fixture': {
            'id': 12345,
            'date': '2025-06-28T20:00:00+00:00',
            'status': {'short': 'FT'}
        },
        'league': {
            'season': 2025,
            'round': 'Regular Season - 18'
        },
        'teams': {
            'home': {'name': 'Inter Miami CF'},
            'away': {'name': 'LA Galaxy'}
        },
        'goals': {
            'home': 2,
            'away': 1
        }
    }

    print("\n📊 Minta API válasz struktúra:")
    print(json.dumps(sample_fixture, indent=2))

    return [sample_fixture]

def main():
    """Főprogram"""
    print("🔄 VALÓS MLS API INTEGRÁCIÓ")
    print("=" * 50)

    # API kulcs ellenőrzése
    api_key = os.getenv('API_SPORTS_KEY')
    if not api_key:
        print("⚠️ API_SPORTS_KEY környezeti változó nincs beállítva")
        print("📝 Regisztrálj itt: https://rapidapi.com/api-sports/api/api-football")
        print("🔧 Beállítás: export API_SPORTS_KEY='your_key_here'")

        # Demo futtatás
        demo_fixtures = demo_without_api_key()
        return

    # API kliens létrehozása
    client = APISportsClient(api_key)

    # Kapcsolat tesztelése
    if not client.test_connection():
        print("❌ API kapcsolat sikertelen!")
        return

    # MLS csapatok letöltése
    print("\n📥 MLS csapatok letöltése...")
    teams = client.get_mls_teams()
    if teams:
        client.save_teams_info(teams)

        print("\n🏟️ MLS csapatok:")
        for team in teams[:5]:  # Első 5
            print(f"  • {team['team']['name']} ({team['team']['country']})")
        if len(teams) > 5:
            print(f"  ... és {len(teams) - 5} további csapat")

    # Mai meccsek
    print("\n📅 Mai MLS meccsek letöltése...")
    todays_fixtures = client.get_todays_fixtures()
    if todays_fixtures:
        print(f"⚽ {len(todays_fixtures)} meccs ma")
        for fixture in todays_fixtures:
            home = fixture['teams']['home']['name']
            away = fixture['teams']['away']['name']
            time = fixture['fixture']['date'][11:16]
            print(f"  {time}: {home} vs {away}")
    else:
        print("📅 Nincs meccs ma")

    # Szezon adatok letöltése (utolsó 30 nap)
    print("\n📊 Múltbeli meccsek letöltése (utolsó 30 nap)...")
    date_from = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    date_to = datetime.now().strftime('%Y-%m-%d')

    fixtures = client.get_mls_fixtures(date_from, date_to)
    if fixtures:
        df = client.convert_fixtures_to_df(fixtures)
        if not df.empty:
            filename = f"data/mls/mls_real_{date_from}_to_{date_to}.csv"
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            df.to_csv(filename, index=False)
            print(f"✅ {len(df)} meccs mentve: {filename}")

            # Statisztikák
            print(f"\n📈 Statisztikák:")
            print(f"  🏠 Hazai győzelem: {len(df[df['FTR'] == 'H'])}")
            print(f"  🤝 Döntetlen: {len(df[df['FTR'] == 'D'])}")
            print(f"  ✈️ Vendég győzelem: {len(df[df['FTR'] == 'A'])}")
        else:
            print("📊 Nincs befejezett meccs az időszakban")

    print("\n✅ API integráció befejezve!")
    print("🎯 Következő: python src/tools/daily_betting_assistant.py --league mls --live")

if __name__ == "__main__":
    main()

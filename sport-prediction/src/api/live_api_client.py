#!/usr/bin/env python3
"""
🌍 LIVE API CLIENT
Unified API client for all supported leagues
"""

import requests
import pandas as pd
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time

class LiveAPIClient:
    """Egységes API kliens több ligához"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('API_SPORTS_KEY')
        self.base_url = "https://v3.football.api-sports.io"
        self.headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "v3.football.api-sports.io"
        }

        # Liga konfigurációk
        self.leagues = {
            'premier_league': {
                'id': 39,
                'name': 'Premier League',
                'country': 'England',
                'season': 2024,
                'timezone': 'Europe/London'
            },
            'mls': {
                'id': 253,
                'name': 'Major League Soccer',
                'country': 'USA',
                'season': 2024,
                'timezone': 'America/New_York'
            },
            'brasileirao': {
                'id': 71,
                'name': 'Brasileirão Serie A',
                'country': 'Brazil',
                'season': 2024,
                'timezone': 'America/Sao_Paulo'
            },
            'j_league': {
                'id': 98,
                'name': 'J1 League',
                'country': 'Japan',
                'season': 2024,
                'timezone': 'Asia/Tokyo'
            },
            'a_league': {
                'id': 188,
                'name': 'A-League Men',
                'country': 'Australia',
                'season': 2024,
                'timezone': 'Australia/Sydney'
            }
        }

        self.rate_limit_delay = 1  # 1 másodperc várakozás kérések között

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
                print(f"✅ API kapcsolat sikeres")
                requests_info = data.get('response', {}).get('requests', {})
                print(f"📊 Napi limit: {requests_info.get('limit_day', 'N/A')}")
                print(f"🔄 Felhasznált: {requests_info.get('current', 'N/A')}")
                return True
            else:
                print(f"❌ API státusz hiba: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Kapcsolódási hiba: {e}")
            return False

    def get_league_teams(self, league_key: str) -> List[Dict]:
        """Liga csapatainak lekérése"""
        if league_key not in self.leagues:
            print(f"❌ Ismeretlen liga: {league_key}")
            return []

        league_config = self.leagues[league_key]

        try:
            response = requests.get(
                f"{self.base_url}/teams",
                headers=self.headers,
                params={
                    'league': league_config['id'],
                    'season': league_config['season']
                },
                timeout=10
            )

            time.sleep(self.rate_limit_delay)

            if response.status_code == 200:
                data = response.json()
                teams = data.get('response', [])
                print(f"✅ {league_config['name']}: {len(teams)} csapat")
                return teams
            else:
                print(f"❌ Csapatok lekérése sikertelen: {response.status_code}")
                return []

        except Exception as e:
            print(f"❌ Hiba a csapatok lekérésénél: {e}")
            return []

    def get_todays_fixtures(self, league_key: str) -> List[Dict]:
        """Mai mérkőzések lekérése"""
        if league_key not in self.leagues:
            print(f"❌ Ismeretlen liga: {league_key}")
            return []

        league_config = self.leagues[league_key]
        today = datetime.now().strftime('%Y-%m-%d')

        try:
            response = requests.get(
                f"{self.base_url}/fixtures",
                headers=self.headers,
                params={
                    'league': league_config['id'],
                    'season': league_config['season'],
                    'date': today
                },
                timeout=15
            )

            time.sleep(self.rate_limit_delay)

            if response.status_code == 200:
                data = response.json()
                fixtures = data.get('response', [])
                print(f"✅ {league_config['name']}: {len(fixtures)} mai mérkőzés")
                return fixtures
            else:
                print(f"❌ Mérkőzések lekérése sikertelen: {response.status_code}")
                return []

        except Exception as e:
            print(f"❌ Hiba a mérkőzések lekérésénél: {e}")
            return []

    def get_upcoming_fixtures(self, league_key: str, days: int = 7) -> List[Dict]:
        """Következő napok mérkőzései"""
        if league_key not in self.leagues:
            print(f"❌ Ismeretlen liga: {league_key}")
            return []

        league_config = self.leagues[league_key]
        today = datetime.now()
        end_date = (today + timedelta(days=days)).strftime('%Y-%m-%d')

        try:
            response = requests.get(
                f"{self.base_url}/fixtures",
                headers=self.headers,
                params={
                    'league': league_config['id'],
                    'season': league_config['season'],
                    'from': today.strftime('%Y-%m-%d'),
                    'to': end_date
                },
                timeout=15
            )

            time.sleep(self.rate_limit_delay)

            if response.status_code == 200:
                data = response.json()
                fixtures = data.get('response', [])
                print(f"✅ {league_config['name']}: {len(fixtures)} közelgő mérkőzés")
                return fixtures
            else:
                print(f"❌ Közelgő mérkőzések lekérése sikertelen: {response.status_code}")
                return []

        except Exception as e:
            print(f"❌ Hiba a közelgő mérkőzések lekérésénél: {e}")
            return []

    def get_odds(self, fixture_id: int) -> Dict:
        """Fogadási odds lekérése egy mérkőzéshez"""
        try:
            response = requests.get(
                f"{self.base_url}/odds",
                headers=self.headers,
                params={
                    'fixture': fixture_id,
                    'bet': 1  # 1X2 fogadás
                },
                timeout=15
            )

            time.sleep(self.rate_limit_delay)

            if response.status_code == 200:
                data = response.json()
                odds_data = data.get('response', [])
                if odds_data:
                    return self._process_odds(odds_data[0])
                return {}
            else:
                print(f"❌ Odds lekérése sikertelen: {response.status_code}")
                return {}

        except Exception as e:
            print(f"❌ Hiba az odds lekérésénél: {e}")
            return {}

    def _process_odds(self, odds_data: Dict) -> Dict:
        """Odds adatok feldolgozása"""
        try:
            bookmakers = odds_data.get('bookmakers', [])
            if not bookmakers:
                return {}

            # Első fogadóiroda adatait vesszük
            first_bookmaker = bookmakers[0]
            bets = first_bookmaker.get('bets', [])

            if not bets:
                return {}

            # 1X2 fogadás értékei
            values = bets[0].get('values', [])
            odds = {}

            for value in values:
                if value['value'] == 'Home':
                    odds['home'] = float(value['odd'])
                elif value['value'] == 'Draw':
                    odds['draw'] = float(value['odd'])
                elif value['value'] == 'Away':
                    odds['away'] = float(value['odd'])

            return odds

        except Exception as e:
            print(f"❌ Odds feldolgozási hiba: {e}")
            return {}

    def get_league_standings(self, league_key: str) -> List[Dict]:
        """Liga tabella lekérése"""
        if league_key not in self.leagues:
            print(f"❌ Ismeretlen liga: {league_key}")
            return []

        league_config = self.leagues[league_key]

        try:
            response = requests.get(
                f"{self.base_url}/standings",
                headers=self.headers,
                params={
                    'league': league_config['id'],
                    'season': league_config['season']
                },
                timeout=15
            )

            time.sleep(self.rate_limit_delay)

            if response.status_code == 200:
                data = response.json()
                standings = data.get('response', [])
                if standings:
                    return standings[0]['league']['standings'][0]
                return []
            else:
                print(f"❌ Tabella lekérése sikertelen: {response.status_code}")
                return []

        except Exception as e:
            print(f"❌ Hiba a tabella lekérésénél: {e}")
            return []

    def download_league_data(self, league_key: str, output_dir: str = None):
        """Liga adatok letöltése és mentése"""
        if league_key not in self.leagues:
            print(f"❌ Ismeretlen liga: {league_key}")
            return

        league_config = self.leagues[league_key]

        if not output_dir:
            output_dir = f"data/{league_key}/raw"

        os.makedirs(output_dir, exist_ok=True)

        print(f"🔄 {league_config['name']} adatok letöltése...")

        # 1. Csapatok
        print("📥 Csapatok...")
        teams = self.get_league_teams(league_key)
        if teams:
            teams_file = os.path.join(output_dir, f"teams_{datetime.now().strftime('%Y%m%d')}.json")
            with open(teams_file, 'w', encoding='utf-8') as f:
                json.dump(teams, f, indent=2, ensure_ascii=False)
            print(f"✅ Csapatok mentve: {teams_file}")

        # 2. Mai mérkőzések
        print("📥 Mai mérkőzések...")
        todays_fixtures = self.get_todays_fixtures(league_key)
        if todays_fixtures:
            fixtures_file = os.path.join(output_dir, f"fixtures_today_{datetime.now().strftime('%Y%m%d')}.json")
            with open(fixtures_file, 'w', encoding='utf-8') as f:
                json.dump(todays_fixtures, f, indent=2, ensure_ascii=False)
            print(f"✅ Mai mérkőzések mentve: {fixtures_file}")

        # 3. Közelgő mérkőzések
        print("📥 Közelgő mérkőzések...")
        upcoming_fixtures = self.get_upcoming_fixtures(league_key, days=14)
        if upcoming_fixtures:
            upcoming_file = os.path.join(output_dir, f"fixtures_upcoming_{datetime.now().strftime('%Y%m%d')}.json")
            with open(upcoming_file, 'w', encoding='utf-8') as f:
                json.dump(upcoming_fixtures, f, indent=2, ensure_ascii=False)
            print(f"✅ Közelgő mérkőzések mentve: {upcoming_file}")

        # 4. Tabella
        print("📥 Liga tabella...")
        standings = self.get_league_standings(league_key)
        if standings:
            standings_file = os.path.join(output_dir, f"standings_{datetime.now().strftime('%Y%m%d')}.json")
            with open(standings_file, 'w', encoding='utf-8') as f:
                json.dump(standings, f, indent=2, ensure_ascii=False)
            print(f"✅ Tabella mentve: {standings_file}")

        print(f"🎉 {league_config['name']} adatok letöltve: {output_dir}")

def main():
    """Tesztelés és demó"""
    import argparse

    parser = argparse.ArgumentParser(description='Live API Client')
    parser.add_argument('--test', action='store_true', help='API kapcsolat tesztelése')
    parser.add_argument('--league', choices=['premier_league', 'mls', 'brasileirao', 'j_league', 'a_league'],
                       help='Liga adatok letöltése')
    parser.add_argument('--today', action='store_true', help='Mai mérkőzések')
    parser.add_argument('--download', action='store_true', help='Teljes adatletöltés')

    args = parser.parse_args()

    # API kulcs ellenőrzés
    api_key = os.getenv('API_SPORTS_KEY')
    if not api_key:
        print("❌ Hiányzó API kulcs!")
        print("💡 Állítsd be: export API_SPORTS_KEY='your_api_key'")
        return

    client = LiveAPIClient(api_key)

    if args.test:
        print("🧪 API kapcsolat tesztelése...")
        client.test_connection()

    if args.league:
        if args.today:
            print(f"📅 {args.league} mai mérkőzések...")
            fixtures = client.get_todays_fixtures(args.league)
            for fixture in fixtures[:3]:  # Első 3 mérkőzés
                home = fixture['teams']['home']['name']
                away = fixture['teams']['away']['name']
                date = fixture['fixture']['date']
                print(f"   ⚽ {home} vs {away} ({date})")

        if args.download:
            client.download_league_data(args.league)

if __name__ == "__main__":
    main()

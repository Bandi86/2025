#!/usr/bin/env python3
"""
🌍 MULTI-LIGA RENDSZER
Több bajnokság integrálása: Brasileirão, J-League, stb.
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List
import requests

class MultiLeagueSystem:
    """Több bajnokság kezelése"""

    def __init__(self):
        self.leagues = {
            'mls': {
                'name': 'Major League Soccer',
                'country': 'USA/Canada',
                'api_id': 253,
                'season_months': [3, 4, 5, 6, 7, 8, 9, 10, 11],  # Március-November
                'active_now': True,
                'timezone': 'America/New_York'
            },
            'brasileirao': {
                'name': 'Brasileirão Serie A',
                'country': 'Brazil',
                'api_id': 71,
                'season_months': [4, 5, 6, 7, 8, 9, 10, 11, 12],  # Április-December
                'active_now': True,
                'timezone': 'America/Sao_Paulo'
            },
            'j_league': {
                'name': 'J1 League',
                'country': 'Japan',
                'api_id': 98,
                'season_months': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Február-December
                'active_now': True,
                'timezone': 'Asia/Tokyo'
            },
            'a_league': {
                'name': 'A-League Men',
                'country': 'Australia',
                'api_id': 188,
                'season_months': [10, 11, 12, 1, 2, 3, 4, 5],  # Október-Május
                'active_now': False,  # Szezon vége
                'timezone': 'Australia/Sydney'
            }
        }

    def get_active_leagues(self) -> List[str]:
        """Jelenleg aktív bajnokságok"""
        current_month = datetime.now().month
        active = []

        for league_id, info in self.leagues.items():
            if current_month in info['season_months']:
                active.append(league_id)

        return active

    def create_league_data_structure(self, league_id: str):
        """Liga adatstruktúra létrehozása"""
        if league_id not in self.leagues:
            print(f"❌ Ismeretlen liga: {league_id}")
            return

        league_info = self.leagues[league_id]
        data_path = f"data/{league_id}"

        # Könyvtár létrehozása
        os.makedirs(data_path, exist_ok=True)
        os.makedirs(f"{data_path}/raw", exist_ok=True)
        os.makedirs(f"{data_path}/processed", exist_ok=True)

        # Konfig fájl
        config = {
            'league_name': league_info['name'],
            'country': league_info['country'],
            'api_id': league_info['api_id'],
            'season_months': league_info['season_months'],
            'timezone': league_info['timezone'],
            'data_sources': {
                'api': f"API-Sports ID: {league_info['api_id']}",
                'alternative': self._get_alternative_sources(league_id)
            },
            'last_updated': datetime.now().isoformat()
        }

        with open(f"{data_path}/league_config.json", 'w') as f:
            json.dump(config, f, indent=2)

        print(f"✅ {league_info['name']} struktúra létrehozva: {data_path}")

    def _get_alternative_sources(self, league_id: str) -> Dict:
        """Alternatív adatforrások ligánként"""
        sources = {
            'mls': {
                'official': 'https://www.mlssoccer.com',
                'espn': 'https://www.espn.com/soccer/league/_/name/mls',
                'transfermarkt': 'https://www.transfermarkt.com/major-league-soccer/startseite/wettbewerb/MLS1'
            },
            'brasileirao': {
                'official': 'https://www.cbf.com.br',
                'globo': 'https://ge.globo.com/futebol/brasileirao-serie-a/',
                'transfermarkt': 'https://www.transfermarkt.com/campeonato-brasileiro-serie-a/startseite/wettbewerb/BRA1'
            },
            'j_league': {
                'official': 'https://www.jleague.jp',
                'transfermarkt': 'https://www.transfermarkt.com/j1-league/startseite/wettbewerb/JAP1',
                'wikipedia': 'https://en.wikipedia.org/wiki/2025_J1_League'
            },
            'a_league': {
                'official': 'https://www.a-league.com.au',
                'transfermarkt': 'https://www.transfermarkt.com/a-league-men/startseite/wettbewerb/AUS1'
            }
        }
        return sources.get(league_id, {})

    def generate_sample_data(self, league_id: str, matches_count: int = 200):
        """Minta adatok generálása ligához"""
        if league_id not in self.leagues:
            print(f"❌ Ismeretlen liga: {league_id}")
            return

        print(f"🔬 {self.leagues[league_id]['name']} minta adatok...")

        # Liga specifikus csapatok
        teams = self._get_league_teams(league_id)

        # Meccsek generálása
        matches = []
        for i in range(matches_count):
            home_team = np.random.choice(teams)
            away_team = np.random.choice([t for t in teams if t != home_team])

            # Liga specifikus gól átlagok
            home_avg, away_avg = self._get_league_goal_averages(league_id)

            home_goals = np.random.poisson(home_avg)
            away_goals = np.random.poisson(away_avg)

            if home_goals > away_goals:
                result = 'H'
            elif away_goals > home_goals:
                result = 'A'
            else:
                result = 'D'

            # Szezon dátumok
            season_months = self.leagues[league_id]['season_months']
            month = np.random.choice(season_months)
            day = np.random.randint(1, 29)

            match = {
                'Date': f"2024-{month:02d}-{day:02d}",
                'HomeTeam': home_team,
                'AwayTeam': away_team,
                'FTHG': home_goals,
                'FTAG': away_goals,
                'FTR': result,
                'B365H': round(np.random.uniform(1.5, 4.0), 2),
                'B365D': round(np.random.uniform(3.0, 4.0), 2),
                'B365A': round(np.random.uniform(1.5, 4.0), 2)
            }
            matches.append(match)

        # DataFrame és mentés
        df = pd.DataFrame(matches)
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date').reset_index(drop=True)

        filename = f"data/{league_id}/{league_id}_2024_sample.csv"
        df.to_csv(filename, index=False)

        print(f"✅ {len(matches)} meccs létrehozva: {filename}")
        return df

    def _get_league_teams(self, league_id: str) -> List[str]:
        """Liga specifikus csapatok"""
        teams_dict = {
            'mls': [
                'Inter Miami CF', 'LA Galaxy', 'Atlanta United', 'Seattle Sounders',
                'Portland Timbers', 'LAFC', 'NYC FC', 'Toronto FC', 'Montreal',
                'Chicago Fire', 'Columbus Crew', 'Cincinnati', 'Nashville SC',
                'Orlando City', 'Charlotte FC', 'Austin FC', 'Houston Dynamo',
                'FC Dallas', 'Colorado Rapids', 'Real Salt Lake', 'Minnesota United',
                'Sporting KC', 'St. Louis City', 'San Jose Earthquakes', 'Vancouver',
                'New England', 'Philadelphia Union', 'DC United', 'NY Red Bulls'
            ],
            'brasileirao': [
                'Flamengo', 'Palmeiras', 'São Paulo', 'Corinthians', 'Santos',
                'Fluminense', 'Vasco da Gama', 'Botafogo', 'Cruzeiro', 'Atlético-MG',
                'Internacional', 'Grêmio', 'Bahia', 'Sport Recife', 'Fortaleza',
                'Ceará', 'Athletico-PR', 'Coritiba', 'Red Bull Bragantino', 'Goiás'
            ],
            'j_league': [
                'Kashima Antlers', 'Urawa Red Diamonds', 'Gamba Osaka', 'Kawasaki Frontale',
                'FC Tokyo', 'Yokohama F. Marinos', 'Cerezo Osaka', 'Sanfrecce Hiroshima',
                'Vissel Kobe', 'Nagoya Grampus', 'Kashiwa Reysol', 'Shimizu S-Pulse',
                'Júbilo Iwata', 'Omiya Ardija', 'Albirex Niigata', 'Consadole Sapporo',
                'Vegalta Sendai', 'Montedio Yamagata', 'Shonan Bellmare', 'Avispa Fukuoka'
            ],
            'a_league': [
                'Melbourne Victory', 'Sydney FC', 'Melbourne City', 'Western Sydney',
                'Adelaide United', 'Perth Glory', 'Wellington Phoenix', 'Brisbane Roar',
                'Newcastle Jets', 'Central Coast Mariners', 'Western United', 'Macarthur FC'
            ]
        }
        return teams_dict.get(league_id, [])

    def _get_league_goal_averages(self, league_id: str) -> tuple:
        """Liga specifikus gól átlagok (hazai, vendég)"""
        averages = {
            'mls': (1.4, 1.2),          # Amerikai foci, kevesebb gól
            'brasileirao': (1.6, 1.3),  # Brazil, támadó játék
            'j_league': (1.3, 1.1),     # Japán, taktikus játék
            'a_league': (1.5, 1.2)      # Ausztrál, közepes
        }
        return averages.get(league_id, (1.4, 1.2))

def main():
    """Főprogram"""
    print("🌍 MULTI-LIGA RENDSZER TELEPÍTÉSE")
    print("=" * 50)

    system = MultiLeagueSystem()

    # Aktív ligák
    active_leagues = system.get_active_leagues()
    print(f"⚽ Jelenleg aktív ligák ({len(active_leagues)}):")
    for league in active_leagues:
        info = system.leagues[league]
        print(f"  • {info['name']} ({info['country']})")

    print("\n📁 Liga struktúrák létrehozása...")
    for league_id in ['mls', 'brasileirao', 'j_league', 'a_league']:
        system.create_league_data_structure(league_id)

    print("\n🔬 Minta adatok generálása...")
    for league_id in active_leagues:
        df = system.generate_sample_data(league_id, matches_count=150)
        if df is not None:
            # Gyors statisztika
            results = df['FTR'].value_counts()
            home_pct = results.get('H', 0) / len(df) * 100
            draw_pct = results.get('D', 0) / len(df) * 100
            away_pct = results.get('A', 0) / len(df) * 100

            print(f"  📊 {system.leagues[league_id]['name']}:")
            print(f"      🏠 Hazai: {home_pct:.1f}% | 🤝 Döntetlen: {draw_pct:.1f}% | ✈️ Vendég: {away_pct:.1f}%")

    print("\n🎯 Következő lépések:")
    print("1. Válassz egy aktív ligát teszteléshez")
    print("2. python src/tools/daily_betting_assistant.py --league brasileirao")
    print("3. Valós API adatok integrálása")
    print("4. Multi-liga kombináció elemzés")

    print("\n✅ Multi-liga rendszer telepítve!")

if __name__ == "__main__":
    main()

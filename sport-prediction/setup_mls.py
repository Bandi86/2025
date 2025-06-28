#!/usr/bin/env python3
"""
🚀 MLS ADATOK LETÖLTŐ ÉS KONVERTÁLÓ
Valós MLS adatok keresése és a rendszerbe integrálása
"""

import pandas as pd
import requests
import os
from datetime import datetime

def search_mls_data_sources():
    """Keresés MLS adatforrásokért"""
    print("🔍 MLS adatforrások keresése...")

    sources = [
        {
            'name': 'Kaggle MLS Dataset',
            'url': 'https://www.kaggle.com/datasets/josephvm/mls-salaries-2007-2017',
            'type': 'CSV',
            'aktív': False,
            'note': 'Régi salary adatok'
        },
        {
            'name': 'Football Data API',
            'url': 'https://www.football-data.org',
            'type': 'API',
            'aktív': True,
            'note': 'MLS nincs a free tier-ben'
        },
        {
            'name': 'API-Sports',
            'url': 'https://rapidapi.com/api-sports/api/api-football',
            'type': 'API',
            'aktív': True,
            'note': 'MLS coverage, freemium'
        },
        {
            'name': 'ESPN MLS',
            'url': 'https://www.espn.com/soccer/league/_/name/mls',
            'type': 'Scraping',
            'aktív': True,
            'note': 'Fixtures, results'
        },
        {
            'name': 'MLS Official API',
            'url': 'https://www.mlssoccer.com/stats',
            'type': 'Scraping',
            'aktív': True,
            'note': 'Hivatalos statisztikák'
        },
        {
            'name': 'GitHub MLS scrapers',
            'url': 'https://github.com/search?q=mls+soccer+data',
            'type': 'Open Source',
            'aktív': True,
            'note': 'Community scrapers'
        }
    ]

    print(f"\n📊 Talált {len(sources)} lehetséges forrás:")
    for i, source in enumerate(sources, 1):
        status = "✅" if source['aktív'] else "❌"
        print(f"{i}. {status} {source['name']}")
        print(f"   🔗 {source['url']}")
        print(f"   📝 {source['note']}\n")

    return sources

def create_mls_directory_structure():
    """MLS könyvtár struktúra létrehozása"""
    print("📁 MLS könyvtár struktúra létrehozása...")

    base_path = os.path.dirname(__file__)
    mls_path = os.path.join(base_path, 'data', 'mls')

    os.makedirs(mls_path, exist_ok=True)
    os.makedirs(os.path.join(mls_path, 'raw'), exist_ok=True)
    os.makedirs(os.path.join(mls_path, 'processed'), exist_ok=True)

    # Config fájl létrehozása
    config = {
        'league_name': 'Major League Soccer',
        'country': 'USA/Canada',
        'season_format': 'Calendar year (March-November)',
        'teams_count': 29,
        'current_season': 2025,
        'data_sources': {
            'fixtures': 'https://www.espn.com/soccer/fixtures/_/league/mls',
            'results': 'https://www.espn.com/soccer/results/_/league/mls',
            'standings': 'https://www.espn.com/soccer/standings/_/league/mls'
        },
        'odds_sources': {
            'pinnacle': 'MLS coverage',
            'bet365': 'Full coverage',
            'draftkings': 'US sportsbook'
        }
    }

    import json
    with open(os.path.join(mls_path, 'league_config.json'), 'w') as f:
        json.dump(config, f, indent=2)

    print(f"✅ MLS struktúra létrehozva: {mls_path}")
    return mls_path

def create_sample_mls_data():
    """Minta MLS adatok létrehozása teszteléshez"""
    print("🔬 Minta MLS adatok létrehozása...")

    # Valós MLS csapatok 2025
    teams = [
        'Atlanta United', 'Austin FC', 'Chicago Fire', 'FC Cincinnati',
        'Columbus Crew', 'DC United', 'Inter Miami', 'Nashville SC',
        'New England Revolution', 'New York City FC', 'New York Red Bulls',
        'Orlando City', 'Philadelphia Union', 'Toronto FC', 'CF Montreal',
        'Colorado Rapids', 'FC Dallas', 'Houston Dynamo', 'LA Galaxy',
        'LAFC', 'Minnesota United', 'Portland Timbers', 'Real Salt Lake',
        'San Jose Earthquakes', 'Seattle Sounders', 'Sporting Kansas City',
        'St. Louis City SC', 'Vancouver Whitecaps', 'Charlotte FC'
    ]

    # Szimulált 2024 szezon adatok
    import random
    import numpy as np

    matches = []
    for i in range(300):  # ~300 mérkőzés szezonban
        home_team = random.choice(teams)
        away_team = random.choice([t for t in teams if t != home_team])

        # Valósághű gólok
        home_goals = np.random.poisson(1.3)
        away_goals = np.random.poisson(1.1)

        if home_goals > away_goals:
            result = 'H'
        elif away_goals > home_goals:
            result = 'A'
        else:
            result = 'D'

        # Valósághű odds
        if result == 'H':
            home_odds = round(random.uniform(1.8, 2.5), 2)
            draw_odds = round(random.uniform(3.2, 3.8), 2)
            away_odds = round(random.uniform(2.8, 4.5), 2)
        elif result == 'A':
            home_odds = round(random.uniform(2.8, 4.5), 2)
            draw_odds = round(random.uniform(3.2, 3.8), 2)
            away_odds = round(random.uniform(1.8, 2.5), 2)
        else:
            home_odds = round(random.uniform(2.5, 3.2), 2)
            draw_odds = round(random.uniform(3.0, 3.4), 2)
            away_odds = round(random.uniform(2.5, 3.2), 2)

        match = {
            'Date': f"2024-{random.randint(3, 10):02d}-{random.randint(1, 28):02d}",
            'HomeTeam': home_team,
            'AwayTeam': away_team,
            'FTHG': home_goals,
            'FTAG': away_goals,
            'FTR': result,
            'B365H': home_odds,
            'B365D': draw_odds,
            'B365A': away_odds
        }
        matches.append(match)

    df = pd.DataFrame(matches)
    df = df.sort_values('Date').reset_index(drop=True)

    # Mentés
    mls_path = os.path.join(os.path.dirname(__file__), 'data', 'mls')
    df.to_csv(os.path.join(mls_path, 'mls2024_sample.csv'), index=False)

    print(f"✅ {len(matches)} minta mérkőzés létrehozva")
    print(f"📊 Csapatok: {len(teams)}")
    return df

def test_mls_integration():
    """MLS integráció tesztelése"""
    print("🧪 MLS integráció tesztelése...")

    try:
        # Import test
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'core'))
        from data_loader import load_data

        # MLS adat betöltése
        mls_file = os.path.join(os.path.dirname(__file__), 'data', 'mls', 'mls2024_sample.csv')
        if os.path.exists(mls_file):
            mls_data = load_data([mls_file])
            print(f"✅ MLS adatok betöltve: {len(mls_data)} mérkőzés")

            # Alapstatisztikák
            teams = set(mls_data['HomeTeam']) | set(mls_data['AwayTeam'])
            print(f"📊 {len(teams)} MLS csapat")
            print(f"📅 Időszak: {mls_data['Date'].min()} - {mls_data['Date'].max()}")

            # Eredmény eloszlás
            results = mls_data['FTR'].value_counts()
            print(f"🏠 Hazai győzelem: {results.get('H', 0)} ({results.get('H', 0)/len(mls_data)*100:.1f}%)")
            print(f"🤝 Döntetlen: {results.get('D', 0)} ({results.get('D', 0)/len(mls_data)*100:.1f}%)")
            print(f"✈️ Vendég győzelem: {results.get('A', 0)} ({results.get('A', 0)/len(mls_data)*100:.1f}%)")

            return True
        else:
            print("❌ MLS adatfájl nem található")
            return False

    except Exception as e:
        print(f"❌ Hiba az MLS integráció tesztelése során: {e}")
        return False

def main():
    """Főprogram"""
    print("🚀 MLS INTEGRÁCIÓ INDÍTÁSA")
    print("=" * 50)

    # 1. Adatforrások keresése
    sources = search_mls_data_sources()

    # 2. Könyvtár struktúra
    mls_path = create_mls_directory_structure()

    # 3. Minta adatok
    sample_data = create_sample_mls_data()

    # 4. Integráció teszt
    success = test_mls_integration()

    print("\n" + "=" * 50)
    print("📋 ÖSSZEFOGLALÓ:")
    print(f"✅ Adatforrások: {len(sources)} opció")
    print(f"✅ MLS struktúra: {mls_path}")
    print(f"✅ Minta adatok: {len(sample_data)} mérkőzés")
    print(f"{'✅' if success else '❌'} Integráció teszt")

    print("\n🎯 KÖVETKEZŐ LÉPÉSEK:")
    print("1. python src/tools/daily_betting_assistant.py --league mls")
    print("2. Valós API kulcs beszerzése")
    print("3. Live odds integráció")

if __name__ == "__main__":
    main()

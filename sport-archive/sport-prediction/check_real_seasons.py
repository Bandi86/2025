#!/usr/bin/env python3
"""
🔍 VALÓDI SZEZON STÁTUSZ ELLENŐRZŐ
Mutatja hogy mely ligák aktívak jelenleg (2025 június)
"""

from datetime import datetime

def check_real_season_status():
    """Valódi szezon státuszok ellenőrzése"""
    current_date = datetime.now()
    current_month = current_date.month
    current_year = current_date.year

    print(f"📅 SZEZON STÁTUSZ ELLENŐRZÉS")
    print(f"🗓️ Mai dátum: {current_date.strftime('%Y-%m-%d')} ({current_month}. hónap)")
    print("=" * 60)

    leagues = {
        'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿': {
            'season': '2024/25',
            'active_months': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
            'break_months': [6, 7],
            'status': 'Nyári szünet',
            'next_matches': 'Augusztus 2025'
        },
        'MLS 🇺🇸': {
            'season': '2025',
            'active_months': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            'break_months': [12, 1],
            'status': 'AKTÍV SZEZON',
            'next_matches': 'HETENTE vannak meccsek!'
        },
        'Brasileirão 🇧🇷': {
            'season': '2025',
            'active_months': [4, 5, 6, 7, 8, 9, 10, 11, 12],
            'break_months': [1, 2, 3],
            'status': 'AKTÍV SZEZON',
            'next_matches': 'HETENTE vannak meccsek!'
        },
        'J1 League 🇯🇵': {
            'season': '2025',
            'active_months': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            'break_months': [1],
            'status': 'AKTÍV SZEZON',
            'next_matches': 'HETENTE vannak meccsek!'
        }
    }

    for league_name, info in leagues.items():
        is_active = current_month in info['active_months']

        print(f"\n⚽ {league_name}")
        print(f"   📅 Szezon: {info['season']}")
        print(f"   📊 Státusz: {info['status']}")
        print(f"   🎯 Következő: {info['next_matches']}")

        if is_active:
            print(f"   ✅ AKTÍV - meccsek várhatók!")
        else:
            print(f"   ❌ INAKTÍV - szezon szünet")

    print("\n" + "=" * 60)
    print("💡 KÖVETKEZTETÉSEK:")
    print("   🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League: NYÁRI SZÜNET (június-július)")
    print("   🇺🇸 MLS: AKTÍV! Valódi API kellene!")
    print("   🇧🇷 Brasileirão: AKTÍV! Valódi API kellene!")
    print("   🇯🇵 J1 League: AKTÍV! Valódi API kellene!")

    print("\n🔧 MEGOLDÁSOK:")
    print("   1. API kulcs beszerzése: https://rapidapi.com/api-sports/")
    print("   2. Manuális adatok: ESPN, ESPN FC, hivatalos ligák")
    print("   3. Alternatív API-k: TheSportsDB, Football-Data.org")
    print("   4. Web scraping: Hivatalos ligák oldalai")

def show_real_api_example():
    """Valódi API használat példája"""
    print("\n📡 VALÓDI API HASZNÁLAT:")
    print("=" * 40)

    api_example = """
# 1. API kulcs megszerzése
# Regisztrálj: https://rapidapi.com/api-sports/
export API_SPORTS_KEY="your_actual_api_key"

# 2. Valódi adatok letöltése
python src/api/live_api_client.py --league mls --download

# 3. Mai meccsek ellenőrzése
python src/api/live_api_client.py --league mls --today

# 4. Live elemzés
python src/tools/live_betting_analyzer.py --league mls --save
"""

    print(api_example)

    print("💰 KÖLTSÉGEK (API-Sports):")
    print("   🆓 Ingyenes tier: 100 kérés/nap")
    print("   💵 Basic tier: $10/hó - 1000 kérés/nap")
    print("   🚀 Pro tier: $25/hó - 10000 kérés/nap")

def show_alternative_sources():
    """Alternatív adatforrások"""
    print("\n🌐 ALTERNATÍV ADATFORRÁSOK:")
    print("=" * 40)

    sources = {
        'MLS 🇺🇸': [
            'https://www.mlssoccer.com/fixtures/',
            'https://www.espn.com/soccer/league/_/name/mls',
            'https://www.flashscore.com/soccer/usa/mls/',
        ],
        'Brasileirão 🇧🇷': [
            'https://ge.globo.com/futebol/brasileirao-serie-a/',
            'https://www.cbf.com.br/futebol-brasileiro/competicoes/campeonato-brasileiro-serie-a',
            'https://www.flashscore.com/soccer/brazil/serie-a/',
        ],
        'J1 League 🇯🇵': [
            'https://www.jleague.jp/en/',
            'https://www.espn.com/soccer/league/_/name/jap.1',
            'https://www.flashscore.com/soccer/japan/j1-league/',
        ]
    }

    for league, urls in sources.items():
        print(f"\n⚽ {league}:")
        for url in urls:
            print(f"   🔗 {url}")

if __name__ == "__main__":
    check_real_season_status()
    show_real_api_example()
    show_alternative_sources()

#!/usr/bin/env python3
"""
🎯 VALÓDI ADATOK BESZERZÉSE - ÚTMUTATÓ
Ez a script megmutatja, hogyan szerezz be valódi mérkőzés adatokat.
"""

import requests
import json
from datetime import datetime
import os

def check_free_sports_apis():
    """Ingyenes sport API-k tesztelése."""
    print("🔍 INGYENES SPORT API-K TESZTELÉSE")
    print("=" * 50)

    # 1. TheSportsDB (ingyenes, korlátozott)
    print("\n1️⃣ TheSportsDB API:")
    try:
        # Premier League következő meccsek
        url = "https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=133604"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            events = data.get('events', [])
            print(f"   ✅ Működik! {len(events)} következő PL mérkőzés")
            if events:
                event = events[0]
                print(f"   📅 Következő: {event.get('strEvent', 'N/A')} - {event.get('dateEvent', 'N/A')}")
        else:
            print(f"   ❌ Hiba: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Hiba: {e}")

    # 2. ESPN API (publikus endpoint-ok)
    print("\n2️⃣ ESPN API:")
    try:
        # MLS meccsek
        url = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            events = data.get('events', [])
            print(f"   ✅ Működik! {len(events)} MLS mérkőzés")
            if events:
                event = events[0]
                print(f"   📅 Mérkőzés: {event.get('name', 'N/A')} - {event.get('date', 'N/A')}")
        else:
            print(f"   ❌ Hiba: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Hiba: {e}")

    # 3. Football-Data.org (API kulcs kell, de ingyenes tier van)
    print("\n3️⃣ Football-Data.org:")
    api_key = os.getenv('FOOTBALL_DATA_API_KEY')
    if api_key:
        try:
            headers = {'X-Auth-Token': api_key}
            url = "https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED"
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                matches = data.get('matches', [])
                print(f"   ✅ Működik! {len(matches)} következő PL mérkőzés")
            else:
                print(f"   ❌ Hiba: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Hiba: {e}")
    else:
        print("   ⚠️ API kulcs hiányzik: export FOOTBALL_DATA_API_KEY='your_key'")
        print("   🔗 Regisztrálj: https://www.football-data.org/client/register")

def check_premium_apis():
    """Prémium API-k ellenőrzése."""
    print("\n\n💰 PRÉMIUM API-K")
    print("=" * 30)

    # API-Sports
    api_key = os.getenv('API_SPORTS_KEY')
    if api_key:
        print("✅ API-Sports kulcs beállítva")
        try:
            headers = {
                'X-RapidAPI-Key': api_key,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            }
            url = "https://api-football-v1.p.rapidapi.com/v3/fixtures"
            params = {'date': datetime.now().strftime('%Y-%m-%d'), 'league': '39'}  # Premier League
            response = requests.get(url, headers=headers, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                fixtures = data.get('response', [])
                print(f"   ✅ {len(fixtures)} mai PL mérkőzés")
            else:
                print(f"   ❌ API hiba: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Hiba: {e}")
    else:
        print("⚠️ API-Sports kulcs hiányzik: export API_SPORTS_KEY='your_key'")
        print("🔗 Regisztrálj: https://rapidapi.com/api-sports/api/api-football")

def show_manual_sources():
    """Kézi adatforrások megjelenítése."""
    print("\n\n📖 KÉZI ADATFORRÁSOK")
    print("=" * 30)

    sources = {
        "Premier League": [
            "https://www.premierleague.com/fixtures",
            "https://www.bbc.com/sport/football/premier-league/fixtures",
            "https://www.espn.com/soccer/fixtures/_/league/eng.1"
        ],
        "MLS": [
            "https://www.mlssoccer.com/schedule/",
            "https://www.espn.com/soccer/fixtures/_/league/usa.1"
        ],
        "Brasileirão": [
            "https://www.cbf.com.br/futebol-brasileiro/competicoes/campeonato-brasileiro-serie-a",
            "https://www.espn.com.br/futebol/brasileiro/tabela"
        ],
        "J1 League": [
            "https://www.jleague.jp/en/match/",
            "https://www.espn.com/soccer/fixtures/_/league/jpn.1"
        ]
    }

    for league, urls in sources.items():
        print(f"\n🏆 {league}:")
        for url in urls:
            print(f"   🔗 {url}")

def show_integration_steps():
    """Integráció lépései."""
    print("\n\n🔧 INTEGRÁCIÓ LÉPÉSEI")
    print("=" * 30)

    steps = [
        "1️⃣ Válassz egy API szolgáltatót (ingyenes vagy fizetős)",
        "2️⃣ Regisztrálj és szerezz API kulcsot",
        "3️⃣ Állítsd be a környezeti változót: export API_KEY='your_key'",
        "4️⃣ Módosítsd a live_api_client.py fájlt az új API-hoz",
        "5️⃣ Teszteld az API kapcsolatot",
        "6️⃣ Frissítsd a daily_betting_assistant.py -t",
        "7️⃣ Állítsd be a cron job-ot automatikus futtatáshoz"
    ]

    for step in steps:
        print(f"   {step}")

def main():
    """Fő függvény."""
    print("🎯 SPORT BETTING RENDSZER - VALÓDI ADATOK")
    print("📅", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    print("=" * 60)

    check_free_sports_apis()
    check_premium_apis()
    show_manual_sources()
    show_integration_steps()

    print("\n" + "=" * 60)
    print("💡 KÖVETKEZŐ LÉPÉSEK:")
    print("   🔑 Szerezz be API kulcsot")
    print("   ⚙️ Módosítsd a live_api_client.py -t")
    print("   🧪 Teszteld a rendszert valódi adatokkal")
    print("   🚀 Automatizáld a napi futtatást")

if __name__ == "__main__":
    main()

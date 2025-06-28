#!/usr/bin/env python3
"""
🎯 PDF → PREDIKCIÓ EGYSZERŰ DEMO
Egyszerű workflow demonstráció PDF adatok alapján
"""

import os
import sys
import json
from datetime import datetime

# Projekz gyökér hozzáadása
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def simple_pdf_workflow_demo():
    """Egyszerű PDF workflow demo"""
    print("🎯 PDF → PREDIKCIÓ EGYSZERŰ DEMO")
    print("="*50)

    # 1. Betöltjük a létrehozott JSON fájlt
    json_file = "data/daily_matches_20250628.json"

    if not os.path.exists(json_file):
        print(f"❌ JSON fájl nem található: {json_file}")
        print("💡 Futtasd előbb: python master.py --pdf-betting")
        return

    print(f"📋 JSON fájl betöltése: {json_file}")

    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            matches_data = json.load(f)

        print(f"✅ {matches_data['total_matches']} meccs betöltve")

        # 2. Meccsek megjelenítése
        print(f"\n⚽ MECCSEK RÉSZLETESEN:")
        print("="*50)

        for i, match in enumerate(matches_data['matches'], 1):
            print(f"\n🎯 {i}. MECCS")
            print(f"🏟️  {match['home_team']} vs {match['away_team']}")
            print(f"📅 {match['date']} {match['time']}")
            print(f"🏆 {match['competition']}")

            if match.get('venue'):
                print(f"🏟️  Helyszín: {match['venue']}")

            # Odds megjelenítése
            odds = match.get('odds', {})

            if odds.get('match_result'):
                mr = odds['match_result']
                print(f"💰 1X2: {mr.get('home_win')} / {mr.get('draw')} / {mr.get('away_win')}")

            if odds.get('total_goals'):
                tg = odds['total_goals']
                print(f"⚽ Gólok: Over 2.5 ({tg.get('over_25')}) / Under 2.5 ({tg.get('under_25')})")

            if odds.get('both_teams_score'):
                btts = odds['both_teams_score']
                print(f"🎯 BTTS: Igen ({btts.get('yes')}) / Nem ({btts.get('no')})")

            if odds.get('corners'):
                corners = odds['corners']
                print(f"📐 Szögletek: Over 9 ({corners.get('over_9')}) / Under 9 ({corners.get('under_9')})")

            if odds.get('cards'):
                cards = odds['cards']
                print(f"🟨 Lapok: Over 3 ({cards.get('over_3')}) / Under 3 ({cards.get('under_3')})")

        # 3. Egyszerű predikciós logika
        print(f"\n🔮 EGYSZERŰ PREDIKCIÓK:")
        print("="*50)

        for i, match in enumerate(matches_data['matches'], 1):
            print(f"\n🎯 {i}. {match['home_team']} vs {match['away_team']}")

            odds = match.get('odds', {})

            # Egyszerű value betting keresés
            value_bets = []

            if odds.get('match_result'):
                mr = odds['match_result']
                home_odds = mr.get('home_win', 0)
                draw_odds = mr.get('draw', 0)
                away_odds = mr.get('away_win', 0)

                # Egyszerű logika: ha az odds > 3.0, akkor potenciális value
                if home_odds > 3.0:
                    value_bets.append(f"Hazai győzelem ({home_odds})")
                if draw_odds > 3.0:
                    value_bets.append(f"Döntetlen ({draw_odds})")
                if away_odds > 3.0:
                    value_bets.append(f"Vendég győzelem ({away_odds})")

            # BTTS érték keresés
            if odds.get('both_teams_score'):
                btts = odds['both_teams_score']
                yes_odds = btts.get('yes', 0)
                no_odds = btts.get('no', 0)

                if yes_odds > 1.8:
                    value_bets.append(f"BTTS Igen ({yes_odds})")
                if no_odds > 2.0:
                    value_bets.append(f"BTTS Nem ({no_odds})")

            # Over/Under value keresés
            if odds.get('total_goals'):
                tg = odds['total_goals']
                over_odds = tg.get('over_25', 0)
                under_odds = tg.get('under_25', 0)

                if over_odds > 1.9:
                    value_bets.append(f"Over 2.5 ({over_odds})")
                if under_odds > 1.9:
                    value_bets.append(f"Under 2.5 ({under_odds})")

            # Eredmények
            if value_bets:
                print(f"💎 Value betting lehetőségek:")
                for bet in value_bets:
                    print(f"   📈 {bet}")
            else:
                print(f"❌ Nincs jelentős value betting lehetőség")

            # Egyszerű tendencia elemzés
            if odds.get('match_result'):
                mr = odds['match_result']
                home_odds = mr.get('home_win', 4.0)
                away_odds = mr.get('away_win', 4.0)

                if home_odds < 2.0:
                    print(f"🏠 Erős hazai esélyes")
                elif away_odds < 2.0:
                    print(f"✈️  Erős vendég esélyes")
                else:
                    print(f"⚖️  Kiegyenlített meccs")

        # 4. Összefoglaló
        print(f"\n📊 ÖSSZEFOGLALÓ:")
        print("="*50)

        total_matches = len(matches_data['matches'])
        competitions = {}

        for match in matches_data['matches']:
            comp = match['competition']
            competitions[comp] = competitions.get(comp, 0) + 1

        print(f"📋 Összes meccs: {total_matches}")
        print(f"🏆 Bajnokságok:")
        for comp, count in competitions.items():
            print(f"   {comp}: {count} meccs")

        print(f"\n📄 Fájl info:")
        print(f"   📍 Útvonal: {json_file}")
        print(f"   📊 Méret: {os.path.getsize(json_file)} byte")
        print(f"   🕐 Generálva: {matches_data.get('generated_at', 'N/A')}")

        # 5. Következő lépések
        print(f"\n🚀 KÖVETKEZŐ LÉPÉSEK:")
        print("="*50)
        print("📝 Amit csinálhatsz:")
        print("   1. 🎯 Részletes predikciók: python master.py --enhanced-prediction")
        print("   2. 📊 Live elemzés: python master.py --live-predict")
        print("   3. 🤖 Automation: python master.py --setup-automation")
        print("   4. 📄 Újabb PDF: python master.py --pdf-betting")

        print(f"\n💡 TIPPEK:")
        print("   • A PDF workflow 3 naponta fut újra")
        print("   • Value betting számítások egyszerűsítettek")
        print("   • Valós használathoz API integráció ajánlott")
        print("   • Telegram bot-tal lehet automatizálni")

        print(f"\n✅ DEMO BEFEJEZVE!")

    except Exception as e:
        print(f"❌ Hiba: {e}")

if __name__ == "__main__":
    simple_pdf_workflow_demo()

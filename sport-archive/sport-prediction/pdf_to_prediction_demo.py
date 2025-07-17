#!/usr/bin/env python3
"""
🎯 TELJES PDF → PREDIKCIÓ WORKFLOW DEMO
Bemutatja a teljes folyamatot: PDF feldolgozás → JSON → Részletes predikció
"""

import asyncio
import os
import sys
import json
from datetime import datetime

# Projekz gyökér hozzáadása
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.tools.hungarian_pdf_processor import HungarianBettingPDFProcessor, MatchInfo
from src.prediction.enhanced_prediction_engine import EnhancedPredictionEngine

def full_pdf_to_prediction_workflow():
    """Teljes workflow demonstráció"""
    print("🎯 TELJES PDF → PREDIKCIÓ WORKFLOW")
    print("="*60)

    # 1. PDF Processor inicializálás
    print("\n📄 1. LÉPÉS: PDF Processor inicializálás")
    processor = HungarianBettingPDFProcessor()
    print("   ✅ PDF Processor kész")

    # 2. Demo PDF adatok generálása (valós PDF helyett)
    print("\n🎭 2. LÉPÉS: Demo PDF adatok generálása")
    print("   (Valós használatban itt történne a PDF letöltés és feldolgozás)")

    # Minta adatok generálása
    demo_matches = processor.save_matches_to_json([
        # Magyar meccsek
        MatchInfo(
            match_id="2025-06-29_Ferencvaros_Ujpest",
            date="2025-06-29",
            time="18:00",
            home_team="Ferencváros",
            away_team="Újpest",
            competition="NB I",
            venue="Groupama Aréna",
            home_win_odds=1.45,
            draw_odds=3.80,
            away_win_odds=6.20,
            over_25_odds=1.85,
            under_25_odds=1.95,
            btts_yes_odds=1.75,
            btts_no_odds=2.05,
            corners_over_9_odds=1.90,
            corners_under_9_odds=1.90,
            cards_over_3_odds=2.10,
            cards_under_3_odds=1.70
        ),

        # Nemzetközi meccsek
        MatchInfo(
            match_id="2025-06-29_Real_Madrid_Barcelona",
            date="2025-06-29",
            time="20:00",
            home_team="Real Madrid",
            away_team="FC Barcelona",
            competition="La Liga",
            venue="Santiago Bernabéu",
            home_win_odds=2.25,
            draw_odds=3.20,
            away_win_odds=3.10,
            over_25_odds=1.80,
            under_25_odds=2.00,
            btts_yes_odds=1.65,
            btts_no_odds=2.20,
            corners_over_9_odds=1.95,
            corners_under_9_odds=1.85,
            cards_over_3_odds=1.85,
            cards_under_3_odds=1.95
        ),

        # Premier League
        MatchInfo(
            match_id="2025-06-30_Manchester_City_Liverpool",
            date="2025-06-30",
            time="16:00",
            home_team="Manchester City",
            away_team="Liverpool FC",
            competition="Premier League",
            venue="Etihad Stadium",
            home_win_odds=2.10,
            draw_odds=3.40,
            away_win_odds=3.20,
            over_25_odds=1.85,
            under_25_odds=1.95,
            btts_yes_odds=1.75,
            btts_no_odds=2.05,
            corners_over_9_odds=1.90,
            corners_under_9_odds=1.90,
            cards_over_3_odds=2.10,
            cards_under_3_odds=1.70
        )
    ])

    print(f"   ✅ JSON fájl létrehozva: {demo_matches}")

    # 3. JSON betöltés és validáció
    print("\n📋 3. LÉPÉS: JSON betöltés és validáció")
    try:
        with open(demo_matches, 'r', encoding='utf-8') as f:
            matches_data = json.load(f)

        print(f"   ✅ {matches_data['total_matches']} meccs betöltve")
        print(f"   📅 Generálva: {matches_data['generated_at']}")

        # Meccsek listázása
        print("\n   📋 Betöltött meccsek:")
        for i, match in enumerate(matches_data['matches'], 1):
            print(f"      {i}. {match['home_team']} vs {match['away_team']}")
            print(f"         🗓️  {match['date']} {match['time']}")
            print(f"         🏆 {match['competition']}")

    except Exception as e:
        print(f"   ❌ Hiba a JSON betöltése során: {e}")
        return

    # 4. Enhanced Prediction Engine inicializálás
    print("\n🎯 4. LÉPÉS: Enhanced Prediction Engine inicializálás")
    engine = EnhancedPredictionEngine()
    print("   ✅ Prediction Engine kész")

    # 5. Predikciók generálása
    print("\n🔮 5. LÉPÉS: Részletes predikciók generálása")
    print("="*60)

    for i, match in enumerate(matches_data['matches'], 1):
        print(f"\n🎯 PREDIKCIÓ {i}/{len(matches_data['matches'])}")
        print("-"*40)

        try:
            # Predikció generálása (async)
            prediction = await engine.create_detailed_prediction(match)

            # Rövid összefoglaló
            print(f"🏟️  {prediction.home_team} vs {prediction.away_team}")
            print(f"🎯 Bizalom: {prediction.confidence_score:.1f}%")
            print(f"🏆 Bajnokság: {match['competition']}")

            # Legjobb fogadási javaslat
            if prediction.value_bets:
                best_bet = max(prediction.value_bets, key=lambda x: x['expected_profit'])
                print(f"💎 Legjobb fogadás: {best_bet['market']} - {best_bet['selection']}")
                print(f"   Odds: {best_bet['odds']} | Várható nyereség: +{best_bet['expected_profit']:.1f}%")

            # Részletes eredmény megjelenítése
            if i == 1:  # Csak az első meccshez részletes eredmény
                print(f"\n📊 RÉSZLETES ELEMZÉS:")
                engine.display_prediction_summary(prediction)

        except Exception as e:
            print(f"   ❌ Hiba a predikció generálása során: {e}")

    # 6. Összefoglaló riport
    print(f"\n📈 6. LÉPÉS: Összefoglaló riport")
    print("="*60)

    try:
        # Statisztikák gyűjtése
        total_matches = len(matches_data['matches'])
        high_confidence_count = 0
        total_value_bets = 0

        competitions = {}

        for match in matches_data['matches']:
            # Kompetíciók számlálása
            comp = match['competition']
            competitions[comp] = competitions.get(comp, 0) + 1

            # Szimulált statisztikák (valós predikció alapján)
            prediction = engine.generate_detailed_prediction(match)
            if prediction.confidence_score > 70:
                high_confidence_count += 1
            total_value_bets += len(prediction.value_bets)

        print(f"📊 Általános statisztikák:")
        print(f"   📋 Összes meccs: {total_matches}")
        print(f"   🎯 Magas bizalom (>70%): {high_confidence_count}")
        print(f"   💎 Value betting lehetőségek: {total_value_bets}")

        print(f"\n🏆 Bajnokságok eloszlása:")
        for comp, count in competitions.items():
            print(f"   {comp}: {count} meccs")

        print(f"\n💾 Fájlok:")
        print(f"   📄 JSON fájl: {demo_matches}")
        print(f"   📊 Méret: {os.path.getsize(demo_matches)} byte")

    except Exception as e:
        print(f"❌ Hiba az összefoglaló készítése során: {e}")

    # 7. Következő lépések
    print(f"\n🚀 7. KÖVETKEZŐ LÉPÉSEK")
    print("="*60)
    print("📋 Mit lehet tenni ezután:")
    print("   1. 📊 Részletes elemzés: python src/prediction/enhanced_prediction_engine.py")
    print("   2. 🎯 Live predikciók: python master.py --live-predict")
    print("   3. 📈 Advanced analyzer: python master.py --enhanced-live-predict")
    print("   4. 🤖 Automation setup: python master.py --setup-automation")
    print("   5. 📄 Valós PDF letöltés: Adj meg egy PDF URL-t a processor-nak")

    print(f"\n💡 Tippek a valós használathoz:")
    print("   • 📄 Szerezz be egy magyar fogadóiroda PDF URL-jét")
    print("   • ⏰ Állíts be cron job-ot 3 naponta a PDF frissítéshez")
    print("   • 📱 Integráld Telegram bot-tal az értesítésekhez")
    print("   • 💾 Mentsd el a históriát további elemzésekhez")

    print(f"\n✅ WORKFLOW BEFEJEZVE!")
    print("🎯 Sikeres PDF → JSON → Predikció workflow!")

if __name__ == "__main__":
    full_pdf_to_prediction_workflow()

#!/usr/bin/env python3
"""
🧪 TOVÁBBFEJLESZTETT LIVE PREDICTOR TESZT
Demonstrálja a fejlett predikciós rendszer képességeit szimulált adatokkal
"""

import asyncio
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from typing import Dict, List, Optional
import numpy as np

# Import the enhanced predictor classes
import sys
import os
sys.path.append(os.path.dirname(__file__))

from enhanced_live_predictor import UpcomingMatch, TeamHistoricalData, EnhancedLivePredictor

class EnhancedLivePredictorDemo(EnhancedLivePredictor):
    """Demo verzió szimulált adatokkal"""

    async def get_demo_matches(self) -> List[UpcomingMatch]:
        """Demo meccsek generálása"""
        now = datetime.now(timezone.utc)

        demo_matches = [
            UpcomingMatch(
                fixture_id=1001,
                home_team="Manchester City",
                away_team="Liverpool FC",
                competition="Premier League",
                kickoff_time=now + timedelta(hours=2),
                venue="Etihad Stadium",
                api_data={},
                bookmaker_odds={
                    'home_odds': 2.1,
                    'draw_odds': 3.4,
                    'away_odds': 3.2,
                    'bookmaker': 'Bet365'
                }
            ),
            UpcomingMatch(
                fixture_id=1002,
                home_team="FC Barcelona",
                away_team="Real Madrid",
                competition="La Liga",
                kickoff_time=now + timedelta(hours=3),
                venue="Camp Nou",
                api_data={},
                bookmaker_odds={
                    'home_odds': 1.8,
                    'draw_odds': 3.6,
                    'away_odds': 4.2,
                    'bookmaker': 'William Hill'
                }
            ),
            UpcomingMatch(
                fixture_id=1003,
                home_team="Bayern Munich",
                away_team="Borussia Dortmund",
                competition="Bundesliga",
                kickoff_time=now + timedelta(hours=1.5),
                venue="Allianz Arena",
                api_data={}
            ),
            UpcomingMatch(
                fixture_id=1004,
                home_team="Juventus",
                away_team="AC Milan",
                competition="Serie A",
                kickoff_time=now + timedelta(hours=3.5),
                venue="Allianz Stadium",
                api_data={},
                bookmaker_odds={
                    'home_odds': 2.3,
                    'draw_odds': 3.1,
                    'away_odds': 2.9,
                    'bookmaker': 'Betfair'
                }
            ),
            UpcomingMatch(
                fixture_id=1005,
                home_team="Paris Saint-Germain",
                away_team="Olympique Marseille",
                competition="Ligue 1",
                kickoff_time=now + timedelta(hours=2.5),
                venue="Parc des Princes",
                api_data={}
            )
        ]

        print(f"🎭 DEMO MÓDBAN: {len(demo_matches)} szimulált meccs")
        print("=" * 60)

        return demo_matches

    async def get_demo_team_history(self, team_name: str) -> TeamHistoricalData:
        """Realisztikus demo csapat adatok"""
        print(f"📚 {team_name} részletes történeti elemzése (DEMO)...")

        # Nagyobb csapatok jobb statisztikákkal
        elite_teams = [
            "Manchester City", "Liverpool FC", "FC Barcelona", "Real Madrid",
            "Bayern Munich", "Paris Saint-Germain", "Juventus"
        ]

        strong_teams = [
            "Borussia Dortmund", "AC Milan", "Olympique Marseille", "Arsenal",
            "Chelsea", "Tottenham", "Atletico Madrid"
        ]

        if team_name in elite_teams:
            base_strength = 2.2
            form_quality = 0.7
            home_advantage = 0.75
            away_performance = 0.60
        elif team_name in strong_teams:
            base_strength = 1.8
            form_quality = 0.5
            home_advantage = 0.65
            away_performance = 0.45
        else:
            base_strength = 1.4
            form_quality = 0.3
            home_advantage = 0.55
            away_performance = 0.35

        np.random.seed(hash(team_name) % 2**32)

        # Realisztikus statisztikák
        goals_scored = max(0.5, np.random.normal(base_strength, 0.3))
        goals_conceded = max(0.3, np.random.normal(1.8 - base_strength * 0.4, 0.2))

        # Forma generálása
        recent_form = []
        for _ in range(10):
            rand = np.random.random()
            if rand < form_quality:
                recent_form.append('W')
            elif rand < form_quality + 0.25:
                recent_form.append('D')
            else:
                recent_form.append('L')

        # Fejlett statisztikák
        possession = max(30.0, min(70.0, np.random.normal(50 + base_strength * 5, 8)))
        shots_on_target = max(2.0, np.random.normal(3.5 + base_strength, 1.0))
        cards = max(1.0, np.random.normal(2.5 - base_strength * 0.2, 0.5))
        corners = max(3.0, np.random.normal(5.0 + base_strength * 0.5, 1.2))

        # Hazai/vendég teljesítmény
        home_wins = int(25 * home_advantage)
        home_draws = np.random.randint(5, 12)
        home_losses = 25 - home_wins - home_draws

        away_wins = int(25 * away_performance)
        away_draws = np.random.randint(6, 11)
        away_losses = 25 - away_wins - away_draws

        return TeamHistoricalData(
            team_name=team_name,
            last_50_matches=[{} for _ in range(45)],  # 45 "valós" meccs
            avg_goals_scored=goals_scored,
            avg_goals_conceded=goals_conceded,
            recent_form=recent_form,
            home_performance={
                'matches': 25,
                'wins': home_wins,
                'draws': home_draws,
                'losses': home_losses,
                'win_rate': home_wins / 25
            },
            away_performance={
                'matches': 25,
                'wins': away_wins,
                'draws': away_draws,
                'losses': away_losses,
                'win_rate': away_wins / 25
            },
            goal_difference_avg=goals_scored - goals_conceded,
            shots_on_target_avg=shots_on_target,
            possession_avg=possession,
            cards_avg=cards,
            corners_avg=corners,
            league_performance={
                'current_position': np.random.randint(1, 20),
                'points_per_game': max(0.5, min(2.5, np.random.normal(1.3 + base_strength * 0.3, 0.4)))
            },
            head_to_head={'meetings': 0, 'wins': 0, 'draws': 0, 'losses': 0}
        )

async def demo_enhanced_prediction():
    """Demo futtatása"""
    predictor = EnhancedLivePredictorDemo()

    print("🚀 TOVÁBBFEJLESZTETT VALÓS IDEJŰ MECCS ELŐREJELZŐ - DEMO")
    print("📅", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    print("=" * 70)
    print("🎭 DEMO MÓDBAN - Szimulált adatok valós algoritmussal")
    print("=" * 70)

    # Demo meccsek lekérdezése
    demo_matches = await predictor.get_demo_matches()

    # Predikciók készítése
    print(f"\n🔮 {len(demo_matches)} MECCS FEJLETT PREDIKCIÓJA")
    print("=" * 60)

    predictions = []

    for match in demo_matches:
        print(f"\n⚽ {match.home_team} vs {match.away_team}")
        print(f"   🕐 {match.kickoff_time.strftime('%H:%M')} | 🏟️ {match.venue}")
        print(f"   🏆 {match.competition}")

        # Bookmaker odds megjelenítése ha van
        if match.bookmaker_odds:
            odds = match.bookmaker_odds
            print(f"   💰 Odds ({odds.get('bookmaker', 'N/A')}): {odds.get('home_odds', 'N/A')} / {odds.get('draw_odds', 'N/A')} / {odds.get('away_odds', 'N/A')}")

        # Csapat adatok lekérdezése
        home_data = await predictor.get_demo_team_history(match.home_team)
        away_data = await predictor.get_demo_team_history(match.away_team)

        # Predikció számítása
        prediction = predictor._calculate_enhanced_prediction(match, home_data, away_data)
        predictions.append(prediction)

        # Eredmény kiírása
        predictor._print_enhanced_prediction(prediction)

    # Fejlett összegzés
    print(f"\n📋 FEJLETT ÖSSZEGZÉS")
    print("=" * 40)
    print(f"🎯 Elemzett meccsek: {len(predictions)}")
    print(f"📊 Átlagos bizalom: {np.mean([p['confidence'] for p in predictions]):.1f}%")

    # Legjobb fogadási lehetőségek
    high_confidence = [p for p in predictions if p['confidence'] > 60]
    if high_confidence:
        print(f"🌟 Nagy bizalmi szintű predikciók: {len(high_confidence)}")

        for pred in high_confidence:
            probs = [
                ('Hazai', pred['prob_home']),
                ('Döntetlen', pred['prob_draw']),
                ('Vendég', pred['prob_away'])
            ]
            best_outcome, best_prob = max(probs, key=lambda x: x[1])

            print(f"\n   ⭐ {pred['home_team']} vs {pred['away_team']}")
            print(f"      🕐 {pred['kickoff_time'].strftime('%H:%M')}")
            print(f"      🎲 Ajánlott: {best_outcome} ({best_prob:.1%})")
            print(f"      🎯 Bizalom: {pred['confidence']:.1f}%")

            # Value betting észrevételek
            if pred['bookmaker_odds']:
                odds = pred['bookmaker_odds']
                if best_outcome == 'Hazai' and odds.get('home_odds', 0) > 1/best_prob:
                    value = (odds['home_odds'] * best_prob - 1) * 100
                    print(f"      💎 VALUE BET! Várható nyereség: +{value:.1f}%")
                elif best_outcome == 'Vendég' and odds.get('away_odds', 0) > 1/best_prob:
                    value = (odds['away_odds'] * best_prob - 1) * 100
                    print(f"      💎 VALUE BET! Várható nyereség: +{value:.1f}%")

    # Meccsenkénti részletes javaslatok
    print(f"\n🎯 RÉSZLETES FOGADÁSI JAVASLATOK")
    print("=" * 45)

    for pred in predictions:
        probs = [
            ('Hazai győzelem', pred['prob_home']),
            ('Döntetlen', pred['prob_draw']),
            ('Vendég győzelem', pred['prob_away'])
        ]

        print(f"\n🏟️ {pred['home_team']} vs {pred['away_team']}")
        print(f"   ⏰ Időpont: {pred['kickoff_time'].strftime('%H:%M')}")
        print(f"   🏆 Bajnokság: {pred['competition']}")

        # Valószínűségek sorrendben
        sorted_probs = sorted(probs, key=lambda x: x[1], reverse=True)

        print(f"   📊 Valószínűségek:")
        for i, (outcome, prob) in enumerate(sorted_probs):
            confidence_icon = "🔥" if prob > 0.5 else "⚡" if prob > 0.4 else "📈"
            print(f"      {i+1}. {outcome}: {prob:.1%} {confidence_icon}")

        # Gólok előrejelzése
        home_goals = pred['expected_goals']['home']
        away_goals = pred['expected_goals']['away']
        total_goals = home_goals + away_goals

        print(f"   ⚽ Gól predikciók:")
        print(f"      Várható végeredmény: {home_goals:.1f} - {away_goals:.1f}")
        print(f"      Összes gól: {total_goals:.1f}")

        if total_goals > 2.5:
            print(f"      🎯 Over 2.5 ajánlott ({total_goals:.1f} várható)")
        else:
            print(f"      🎯 Under 2.5 ajánlott ({total_goals:.1f} várható)")

def main():
    """Fő futtatási függvény"""
    asyncio.run(demo_enhanced_prediction())

if __name__ == "__main__":
    main()

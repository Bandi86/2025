#!/usr/bin/env python3
"""
💼 EGYSZERŰ HÉTVÉGI FOGADÁSI PÉLDA
Egy valós fogadási szituáció bemutatása egy hétvégére.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

try:
    from realistic_betting_system import RealisticBettingSystem
except ImportError:
    print("❌ Hiányzó modulok!")
    exit(1)

def weekend_betting_example():
    """Hétvégi fogadási példa."""
    print("🏆 HÉTVÉGI FOGADÁSI PÉLDA")
    print("=" * 50)
    print("Képzeljük el: Péntek este vagy és megnézed a hétvégi meccseket...")
    print()

    # Rendszer inicializálás
    system = RealisticBettingSystem()

    # Adatok betöltése
    historical_df = system.load_training_data()
    team_stats = system.build_team_models(historical_df)

    # Szimulált hétvégi meccsek (akár fogadóirodából)
    weekend_matches = [
        # Szombat
        ("Arsenal", "Chelsea", 2.20, 3.40, 3.10),  # H, D, A odds
        ("Man City", "Liverpool", 2.80, 3.20, 2.60),
        ("Man United", "Tottenham", 2.45, 3.30, 2.90),
        ("Newcastle", "Brighton", 1.85, 3.60, 4.20),
        ("Everton", "Fulham", 2.60, 3.20, 2.80),

        # Vasárnap
        ("West Ham", "Crystal Palace", 2.30, 3.50, 3.00),
        ("Wolves", "Brentford", 2.70, 3.40, 2.50),
        ("Aston Villa", "Bournemouth", 1.90, 3.80, 3.90),
    ]

    print("📅 SZOMBATI MECCSEK:")
    print("-" * 30)
    saturday_opportunities = []

    for i, (home, away, h_odd, d_odd, a_odd) in enumerate(weekend_matches[:5]):
        print(f"⚽ {home} vs {away}")
        print(f"   Odds: {h_odd:.2f} - {d_odd:.2f} - {a_odd:.2f}")

        # Saját elemzés
        prediction = system.predict_match_probabilities(home, away, team_stats)
        if prediction:
            our_odds = {
                'home': 1 / prediction['prob_home'],
                'draw': 1 / prediction['prob_draw'],
                'away': 1 / prediction['prob_away']
            }

            bookmaker_odds = {'home': h_odd, 'draw': d_odd, 'away': a_odd}

            # Edge számítás
            for outcome, our_odd in our_odds.items():
                bookmaker_odd = bookmaker_odds[outcome]
                edge = (our_odd / bookmaker_odd) - 1
                confidence = prediction['confidence']

                if edge >= 0.05 and confidence >= 0.4:
                    win_prob = 1 / our_odd
                    kelly_fraction = (win_prob * (bookmaker_odd - 1) - (1 - win_prob)) / (bookmaker_odd - 1)
                    kelly_stake = max(0.01, min(0.05, kelly_fraction * 0.5))

                    saturday_opportunities.append({
                        'match': f"{home} vs {away}",
                        'outcome': outcome,
                        'bookmaker_odds': bookmaker_odd,
                        'edge': edge,
                        'confidence': confidence,
                        'kelly_stake': kelly_stake
                    })

                    print(f"   💡 {outcome.upper()}: Edge {edge:.1%}, Stake {kelly_stake:.1%}")

        print()

    print("📅 VASÁRNAPI MECCSEK:")
    print("-" * 30)
    sunday_opportunities = []

    for i, (home, away, h_odd, d_odd, a_odd) in enumerate(weekend_matches[5:]):
        print(f"⚽ {home} vs {away}")
        print(f"   Odds: {h_odd:.2f} - {d_odd:.2f} - {a_odd:.2f}")

        # Saját elemzés
        prediction = system.predict_match_probabilities(home, away, team_stats)
        if prediction:
            our_odds = {
                'home': 1 / prediction['prob_home'],
                'draw': 1 / prediction['prob_draw'],
                'away': 1 / prediction['prob_away']
            }

            bookmaker_odds = {'home': h_odd, 'draw': d_odd, 'away': a_odd}

            # Edge számítás
            for outcome, our_odd in our_odds.items():
                bookmaker_odd = bookmaker_odds[outcome]
                edge = (our_odd / bookmaker_odd) - 1
                confidence = prediction['confidence']

                if edge >= 0.05 and confidence >= 0.4:
                    win_prob = 1 / our_odd
                    kelly_fraction = (win_prob * (bookmaker_odd - 1) - (1 - win_prob)) / (bookmaker_odd - 1)
                    kelly_stake = max(0.01, min(0.05, kelly_fraction * 0.5))

                    sunday_opportunities.append({
                        'match': f"{home} vs {away}",
                        'outcome': outcome,
                        'bookmaker_odds': bookmaker_odd,
                        'edge': edge,
                        'confidence': confidence,
                        'kelly_stake': kelly_stake
                    })

                    print(f"   💡 {outcome.upper()}: Edge {edge:.1%}, Stake {kelly_stake:.1%}")

        print()

    # Összefoglaló és javasolt fogadások
    print("🎯 JAVASOLT FOGADÁSOK")
    print("=" * 50)

    bankroll = 1000
    all_opportunities = saturday_opportunities + sunday_opportunities

    if all_opportunities:
        print("\n📊 EGYEDI FOGADÁSOK:")
        total_stake = 0
        for i, opp in enumerate(all_opportunities[:5], 1):  # Top 5
            stake_amount = opp['kelly_stake'] * bankroll
            total_stake += stake_amount
            print(f"{i}. {opp['match']} - {opp['outcome'].upper()}")
            print(f"   💰 Tét: ${stake_amount:.2f} (odds: {opp['bookmaker_odds']:.2f})")
            print(f"   📈 Edge: {opp['edge']:.1%}, Bizalom: {opp['confidence']:.1%}")
            print()

        # Kombinációs javaslat
        if len(all_opportunities) >= 2:
            print("🎰 KOMBINÁCIÓS JAVASLAT:")
            best_combo = all_opportunities[:3]  # Top 3 kombinációba
            combo_odds = 1.0
            combo_stake_pct = 0

            for opp in best_combo:
                combo_odds *= opp['bookmaker_odds']
                combo_stake_pct += opp['kelly_stake']

            combo_stake_pct = min(0.03, combo_stake_pct / 2)  # Konzervatív kombináció
            combo_stake_amount = combo_stake_pct * bankroll

            print(f"   Meccsek: {', '.join([opp['match'] for opp in best_combo])}")
            print(f"   Kimenetel: {', '.join([opp['outcome'].upper() for opp in best_combo])}")
            print(f"   💰 Tét: ${combo_stake_amount:.2f}")
            print(f"   🎲 Össz odds: {combo_odds:.2f}")
            print(f"   💵 Potenciális nyeremény: ${combo_stake_amount * combo_odds:.2f}")
            print()

        print(f"💰 Összes egyedi tét: ${total_stake:.2f}")
        if len(all_opportunities) >= 2:
            print(f"💰 Kombinációs tét: ${combo_stake_amount:.2f}")
            print(f"💰 TELJES HÉTVÉGI KOCKÁZAT: ${total_stake + combo_stake_amount:.2f} ({((total_stake + combo_stake_amount)/bankroll)*100:.1f}% a bankrollból)")
        else:
            print(f"💰 TELJES HÉTVÉGI KOCKÁZAT: ${total_stake:.2f} ({(total_stake/bankroll)*100:.1f}% a bankrollból)")

    else:
        print("❌ Nem találtunk megfelelő fogadási lehetőséget erre a hétvégére.")
        print("✅ Jobb kivárni a következő hétvégét!")

    print("\n🔍 FONTOS MEGJEGYZÉSEK:")
    print("• Mindig csak annyit fogadj, amennyit megengedhetsz magadnak elveszíteni")
    print("• Ez egy matematikai modell, nem garantál nyereséget")
    print("• A valós fogadásnál figyelj a csapat hírekre, sérülésekre")
    print("• Használj több fogadóirodát a legjobb odds-okért")

def main():
    """Fő futtatási függvény."""
    weekend_betting_example()

if __name__ == "__main__":
    main()

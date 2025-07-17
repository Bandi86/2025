#!/usr/bin/env python3
"""
🌅 NAPI FOGADÁSI ASSZISZTENS
Minden reggel automatikusan elemzi az aznapi meccseket és ad javaslatokat.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

try:
    from realistic_betting_system import RealisticBettingSystem
    from data_loader import load_data
except ImportError:
    print("❌ Hiányzó modulok!")
    exit(1)

class DailyBettingAssistant:
    """Napi fogadási asszisztens."""

    def __init__(self):
        self.system = RealisticBettingSystem()
        self.bankroll = 1000.0
        self.max_daily_risk = 0.08  # Max 8% naponta

        # Minőségi szűrők
        self.min_edge = 0.05
        self.min_confidence = 0.4

    def load_data_and_models(self):
        """Adatok betöltése és modellek építése."""
        print("📚 Múltbeli adatok elemzése...")
        self.historical_df = self.system.load_training_data()
        self.team_stats = self.system.build_team_models(self.historical_df)
        print("✅ Modellek készen állnak!\n")

    def get_todays_matches(self):
        """Mai meccsek lekérése (szimulált)."""
        # Itt valós API-ból jönnének az adatok
        # Most szimuláljunk egy tipikus angol napi fordulót

        today = datetime.now()
        weekday = today.weekday()  # 0=Hétfő, 6=Vasárnap

        if weekday == 5:  # Szombat - nagy forduló
            matches = [
                ("Arsenal", "Chelsea", 2.25, 3.40, 3.20),
                ("Man City", "Liverpool", 2.70, 3.30, 2.65),
                ("Man United", "Tottenham", 2.40, 3.25, 2.95),
                ("Newcastle", "Brighton", 1.90, 3.50, 4.10),
                ("Everton", "Fulham", 2.55, 3.15, 2.85),
                ("West Ham", "Crystal Palace", 2.35, 3.45, 3.05),
            ]
        elif weekday == 6:  # Vasárnap - kisebb forduló
            matches = [
                ("Wolves", "Brentford", 2.60, 3.35, 2.70),
                ("Aston Villa", "Bournemouth", 1.85, 3.70, 4.20),
                ("Leicester", "Southampton", 2.20, 3.30, 3.30),
            ]
        elif weekday in [1, 2]:  # Kedd, Szerda - hét közepi meccsek
            matches = [
                ("Liverpool", "Nott'm Forest", 1.45, 4.50, 7.50),
                ("Chelsea", "Everton", 1.70, 3.80, 5.00),
            ]
        elif weekday == 3:  # Csütörtök - Európai kupák
            matches = [
                ("Arsenal", "Bayern Munich", 3.20, 3.60, 2.10),
                ("Man City", "Real Madrid", 2.80, 3.40, 2.50),
            ]
        else:  # Más napok - kevés vagy semmi
            matches = []

        return matches, weekday

    def analyze_todays_opportunities(self):
        """Mai fogadási lehetőségek elemzése."""
        matches, weekday = self.get_todays_matches()

        day_names = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"]
        today_name = day_names[weekday]

        print(f"📅 {today_name.upper()} - MAI MECCSEK ELEMZÉSE")
        print("=" * 50)

        if not matches:
            print("❌ Ma nincsenek meccsek.")
            print("✅ Pihenőnap - készülj fel a hétvégére! 💪")
            return

        print(f"⚽ {len(matches)} mérkőzés ma:")
        for home, away, h_odd, d_odd, a_odd in matches:
            print(f"   {home} vs {away} ({h_odd:.2f} - {d_odd:.2f} - {a_odd:.2f})")
        print()

        # Elemzés minden meccsre
        opportunities = []

        for home, away, h_odd, d_odd, a_odd in matches:
            print(f"🔍 {home} vs {away}")

            # Saját predikció
            prediction = self.system.predict_match_probabilities(home, away, self.team_stats)
            if not prediction:
                print("   ❌ Nincs elég adat az elemzéshez")
                continue

            # Odds elemzés
            our_odds = {
                'home': 1 / prediction['prob_home'],
                'draw': 1 / prediction['prob_draw'],
                'away': 1 / prediction['prob_away']
            }

            bookmaker_odds = {'home': h_odd, 'draw': d_odd, 'away': a_odd}

            print(f"   📊 Saját becslés: {our_odds['home']:.2f} - {our_odds['draw']:.2f} - {our_odds['away']:.2f}")
            print(f"   🏪 Fogadóiroda:   {h_odd:.2f} - {d_odd:.2f} - {a_odd:.2f}")

            # Value bet keresés
            match_opportunities = []
            for outcome, our_odd in our_odds.items():
                bookmaker_odd = bookmaker_odds[outcome]
                edge = (our_odd / bookmaker_odd) - 1
                confidence = prediction['confidence']

                if edge >= self.min_edge and confidence >= self.min_confidence:
                    # Kelly stake
                    win_prob = 1 / our_odd
                    kelly_fraction = (win_prob * (bookmaker_odd - 1) - (1 - win_prob)) / (bookmaker_odd - 1)
                    kelly_stake = max(0.005, min(0.04, kelly_fraction * 0.5))

                    opportunity = {
                        'match': f"{home} vs {away}",
                        'outcome': outcome,
                        'bookmaker_odds': bookmaker_odd,
                        'edge': edge,
                        'confidence': confidence,
                        'kelly_stake': kelly_stake,
                        'expected_profit': kelly_stake * self.bankroll * edge
                    }

                    match_opportunities.append(opportunity)
                    opportunities.append(opportunity)

                    outcome_hu = {'home': 'HAZAI', 'draw': 'DÖNTETLEN', 'away': 'VENDÉG'}[outcome]
                    print(f"   ✅ {outcome_hu}: Edge {edge:.1%}, Bizalom {confidence:.1%}")

            if not match_opportunities:
                print("   ❌ Nincs value bet")

            print()

        # Javaslatok összegzése
        self.summarize_daily_recommendations(opportunities, today_name)

    def summarize_daily_recommendations(self, opportunities, day_name):
        """Napi javaslatok összegzése."""
        if not opportunities:
            print("🎯 MAI ÖSSZEGZÉS")
            print("=" * 30)
            print("❌ Ma nincs megfelelő fogadási lehetőség")
            print("💡 Javaslatom: Várj holnapra vagy a hétvégére!")
            print("💰 Bankroll biztonságban: $1000.00")
            return

        # Rendezés edge szerint
        opportunities.sort(key=lambda x: x['edge'], reverse=True)

        print("🎯 MAI FOGADÁSI JAVASLATOK")
        print("=" * 40)

        # Top lehetőségek
        total_stake = 0
        recommended_bets = []

        print("📊 EGYEDI FOGADÁSOK (Top 3):")
        for i, opp in enumerate(opportunities[:3], 1):
            stake_amount = opp['kelly_stake'] * self.bankroll
            total_stake += stake_amount
            recommended_bets.append(opp)

            outcome_hu = {'home': 'HAZAI győzelem', 'draw': 'DÖNTETLEN', 'away': 'VENDÉG győzelem'}[opp['outcome']]
            print(f"{i}. {opp['match']}")
            print(f"   🎯 Tipp: {outcome_hu}")
            print(f"   💰 Javasolt tét: ${stake_amount:.2f}")
            print(f"   🎲 Odds: {opp['bookmaker_odds']:.2f}")
            print(f"   📈 Edge: {opp['edge']:.1%} | Bizalom: {opp['confidence']:.1%}")
            print(f"   💵 Várható profit: ${opp['expected_profit']:.2f}")
            print()

        # Kombináció ha van elég jó lehetőség
        if len(opportunities) >= 2:
            print("🎰 KOMBINÁCIÓS JAVASLAT:")
            best_combo = opportunities[:2]  # Top 2

            combo_odds = 1.0
            combo_stake_pct = 0
            combo_matches = []

            for opp in best_combo:
                combo_odds *= opp['bookmaker_odds']
                combo_stake_pct += opp['kelly_stake']
                outcome_hu = {'home': 'H', 'draw': 'D', 'away': 'V'}[opp['outcome']]
                combo_matches.append(f"{opp['match']} ({outcome_hu})")

            combo_stake_pct = min(0.025, combo_stake_pct / 3)  # Konzervatív
            combo_stake_amount = combo_stake_pct * self.bankroll
            potential_win = combo_stake_amount * combo_odds

            print(f"   🎯 Kombinált tippek:")
            for match in combo_matches:
                print(f"      • {match}")
            print(f"   💰 Javasolt tét: ${combo_stake_amount:.2f}")
            print(f"   🎲 Össz odds: {combo_odds:.2f}")
            print(f"   💵 Potenciális nyeremény: ${potential_win:.2f}")
            print()

            total_stake += combo_stake_amount

        # Napi összegzés
        risk_pct = (total_stake / self.bankroll) * 100

        print("💼 NAPI ÖSSZESÍTÉS:")
        print(f"   💰 Összes javasolt tét: ${total_stake:.2f}")
        print(f"   📊 Bankroll kockázat: {risk_pct:.1f}% (max {self.max_daily_risk*100:.0f}%)")

        if risk_pct <= self.max_daily_risk * 100:
            print("   ✅ Alacsony kockázat - MEHET!")
        elif risk_pct <= 12:
            print("   ⚠️ Közepes kockázat - Megfontolva!")
        else:
            print("   ❌ Magas kockázat - Csökkentsd a téteket!")

        print(f"   🏦 Bankroll utána: ${self.bankroll - total_stake:.2f}")

        # Napi tanácsok
        print("\n💡 MAI TANÁCSOK:")
        if day_name in ["Szombat", "Vasárnap"]:
            print("   🏟️ Hétvégi nagy forduló - több lehetőség!")
            print("   📺 Nézd meg a mérkőzéseket élőben")
            print("   🔄 Figyelj a live odds változásokra")
        elif day_name in ["Kedd", "Szerda"]:
            print("   ⚽ Hét közepi meccsek - kevesebb lehetőség")
            print("   🎯 Koncentrálj a legjobb value betekre")
            print("   💰 Konzervatívabb bankroll management")
        else:
            print("   📅 Átlagos nap - standard stratégia")

        print("   🚫 Soha ne fogadj érzelmekből!")
        print("   📱 Használj odds összehasonlító oldalakat")
        print("   📊 Kövessed a profitod hosszú távon")

    def run_daily_analysis(self):
        """Napi elemzés futtatása."""
        now = datetime.now()
        print(f"🌅 NAPI FOGADÁSI ASSZISZTENS")
        print(f"📅 {now.strftime('%Y.%m.%d')} - {now.strftime('%A')}")
        print(f"⏰ {now.strftime('%H:%M')}")
        print("=" * 60)

        try:
            # Adatok betöltése
            self.load_data_and_models()

            # Mai elemzés
            self.analyze_todays_opportunities()

            print("\n" + "=" * 60)
            print("✅ Elemzés befejezve! Sikeres fogadást! 🍀")
            print("📞 Probléma esetén: ellenőrizd a team_stats adatokat")

        except Exception as e:
            print(f"❌ Hiba történt: {e}")
            print("🔧 Ellenőrizd az adatfájlokat és próbáld újra!")

def main():
    """Fő futtatási függvény."""
    assistant = DailyBettingAssistant()
    assistant.run_daily_analysis()

if __name__ == "__main__":
    main()

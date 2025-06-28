"""
Kombinált fogadási szimulátor és elemző
Megmutatja a kombinált szelvények potenciális profitját
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime

class CombinationSimulator:
    """Kombinált fogadások szimulációja és elemzése."""

    def __init__(self, initial_bankroll=100):
        self.initial_bankroll = initial_bankroll

    def simulate_combination_betting(self, combinations, stake_per_combo=1.0, max_combos=50):
        """Kombinált fogadások szimulációja."""

        results = []
        bankroll = self.initial_bankroll
        total_stake = 0
        total_winnings = 0

        print(f"\n🎰 KOMBINÁLT FOGADÁSOK SZIMULÁCIÓJA")
        print("=" * 50)
        print(f"Kezdő bankroll: {self.initial_bankroll}")
        print(f"Tét/kombináció: {stake_per_combo}")
        print(f"Szimulálandó kombinációk: {min(len(combinations), max_combos)}")

        for i, combo in enumerate(combinations[:max_combos]):
            if bankroll < stake_per_combo:
                print(f"⚠️ Nincs elég pénz a {i+1}. kombinációhoz")
                break

            stake = stake_per_combo
            total_stake += stake
            bankroll -= stake

            if combo['all_correct']:
                # Nyerő kombináció
                winnings = stake * combo['combined_odds']
                profit = winnings - stake
                bankroll += winnings
                total_winnings += winnings

                results.append({
                    'combo_id': i+1,
                    'combo_size': combo['combo_size'],
                    'stake': stake,
                    'odds': combo['combined_odds'],
                    'probability': combo['combined_probability'],
                    'won': True,
                    'winnings': winnings,
                    'profit': profit,
                    'bankroll': bankroll
                })
            else:
                # Vesztő kombináció
                results.append({
                    'combo_id': i+1,
                    'combo_size': combo['combo_size'],
                    'stake': stake,
                    'odds': combo['combined_odds'],
                    'probability': combo['combined_probability'],
                    'won': False,
                    'winnings': 0,
                    'profit': -stake,
                    'bankroll': bankroll
                })

        # Eredmények összesítése
        total_profit = bankroll - self.initial_bankroll
        roi = (total_profit / total_stake * 100) if total_stake > 0 else 0
        win_rate = sum(1 for r in results if r['won']) / len(results) * 100 if results else 0

        print(f"\n📊 SZIMULÁCIÓ EREDMÉNYEI:")
        print(f"   Kombinációk száma: {len(results)}")
        print(f"   Összes tét: {total_stake:.2f}")
        print(f"   Összes nyeremény: {total_winnings:.2f}")
        print(f"   Nettó profit: {total_profit:.2f}")
        print(f"   ROI: {roi:.2f}%")
        print(f"   Win rate: {win_rate:.1f}%")
        print(f"   Végső bankroll: {bankroll:.2f}")

        if roi > 0:
            print("   ✅ Profitábilis kombinált stratégia!")
        else:
            print("   ❌ Veszteséges kombinált stratégia")

        return results, {
            'total_profit': total_profit,
            'roi': roi,
            'win_rate': win_rate,
            'final_bankroll': bankroll,
            'combinations_tested': len(results)
        }

    def analyze_combination_patterns(self, combinations):
        """Kombinációs minták elemzése."""

        print(f"\n🔍 KOMBINÁCIÓS MINTÁK ELEMZÉSE")
        print("=" * 50)

        # Méret szerinti bontás
        size_analysis = {}
        for combo in combinations:
            size = combo['combo_size']
            if size not in size_analysis:
                size_analysis[size] = {
                    'total': 0,
                    'successful': 0,
                    'total_odds': 0,
                    'total_prob': 0
                }

            size_analysis[size]['total'] += 1
            if combo['all_correct']:
                size_analysis[size]['successful'] += 1
            size_analysis[size]['total_odds'] += combo['combined_odds']
            size_analysis[size]['total_prob'] += combo['combined_probability']

        print("📈 Méret szerinti elemzés:")
        for size, data in sorted(size_analysis.items()):
            success_rate = (data['successful'] / data['total']) * 100
            avg_odds = data['total_odds'] / data['total']
            avg_prob = data['total_prob'] / data['total']

            print(f"   {size} meccs: {data['successful']}/{data['total']} sikeres ({success_rate:.1f}%)")
            print(f"            Átlag odds: {avg_odds:.2f}, Átlag prob: {avg_prob:.3f}")

        # Top sikeres kombinációk
        successful_combos = [c for c in combinations if c['all_correct']]
        if successful_combos:
            print(f"\n🏆 TOP 5 SIKERES KOMBINÁCIÓ:")
            successful_combos.sort(key=lambda x: x['combined_odds'], reverse=True)

            for i, combo in enumerate(successful_combos[:5], 1):
                print(f"   {i}. {combo['combo_size']} meccs, odds: {combo['combined_odds']:.2f}, "
                      f"prob: {combo['combined_probability']:.3f}")

        return size_analysis

    def kelly_combination_strategy(self, combinations, max_kelly_fraction=0.02):
        """Kelly kritérium alkalmazása kombinációkra."""

        print(f"\n💰 KELLY KOMBINÁCIÓ STRATÉGIA")
        print("=" * 50)

        bankroll = self.initial_bankroll
        results = []

        for i, combo in enumerate(combinations):
            # Kelly számítás kombinációra
            prob = combo['combined_probability']
            odds = combo['combined_odds']

            if prob > 0 and odds > 1:
                kelly_frac = (prob * (odds - 1) - (1 - prob)) / (odds - 1)
                kelly_frac = max(0, min(kelly_frac, max_kelly_fraction))  # Konzervatív limit

                # Csak pozitív Kelly érték esetén
                if kelly_frac > 0.001:  # Min 0.1%
                    stake = bankroll * kelly_frac

                    if combo['all_correct']:
                        profit = (odds - 1) * stake
                        bankroll += profit
                    else:
                        profit = -stake
                        bankroll += profit

                    results.append({
                        'combo_id': i+1,
                        'combo_size': combo['combo_size'],
                        'kelly_fraction': kelly_frac,
                        'stake': stake,
                        'odds': odds,
                        'probability': prob,
                        'won': combo['all_correct'],
                        'profit': profit,
                        'bankroll': bankroll
                    })

        if results:
            total_profit = bankroll - self.initial_bankroll
            roi = (total_profit / self.initial_bankroll) * 100
            win_rate = sum(1 for r in results if r['won']) / len(results) * 100

            print(f"   Kelly kombinációk: {len(results)}")
            print(f"   Nettó profit: {total_profit:.2f}")
            print(f"   ROI: {roi:.2f}%")
            print(f"   Win rate: {win_rate:.1f}%")
            print(f"   Végső bankroll: {bankroll:.2f}")

            return results, roi
        else:
            print("   Nincs pozitív Kelly értékű kombináció")
            return [], 0

    def monthly_combo_analysis(self, combinations, target_monthly_profit=50):
        """Havi kombinációs elemzés."""

        print(f"\n📅 HAVI KOMBINÁCIÓS ELEMZÉS")
        print("=" * 50)
        print(f"Cél havi profit: {target_monthly_profit}")

        # Feltételezzük, hogy havonta ~76 mérkőzés van (38 forduló/év)
        monthly_games = 76
        successful_combos = [c for c in combinations if c['all_correct']]

        if not successful_combos:
            print("   Nincs sikeres kombináció az elemzéshez")
            return

        # Különböző tét stratégiák szimulációja
        strategies = [
            {'name': 'Konzervatív', 'stake_per_combo': 1.0, 'max_combos_per_month': 20},
            {'name': 'Mérsékelt', 'stake_per_combo': 2.0, 'max_combos_per_month': 15},
            {'name': 'Agresszív', 'stake_per_combo': 5.0, 'max_combos_per_month': 10},
        ]

        for strategy in strategies:
            print(f"\n   📊 {strategy['name']} stratégia:")

            # Sikeres kombinációk arányának becslése
            success_rate = len(successful_combos) / len(combinations)
            monthly_successful = int(strategy['max_combos_per_month'] * success_rate)

            if monthly_successful > 0:
                # Átlag nyeremény számítása
                avg_odds = np.mean([c['combined_odds'] for c in successful_combos[:monthly_successful]])
                monthly_profit = (monthly_successful * strategy['stake_per_combo'] *
                                (avg_odds - 1)) - (strategy['max_combos_per_month'] - monthly_successful) * strategy['stake_per_combo']

                monthly_roi = (monthly_profit / (strategy['max_combos_per_month'] * strategy['stake_per_combo'])) * 100

                print(f"     Kombináció/hó: {strategy['max_combos_per_month']}")
                print(f"     Sikeres/hó: {monthly_successful}")
                print(f"     Tét/kombináció: {strategy['stake_per_combo']}")
                print(f"     Havi profit: {monthly_profit:.2f}")
                print(f"     Havi ROI: {monthly_roi:.1f}%")

                if monthly_profit >= target_monthly_profit:
                    print("     ✅ Eléri a profit célt!")
                else:
                    print("     ❌ Nem éri el a profit célt")

def load_and_analyze_combinations():
    """Kombinációk betöltése és elemzése."""

    try:
        with open('improved_strategy_combinations.json', 'r') as f:
            combinations_data = json.load(f)

        print(f"📁 Betöltve: {len(combinations_data)} kombináció")

        simulator = CombinationSimulator()

        # Visszakonvertálás a teljes formátumba (demo célra)
        combinations = []
        for i, data in enumerate(combinations_data):
            combinations.append({
                'combo_size': data['combo_size'],
                'combined_odds': data['combined_odds'],
                'combined_probability': data['combined_probability'],
                'expected_value': data['expected_value'],
                'all_correct': data.get('all_correct', i < len(combinations_data) * 0.1),  # 10% sikeres demo
                'min_confidence': data['min_confidence']
            })

        # Elemzések futtatása
        simulator.analyze_combination_patterns(combinations)
        simulator.simulate_combination_betting(combinations, stake_per_combo=2.0, max_combos=30)
        simulator.kelly_combination_strategy(combinations)
        simulator.monthly_combo_analysis(combinations)

    except FileNotFoundError:
        print("❌ Nincs 'improved_strategy_combinations.json' fájl")
        print("   Futtasd előbb az improved_main.py-t!")

if __name__ == "__main__":
    load_and_analyze_combinations()

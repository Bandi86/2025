#!/usr/bin/env python3
"""
🎰 KOMBINÁLT FOGADÁSI STRATÉGIA
Több mérkőzést kombináló fogadások optimalizálása.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import itertools
import warnings
warnings.filterwarnings('ignore')

try:
    from expanded_strategies import MultiMarketStrategy, run_expanded_strategy_analysis
    from data_loader import load_data
except ImportError:
    print("❌ Hiányzó modulok!")
    exit(1)

class CombinationBettingEngine:
    """Kombinált fogadások motja."""

    def __init__(self):
        self.max_combo_size = 3  # Maximum 3 mérkőzés kombinációban
        self.min_total_odds = 2.0  # Minimum kombinált odds
        self.max_total_odds = 15.0  # Maximum kombinált odds
        self.min_individual_confidence = 0.8  # Minimum egyedi confidence
        self.min_avg_edge = 0.08  # Minimum átlag edge

    def find_same_day_opportunities(self, opportunities_df):
        """Megkeresi az egy napon belüli lehetőségeket."""
        if len(opportunities_df) == 0:
            return {}

        # Nap szerinti csoportosítás
        opportunities_df['date_only'] = opportunities_df['Date'].dt.date
        daily_groups = opportunities_df.groupby('date_only')

        same_day_opps = {}
        for date, group in daily_groups:
            if len(group) >= 2:  # Legalább 2 lehetőség
                same_day_opps[date] = group.reset_index(drop=True)

        return same_day_opps

    def generate_combinations(self, daily_opportunities):
        """Kombináció generálás egy napra."""
        combinations = []
        n_opps = len(daily_opportunities)

        # 2-es és 3-as kombinációk
        for combo_size in range(2, min(self.max_combo_size + 1, n_opps + 1)):
            for combo_indices in itertools.combinations(range(n_opps), combo_size):
                combo_opps = daily_opportunities.iloc[list(combo_indices)]

                # Előszűrés
                if self.is_valid_combination(combo_opps):
                    combo_data = self.calculate_combination_metrics(combo_opps)
                    if combo_data:
                        combinations.append(combo_data)

        return combinations

    def is_valid_combination(self, combo_opps):
        """Ellenőrzi hogy érvényes-e a kombináció."""
        # Minden fogadás magas confidence
        if (combo_opps['confidence'] < self.min_individual_confidence).any():
            return False

        # Nincs két ugyanolyan mérkőzés
        matches = combo_opps['HomeTeam'] + ' vs ' + combo_opps['AwayTeam']
        if len(matches) != len(matches.unique()):
            return False

        # Kombinált odds tartományon belül
        total_odds = combo_opps['odds'].prod()
        if total_odds < self.min_total_odds or total_odds > self.max_total_odds:
            return False

        # Átlag edge elég nagy
        avg_edge = combo_opps['edge'].mean()
        if avg_edge < self.min_avg_edge:
            return False

        return True

    def calculate_combination_metrics(self, combo_opps):
        """Kombináció metrikáinak számítása."""
        try:
            # Alap adatok
            total_odds = combo_opps['odds'].prod()
            avg_edge = combo_opps['edge'].mean()
            min_confidence = combo_opps['confidence'].min()
            avg_confidence = combo_opps['confidence'].mean()

            # Kombinált valószínűség (feltételezve független események)
            combined_prob = combo_opps['our_prob'].prod()

            # Kelly kritérium számítás
            fair_odds = 1 / combined_prob
            edge = combined_prob - (1 / total_odds)

            if edge <= 0:
                return None

            kelly_fraction = edge / (total_odds - 1)
            conservative_kelly = kelly_fraction * 0.25  # 25% Kelly

            # Kockázat pontszám (minél magasabb annál kockázatosabb)
            risk_score = (
                (combo_opps['odds'].max() / combo_opps['odds'].min()) +  # Odds szórás
                (len(combo_opps) - 1) * 0.5 +  # Kombináció méret
                (1 - min_confidence) * 5  # Confidence deficit
            )

            # Minőségi pontszám
            quality_score = (
                avg_edge * 40 +  # Edge súly
                avg_confidence * 30 +  # Confidence súly
                min(conservative_kelly * 100, 10) * 20 +  # Kelly súly
                max(0, 10 - risk_score) * 10  # Alacsony kockázat bónusz
            )

            return {
                'date': combo_opps['Date'].iloc[0].date(),
                'matches': [f"{row['HomeTeam']} vs {row['AwayTeam']}" for _, row in combo_opps.iterrows()],
                'markets': [f"{row['market']}-{row['selection']}" for _, row in combo_opps.iterrows()],
                'individual_odds': combo_opps['odds'].tolist(),
                'total_odds': total_odds,
                'individual_edges': combo_opps['edge'].tolist(),
                'avg_edge': avg_edge,
                'individual_confidences': combo_opps['confidence'].tolist(),
                'avg_confidence': avg_confidence,
                'min_confidence': min_confidence,
                'combined_prob': combined_prob,
                'edge': edge,
                'kelly_fraction': conservative_kelly,
                'risk_score': risk_score,
                'quality_score': quality_score,
                'combo_size': len(combo_opps)
            }

        except Exception:
            return None

    def find_best_combinations(self, opportunities_df, max_combinations=50):
        """Megkeresi a legjobb kombinációkat."""
        print("🎰 Kombinált fogadások keresése...")

        # Egy napos lehetőségek
        daily_opps = self.find_same_day_opportunities(opportunities_df)
        print(f"📅 Talált napok: {len(daily_opps)}")

        all_combinations = []

        for date, opps in daily_opps.items():
            daily_combos = self.generate_combinations(opps)
            all_combinations.extend(daily_combos)

        if not all_combinations:
            print("❌ Nincs érvényes kombináció!")
            return []

        # Rendezés minőség szerint
        all_combinations.sort(key=lambda x: x['quality_score'], reverse=True)

        print(f"🎯 Talált kombinációk: {len(all_combinations)}")

        return all_combinations[:max_combinations]

def simulate_combination_performance(combinations, num_simulations=1000):
    """Kombináció teljesítmény szimuláció."""
    if not combinations:
        return {}

    print(f"🎲 Kombináció szimuláció futtatása ({num_simulations} futtatás)...")

    # Top 20 kombináció szimuláció
    top_combinations = combinations[:20]
    simulation_results = []

    for combo in top_combinations:
        wins = 0
        total_profit = 0

        for _ in range(num_simulations):
            # Minden egyedi fogadás kimenetele
            individual_wins = []
            for prob in combo['combined_prob']:  # Ezt javítani kell
                individual_wins.append(np.random.random() < prob)

            # Ha minden nyer, kombináció nyer
            if all(individual_wins):
                wins += 1
                # 1 egység tét esetén
                total_profit += combo['total_odds'] - 1
            else:
                total_profit -= 1  # Veszteség

        win_rate = wins / num_simulations
        avg_profit = total_profit / num_simulations
        roi = avg_profit  # 1 egység tét esetén

        simulation_results.append({
            'combo': combo,
            'win_rate': win_rate,
            'avg_profit': avg_profit,
            'roi': roi,
            'profitable': avg_profit > 0
        })

    # Eredmények rendezése ROI szerint
    simulation_results.sort(key=lambda x: x['roi'], reverse=True)

    return simulation_results

def display_combination_results(combinations, simulation_results=None):
    """Kombináció eredmények megjelenítése."""
    if not combinations:
        print("❌ Nincs kombináció!")
        return

    print(f"\n🏆 TOP KOMBINÁLT FOGADÁSI LEHETŐSÉGEK")
    print("=" * 100)

    for idx, combo in enumerate(combinations[:15], 1):
        print(f"\n{idx}. 🎰 {combo['combo_size']}-es kombináció")
        print(f"   📅 Dátum: {combo['date']}")

        # Mérkőzések
        for i, match in enumerate(combo['matches']):
            market = combo['markets'][i]
            odds = combo['individual_odds'][i]
            edge = combo['individual_edges'][i]
            conf = combo['individual_confidences'][i]
            print(f"      {i+1}. {match} - {market} @ {odds:.2f} (edge: {edge*100:.1f}%, conf: {conf*100:.1f}%)")

        print(f"   🎲 Kombinált odds: {combo['total_odds']:.2f}")
        print(f"   📈 Átlag edge: {combo['avg_edge']*100:.1f}%")
        print(f"   🎯 Min confidence: {combo['min_confidence']*100:.1f}%")
        print(f"   ⭐ Minőségi pontszám: {combo['quality_score']:.1f}")
        print(f"   ⚠️ Kockázat pontszám: {combo['risk_score']:.1f}")
        print(f"   💰 Javasolt tét: {10 * combo['kelly_fraction']:.1f} (1000 bankroll alapján)")

        # Szimuláció eredmény ha van
        if simulation_results:
            sim_result = next((r for r in simulation_results if r['combo'] == combo), None)
            if sim_result:
                print(f"   🎲 Szimuláció: {sim_result['win_rate']*100:.1f}% nyerés, {sim_result['roi']*100:.1f}% ROI")

def main():
    """Főprogram."""
    print("🎰 KOMBINÁLT FOGADÁSI STRATÉGIA")
    print("=" * 60)
    print(f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    try:
        # Adatok betöltése
        from data_loader import load_data
        seasons = ['pl2223.csv', 'pl2324.csv', 'pl2425.csv']
        all_data = []

        for season in seasons:
            try:
                df_season = load_data(season)
                all_data.append(df_season)
            except FileNotFoundError:
                continue

        df = pd.concat(all_data, ignore_index=True)

        # Lehetőségek keresése
        opportunities, _ = run_expanded_strategy_analysis(df)
        opportunities_df = pd.DataFrame(opportunities)

        # Minőségi szűrés
        quality_filter = (
            (opportunities_df['edge'] >= 0.05) &
            (opportunities_df['confidence'] >= 0.8) &
            (opportunities_df['odds'] >= 1.3) &
            (opportunities_df['odds'] <= 8.0)
        )
        filtered_opps = opportunities_df[quality_filter].copy()

        print(f"✨ Minőségi lehetőségek: {len(filtered_opps)}")

        # Kombinációk keresése
        engine = CombinationBettingEngine()
        combinations = engine.find_best_combinations(filtered_opps)

        if not combinations:
            print("❌ Nincs megfelelő kombináció!")
            return

        # Szimuláció (kisebb minta miatt)
        # simulation_results = simulate_combination_performance(combinations, num_simulations=100)

        # Eredmények megjelenítése
        display_combination_results(combinations)

        # Statisztikák
        if combinations:
            avg_odds = np.mean([c['total_odds'] for c in combinations])
            avg_edge = np.mean([c['avg_edge'] for c in combinations])
            avg_risk = np.mean([c['risk_score'] for c in combinations])

            print(f"\n📊 KOMBINÁCIÓK STATISZTIKÁI")
            print("=" * 40)
            print(f"🎯 Talált kombinációk: {len(combinations)}")
            print(f"🎲 Átlag kombinált odds: {avg_odds:.2f}")
            print(f"📈 Átlag edge: {avg_edge*100:.1f}%")
            print(f"⚠️ Átlag kockázat: {avg_risk:.1f}")

            # Méret szerinti bontás
            size_counts = {}
            for combo in combinations:
                size = combo['combo_size']
                size_counts[size] = size_counts.get(size, 0) + 1

            print(f"\n📊 Méret szerinti megoszlás:")
            for size, count in sorted(size_counts.items()):
                print(f"  {size}-es: {count} db")

        # CSV mentés
        if combinations:
            combo_data = []
            for combo in combinations:
                combo_data.append({
                    'date': combo['date'],
                    'combo_size': combo['combo_size'],
                    'matches': ' | '.join(combo['matches']),
                    'markets': ' | '.join(combo['markets']),
                    'total_odds': combo['total_odds'],
                    'avg_edge': combo['avg_edge'],
                    'min_confidence': combo['min_confidence'],
                    'quality_score': combo['quality_score'],
                    'risk_score': combo['risk_score']
                })

            combo_df = pd.DataFrame(combo_data)
            filename = f"combination_bets_{datetime.now().strftime('%Y%m%d')}.csv"
            combo_df.to_csv(filename, index=False)
            print(f"\n💾 Kombinációk mentve: {filename}")

    except Exception as e:
        print(f"❌ Hiba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

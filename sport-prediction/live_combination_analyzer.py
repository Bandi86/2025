#!/usr/bin/env python3
"""
🎰 VALÓS IDEJŰ KOMBINÁLT FOGADÁSI ELEMZŐ
Jövőbeli mérkőzések kombinációinak keresése és elemzése.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import itertools
import warnings
warnings.filterwarnings('ignore')

try:
    from prediction_engine import MatchPredictor, BettingOpportunityFinder
    from data_loader import load_data
except ImportError:
    print("❌ Hiányzó modulok!")
    exit(1)

class LiveCombinationAnalyzer:
    """Valós idejű kombinációs elemző."""

    def __init__(self, predictor):
        self.predictor = predictor
        self.opportunity_finder = BettingOpportunityFinder(predictor)

        # Kombinációs paraméterek
        self.max_combo_size = 3
        self.min_total_odds = 2.0
        self.max_total_odds = 20.0
        self.min_individual_confidence = 0.7
        self.min_individual_edge = 0.05

    def analyze_weekend_combinations(self, fixtures):
        """Hétvégi mérkőzések kombinációs elemzése."""
        print("🎰 Kombinációs lehetőségek elemzése...")

        # Minden mérkőzés elemzése
        match_opportunities = []

        for home_team, away_team, odds_h, odds_d, odds_a in fixtures:
            analysis = self.opportunity_finder.analyze_betting_opportunity(
                home_team, away_team, odds_h, odds_d, odds_a
            )

            if analysis and analysis['opportunities']:
                for opp in analysis['opportunities']:
                    if (opp['edge'] >= self.min_individual_edge and
                        opp['confidence'] >= self.min_individual_confidence):

                        match_opportunities.append({
                            'match': analysis['match'],
                            'home_team': home_team,
                            'away_team': away_team,
                            **opp
                        })

        print(f"✅ {len(match_opportunities)} minőségi lehetőség található")

        if len(match_opportunities) < 2:
            print("❌ Nem elég lehetőség a kombinációkhoz")
            return []

        # Kombinációk generálása
        combinations = []

        for combo_size in range(2, min(self.max_combo_size + 1, len(match_opportunities) + 1)):
            for combo_opps in itertools.combinations(match_opportunities, combo_size):
                combo_data = self._analyze_combination(combo_opps)
                if combo_data:
                    combinations.append(combo_data)

        # Rendezés minőség szerint
        combinations.sort(key=lambda x: x['quality_score'], reverse=True)

        return combinations

    def _analyze_combination(self, combo_opps):
        """Egy kombináció elemzése."""
        # Alapvető szűrések
        if not self._is_valid_combination(combo_opps):
            return None

        # Metrikák számítása
        total_odds = 1.0
        combined_prob = 1.0
        total_edge = 0
        min_confidence = 1.0
        avg_confidence = 0

        match_details = []

        for opp in combo_opps:
            total_odds *= opp['odds']
            combined_prob *= opp['our_prob']
            total_edge += opp['edge']
            min_confidence = min(min_confidence, opp['confidence'])
            avg_confidence += opp['confidence']

            match_details.append({
                'match': opp['match'],
                'market': f"{opp['market']}-{opp['selection']}",
                'odds': opp['odds'],
                'edge': opp['edge'],
                'confidence': opp['confidence']
            })

        avg_confidence /= len(combo_opps)
        avg_edge = total_edge / len(combo_opps)

        # Kombinált edge számítás
        fair_total_odds = 1 / combined_prob
        combo_edge = combined_prob - (1 / total_odds)

        if combo_edge <= 0:
            return None

        # Kelly kritérium
        kelly_fraction = combo_edge / (total_odds - 1) if total_odds > 1 else 0
        conservative_kelly = kelly_fraction * 0.2  # Még konzervatívabb kombinációknál

        # Kockázat értékelés
        risk_factors = {
            'size_risk': (len(combo_opps) - 1) * 0.3,  # Méret kockázat
            'odds_risk': max(0, (total_odds - 10) * 0.1),  # Magas odds kockázat
            'confidence_risk': (1 - min_confidence) * 2,  # Alacsony confidence
            'correlation_risk': self._estimate_correlation_risk(combo_opps)
        }

        total_risk = sum(risk_factors.values())

        # Minőségi pontszám
        quality_score = (
            combo_edge * 50 +  # Edge súly
            avg_confidence * 30 +  # Confidence súly
            min(conservative_kelly * 100, 15) * 15 +  # Kelly súly
            max(0, 5 - total_risk) * 5  # Alacsony kockázat bónusz
        )

        return {
            'combo_size': len(combo_opps),
            'matches': match_details,
            'total_odds': total_odds,
            'combined_prob': combined_prob,
            'combo_edge': combo_edge,
            'avg_edge': avg_edge,
            'min_confidence': min_confidence,
            'avg_confidence': avg_confidence,
            'kelly_fraction': conservative_kelly,
            'risk_factors': risk_factors,
            'total_risk': total_risk,
            'quality_score': quality_score,
            'expected_value': conservative_kelly * (total_odds - 1) * combined_prob - conservative_kelly * (1 - combined_prob)
        }

    def _is_valid_combination(self, combo_opps):
        """Kombináció érvényességének ellenőrzése."""
        # Különböző mérkőzések
        matches = [opp['match'] for opp in combo_opps]
        if len(matches) != len(set(matches)):
            return False

        # Odds tartomány ellenőrzés
        total_odds = 1.0
        for opp in combo_opps:
            total_odds *= opp['odds']

        if total_odds < self.min_total_odds or total_odds > self.max_total_odds:
            return False

        return True

    def _estimate_correlation_risk(self, combo_opps):
        """Becsli a kombináció korreláció kockázatát."""
        # Alapvető heurisztikák
        risk = 0

        # Ha túl sok 1X2 hazai győzelem ugyanazon a napon
        home_wins = sum(1 for opp in combo_opps if opp['market'] == '1X2' and opp['selection'] == 'H')
        if home_wins >= 3:
            risk += 0.5

        # Ha mix market-ek (jó diverzifikáció)
        markets = set(opp['market'] for opp in combo_opps)
        if len(markets) > 1:
            risk -= 0.2

        return max(0, risk)

    def display_combinations(self, combinations, top_n=10):
        """Kombináció eredmények megjelenítése."""
        if not combinations:
            print("❌ Nincs elérhető kombináció!")
            return

        print(f"\n🏆 TOP {min(top_n, len(combinations))} KOMBINÁCIÓS LEHETŐSÉG")
        print("=" * 100)

        for idx, combo in enumerate(combinations[:top_n], 1):
            print(f"\n{idx}. 🎰 {combo['combo_size']}-es kombináció")

            # Mérkőzések részletei
            for i, match in enumerate(combo['matches'], 1):
                print(f"      {i}. {match['match']} - {match['market']} @ {match['odds']:.2f}")
                print(f"         Edge: {match['edge']*100:.1f}%, Confidence: {match['confidence']*100:.1f}%")

            print(f"   🎲 Kombinált odds: {combo['total_odds']:.2f}")
            print(f"   📈 Kombinált edge: {combo['combo_edge']*100:.1f}%")
            print(f"   🎯 Min confidence: {combo['min_confidence']*100:.1f}%")
            print(f"   ⭐ Minőségi pontszám: {combo['quality_score']:.1f}")
            print(f"   ⚠️ Kockázat szint: {combo['total_risk']:.2f}")
            print(f"   💰 Javasolt tét: {1000 * combo['kelly_fraction']:.0f} (1000 bankroll)")
            print(f"   📊 Várható érték: {combo['expected_value']*100:.1f}%")

            # Kockázat bontása
            risk_details = []
            for risk_type, risk_val in combo['risk_factors'].items():
                if risk_val > 0.1:
                    risk_details.append(f"{risk_type}: {risk_val:.2f}")

            if risk_details:
                print(f"   ⚠️ Kockázat tényezők: {', '.join(risk_details)}")

def simulate_combination_outcomes(combinations, num_simulations=1000):
    """Kombináció kimenetelének szimulálása."""
    if not combinations:
        return []

    print(f"\n🎲 Kombináció szimuláció ({num_simulations} futtatás)...")

    simulation_results = []

    for combo in combinations[:5]:  # Top 5 kombináció
        wins = 0
        total_return = 0

        for _ in range(num_simulations):
            # Minden egyes fogadás kimenetele
            all_win = True

            for match in combo['matches']:
                # Szimuláció a confidence alapján (konzervatív)
                win_prob = match['confidence'] * 0.8  # 20% biztonsági tartalék
                if np.random.random() > win_prob:
                    all_win = False
                    break

            if all_win:
                wins += 1
                total_return += combo['total_odds']

            total_return -= 1  # Tét levonása

        win_rate = wins / num_simulations
        avg_return = total_return / num_simulations
        roi = avg_return

        simulation_results.append({
            'combo': combo,
            'win_rate': win_rate,
            'avg_return': avg_return,
            'roi': roi,
            'profitable': avg_return > 0
        })

    return simulation_results

def main():
    """Főprogram."""
    print("🎰 VALÓS IDEJŰ KOMBINÁLT FOGADÁSI ELEMZŐ")
    print("=" * 70)
    print(f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    try:
        # Training adatok betöltése
        print("📚 Training adatok betöltése...")
        seasons = ['pl2223.csv', 'pl2324.csv', 'pl2425.csv']
        all_data = []

        for season in seasons:
            try:
                df_season = load_data(season)
                all_data.append(df_season)
            except FileNotFoundError:
                continue

        training_data = pd.concat(all_data, ignore_index=True)
        print(f"✅ {len(training_data)} mérkőzés betöltve")

        # Predikciós motor
        predictor = MatchPredictor(training_data)
        combination_analyzer = LiveCombinationAnalyzer(predictor)

        # Példa hétvégi program
        weekend_fixtures = [
            ('Arsenal', 'Chelsea', 2.1, 3.4, 3.8),
            ('Man City', 'Liverpool', 2.3, 3.2, 3.1),
            ('Tottenham', 'Man United', 2.0, 3.5, 4.0),
            ('Newcastle', 'Brighton', 1.8, 3.8, 4.5),
            ('Aston Villa', 'Wolves', 1.9, 3.6, 4.2),
            ('West Ham', 'Crystal Palace', 2.2, 3.3, 3.4),
            ('Fulham', 'Brentford', 2.1, 3.4, 3.6),
            ('Burnley', 'Luton', 1.7, 3.9, 5.0),
        ]

        print(f"\n⚽ Hétvégi program elemzése ({len(weekend_fixtures)} mérkőzés)...")

        # Kombinációk keresése
        combinations = combination_analyzer.analyze_weekend_combinations(weekend_fixtures)

        if combinations:
            # Eredmények megjelenítése
            combination_analyzer.display_combinations(combinations, top_n=8)

            # Szimuláció
            sim_results = simulate_combination_outcomes(combinations)

            if sim_results:
                print(f"\n📊 SZIMULÁCIÓS EREDMÉNYEK")
                print("=" * 50)

                for idx, result in enumerate(sim_results, 1):
                    combo = result['combo']
                    print(f"\n{idx}. {combo['combo_size']}-es kombináció:")
                    print(f"   🎲 Nyerési arány: {result['win_rate']*100:.1f}%")
                    print(f"   💰 Átlag hozam: {result['avg_return']:.2f}")
                    print(f"   📊 ROI: {result['roi']*100:.1f}%")
                    print(f"   ✅ Profitábilis: {'Igen' if result['profitable'] else 'Nem'}")

            # Javaslat
            profitable_combos = [c for c in combinations if c['expected_value'] > 0]

            print(f"\n💡 BEFEKTETÉSI JAVASLAT")
            print("=" * 40)

            if profitable_combos:
                total_suggested_stake = sum(c['kelly_fraction'] * 1000 for c in profitable_combos[:3])
                print(f"🎯 Ajánlott kombinációk: {len(profitable_combos[:3])}")
                print(f"💰 Összes javasolt tét: {total_suggested_stake:.0f} (1000 bankroll)")
                print(f"📈 Várható összprofit: {sum(c['expected_value'] for c in profitable_combos[:3])*100:.1f}%")

                print(f"\n🏆 Legjobb kombináció:")
                best = profitable_combos[0]
                print(f"   {best['combo_size']}-es @ {best['total_odds']:.2f}")
                print(f"   Edge: {best['combo_edge']*100:.1f}%, Kockázat: {best['total_risk']:.2f}")
            else:
                print("❌ Nincs profitábilis kombináció ezen a hétvégén")
                print("💡 Próbáld meg egyedi fogadásokkal vagy várj jobb odds-okra")

            # CSV mentés
            if combinations:
                combo_data = []
                for combo in combinations:
                    matches_str = " | ".join([f"{m['match']}-{m['market']}" for m in combo['matches']])
                    combo_data.append({
                        'combo_size': combo['combo_size'],
                        'matches': matches_str,
                        'total_odds': combo['total_odds'],
                        'combo_edge': combo['combo_edge'],
                        'quality_score': combo['quality_score'],
                        'suggested_stake': combo['kelly_fraction'] * 1000
                    })

                combo_df = pd.DataFrame(combo_data)
                filename = f"weekend_combinations_{datetime.now().strftime('%Y%m%d')}.csv"
                combo_df.to_csv(filename, index=False)
                print(f"\n💾 Kombinációk mentve: {filename}")

        else:
            print("❌ Nincs megfelelő kombinációs lehetőség")

    except Exception as e:
        print(f"❌ Hiba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

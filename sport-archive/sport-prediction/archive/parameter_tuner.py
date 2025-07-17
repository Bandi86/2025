"""
Egyszerű paraméter finomhangoló a meglévő adatokkal.
Különböző beállításokat próbál ki és megmutatja melyik a legjobb.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import ParameterGrid
import matplotlib.pyplot as plt

def simple_parameter_tuning(model, X_test, y_test, odds_df, le=None):
    """Egyszerű paraméter finomhangolás grid search-el."""

    print("🔧 EGYSZERŰ PARAMÉTER FINOMHANGOLÁS")
    print("=" * 50)

    # Paraméter rácsok meghatározása
    param_grid = {
        'min_confidence': [0.55, 0.60, 0.65, 0.70, 0.75],
        'min_edge': [0.10, 0.12, 0.15, 0.18, 0.20],
        'max_bet_pct': [0.008, 0.01, 0.015, 0.02],
        'min_odds': [1.2, 1.3, 1.4],
        'max_odds': [3.0, 3.5, 4.0]
    }

    # Összes kombináció generálása
    param_combinations = list(ParameterGrid(param_grid))

    print(f"🔍 {len(param_combinations)} paraméter kombináció tesztelése...")

    results = []

    for i, params in enumerate(param_combinations):
        if i % 20 == 0:  # Progress update
            print(f"   Progress: {i}/{len(param_combinations)} ({i/len(param_combinations)*100:.1f}%)")

        # Stratégia futtatása ezekkel a paraméterekkel
        try:
            result = run_strategy_with_params(model, X_test, y_test, odds_df, params, le)

            if result['bet_count'] > 0:  # Csak ha volt fogadás
                results.append({
                    **params,
                    'bet_count': result['bet_count'],
                    'roi': result['roi'],
                    'win_rate': result['win_rate'],
                    'final_bankroll': result['final_bankroll'],
                    'total_profit': result['total_profit']
                })
        except Exception as e:
            # Hibás paraméterek kihagyása
            continue

    if not results:
        print("❌ Nincs érvényes eredmény!")
        return None

    # Eredmények DataFrame-be
    results_df = pd.DataFrame(results)

    # Top 10 legjobb ROI
    top_results = results_df.nlargest(10, 'roi')

    print(f"\n🏆 TOP 10 LEGJOBB ROI:")
    print("=" * 80)
    for i, (idx, row) in enumerate(top_results.iterrows(), 1):
        print(f"{i:2d}. ROI: {row['roi']:+6.2f}% | "
              f"Fogadások: {row['bet_count']:2d} | "
              f"Win: {row['win_rate']:5.1f}% | "
              f"Conf: {row['min_confidence']:.2f} | "
              f"Edge: {row['min_edge']:.2f} | "
              f"MaxBet: {row['max_bet_pct']:.3f}")

    # Legjobb paraméterek
    best_params = top_results.iloc[0]
    print(f"\n🎯 LEGJOBB PARAMÉTEREK:")
    print(f"   Min konfidencia: {best_params['min_confidence']:.2f}")
    print(f"   Min edge: {best_params['min_edge']:.2f}")
    print(f"   Max bet %: {best_params['max_bet_pct']:.3f}")
    print(f"   Min odds: {best_params['min_odds']:.1f}")
    print(f"   Max odds: {best_params['max_odds']:.1f}")
    print(f"   ROI: {best_params['roi']:+.2f}%")
    print(f"   Fogadások: {best_params['bet_count']}")
    print(f"   Win rate: {best_params['win_rate']:.1f}%")

    # Statisztikák
    print(f"\n📊 ÖSSZESÍTŐ STATISZTIKÁK:")
    print(f"   Összes tesztelt kombináció: {len(param_combinations)}")
    print(f"   Érvényes eredmények: {len(results)}")
    print(f"   Átlag ROI: {results_df['roi'].mean():.2f}%")
    print(f"   Legjobb ROI: {results_df['roi'].max():.2f}%")
    print(f"   Legrosszabb ROI: {results_df['roi'].min():.2f}%")
    print(f"   Pozitív ROI-k: {(results_df['roi'] > 0).sum()}/{len(results)} ({(results_df['roi'] > 0).mean()*100:.1f}%)")

    # Eredmények mentése
    results_df.to_csv('parameter_tuning_results.csv', index=False)
    print(f"\n💾 Eredmények mentve: parameter_tuning_results.csv")

    return results_df, best_params

def run_strategy_with_params(model, X_test, y_test, odds_df, params, le=None):
    """Stratégia futtatása megadott paraméterekkel."""

    probs = model.predict_proba(X_test)
    y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

    bankroll = 100
    results = []

    for i, (idx, row) in enumerate(odds_df.iterrows()):
        # Model valószínűségek
        home_prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]
        away_prob = probs[i, 2] if not le else probs[i, le.transform(['A'])[0]]

        # Expected values
        ev_home = home_prob * row['HomeOdds']
        ev_away = away_prob * row['AwayOdds']

        # Value betting logika
        best_option = None

        if (ev_home > 1 + params['min_edge'] and
            home_prob > params['min_confidence'] and
            params['min_odds'] <= row['HomeOdds'] <= params['max_odds']):
            best_option = ('H', home_prob, row['HomeOdds'])

        elif (ev_away > 1 + params['min_edge'] and
              away_prob > params['min_confidence'] and
              params['min_odds'] <= row['AwayOdds'] <= params['max_odds']):
            best_option = ('A', away_prob, row['AwayOdds'])

        if best_option:
            outcome, prob, odds = best_option

            # Egyszerű Kelly tét (max bet % korlátozással)
            kelly_frac = (prob * (odds - 1) - (1 - prob)) / (odds - 1)
            kelly_frac = max(0, min(kelly_frac, params['max_bet_pct']))

            stake = bankroll * kelly_frac

            if stake >= 0.5:  # Minimum tét
                actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                if outcome == actual_outcome:
                    profit = (odds - 1) * stake
                else:
                    profit = -stake

                bankroll += profit
                results.append(profit)

                # Stop ha túl nagy a veszteség
                if bankroll <= 80:  # 20% veszteség
                    break

    # Eredmények számítása
    bet_count = len(results)
    total_profit = sum(results) if results else 0
    roi = (total_profit / (bet_count * 1.0)) * 100 if bet_count > 0 else 0  # Átlag tét 1.0
    win_rate = (sum(1 for p in results if p > 0) / bet_count * 100) if bet_count > 0 else 0

    return {
        'bet_count': bet_count,
        'roi': roi,
        'win_rate': win_rate,
        'final_bankroll': bankroll,
        'total_profit': total_profit
    }

def quick_test_best_params(model, X_test, y_test, odds_df, le=None):
    """Gyors teszt néhány kézzel kiválasztott paraméterrel."""

    print("\n⚡ GYORS TESZT - KIVÁLASZTOTT PARAMÉTEREK")
    print("=" * 50)

    # Kézzel kiválasztott ígéretes kombinációk
    test_configs = [
        {'name': 'Konzervatív', 'min_confidence': 0.65, 'min_edge': 0.15, 'max_bet_pct': 0.01, 'min_odds': 1.3, 'max_odds': 3.5},
        {'name': 'Mérsékelt', 'min_confidence': 0.60, 'min_edge': 0.12, 'max_bet_pct': 0.015, 'min_odds': 1.2, 'max_odds': 4.0},
        {'name': 'Kockázatos', 'min_confidence': 0.55, 'min_edge': 0.10, 'max_bet_pct': 0.02, 'min_odds': 1.2, 'max_odds': 4.0},
        {'name': 'Ultra konzervatív', 'min_confidence': 0.70, 'min_edge': 0.18, 'max_bet_pct': 0.008, 'min_odds': 1.4, 'max_odds': 3.0},
    ]

    for config in test_configs:
        name = config.pop('name')
        result = run_strategy_with_params(model, X_test, y_test, odds_df, config, le)

        print(f"\n📊 {name}:")
        print(f"   Fogadások: {result['bet_count']}")
        print(f"   ROI: {result['roi']:+.2f}%")
        print(f"   Win rate: {result['win_rate']:.1f}%")
        print(f"   Végső bankroll: {result['final_bankroll']:.2f}")

        if result['roi'] > -5:  # Ha nem túl rossz
            print(f"   ✅ Ígéretes eredmény!")
        elif result['bet_count'] == 0:
            print(f"   ⚠️ Nincs fogadás - túl szigorú kritériumok")
        else:
            print(f"   ❌ Negatív eredmény")

if __name__ == "__main__":
    print("Ez egy segédmodul a paraméter finomhangoláshoz.")
    print("Használd az improved_main.py-ból!")

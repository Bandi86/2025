import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import random

def calculate_profit(row):
    """Calculate profit for all bets"""
    if row['Predicted'] == row['True']:
        if row['Predicted'] == 'H':
            return (row['HomeOdds'] - 1) * row['Stake']
        elif row['Predicted'] == 'A':
            return (row['AwayOdds'] - 1) * row['Stake']
        else:  # Draw
            return (row['DrawOdds'] - 1) * row['Stake']
    else:
        return -row['Stake']

def evaluate_strategy(model, X_train, y_train, X_test, y_test, odds_df, le=None, thresholds=[0.5, 0.6, 0.7, 0.8]):
    model.fit(X_train, y_train)
    probs = model.predict_proba(X_test)
    preds = model.predict(X_test)
    best_roi = -float('inf')
    best_threshold = None
    best_cum_profit = None
    best_df_bets = None
    print("\nKonfidencia küszöbök tesztelése:")
    for conf_threshold in thresholds:
        bet_mask = np.max(probs, axis=1) > conf_threshold
        df_bets = odds_df[bet_mask].copy()
        if len(df_bets) == 0:
            print(f"Küszöb {conf_threshold}: Nincs fogadás.")
            continue
        df_bets['Predicted'] = preds[bet_mask]
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test
        df_bets['True'] = y_test_values[bet_mask]
        df_bets['Stake'] = 1.0
        df_bets['Profit'] = df_bets.apply(calculate_profit, axis=1)
        cum_profit = df_bets['Profit'].cumsum()
        total_profit = df_bets['Profit'].sum()
        roi = (total_profit / df_bets['Stake'].sum()) * 100
        print(f"Küszöb {conf_threshold}: Fogadások száma={len(df_bets)}, ROI={roi:.2f}%, Összprofit={total_profit:.2f}")
        if roi > best_roi:
            best_roi = roi
            best_threshold = conf_threshold
            best_cum_profit = cum_profit
            best_df_bets = df_bets
    return best_threshold, best_roi, best_cum_profit, best_df_bets

def strategy_always_bet(outcome, odds_df, y_test):
    df_bets = odds_df.copy()
    df_bets['Predicted'] = outcome
    y_test_values = y_test.values if hasattr(y_test, 'values') else y_test
    df_bets['True'] = y_test_values
    df_bets['Stake'] = 1.0
    df_bets['Profit'] = df_bets.apply(calculate_profit, axis=1)
    return df_bets

def strategy_high_odds(model, X_test, y_test, odds_df, outcome, min_odds=2.5):
    y_test = y_test.values if hasattr(y_test, 'values') else y_test
    probs = model.predict_proba(X_test)
    if outcome == 'H':
        mask = odds_df['HomeOdds'] > min_odds
    elif outcome == 'A':
        mask = odds_df['AwayOdds'] > min_odds
    else:
        mask = odds_df['DrawOdds'] > min_odds
    df_bets = odds_df[mask].copy()
    df_bets['Predicted'] = outcome
    df_bets['True'] = y_test[mask]
    df_bets['Stake'] = 1.0
    df_bets['Profit'] = df_bets.apply(calculate_profit, axis=1)
    return df_bets

def strategy_combined(model, X_test, y_test, odds_df, outcome, min_odds=2.5, conf_threshold=0.7):
    y_test = y_test.values if hasattr(y_test, 'values') else y_test
    probs = model.predict_proba(X_test)
    idx = {'H':0, 'D':1, 'A':2}
    mask = (probs[:, idx[outcome]] > conf_threshold)
    if outcome == 'H':
        mask = mask & (odds_df['HomeOdds'] > min_odds)
    elif outcome == 'A':
        mask = mask & (odds_df['AwayOdds'] > min_odds)
    else:
        mask = mask & (odds_df['DrawOdds'] > min_odds)
    df_bets = odds_df[mask].copy()
    df_bets['Predicted'] = outcome
    df_bets['True'] = y_test[mask]
    df_bets['Stake'] = 1.0
    df_bets['Profit'] = df_bets.apply(calculate_profit, axis=1)
    return df_bets

def strategy_value_bet(model, X_test, y_test, odds_df, min_ev=1.0):
    y_test_values = y_test.values if hasattr(y_test, 'values') else y_test
    probs = model.predict_proba(X_test)
    evs = probs * odds_df[['HomeOdds', 'DrawOdds', 'AwayOdds']].values
    best_ev = np.max(evs, axis=1)
    mask = best_ev > min_ev
    best_outcome_idx = np.argmax(evs, axis=1)
    outcome_map = {0:'H', 1:'D', 2:'A'}
    df_bets = odds_df[mask].copy()
    df_bets['Predicted'] = [outcome_map[i] for i in best_outcome_idx[mask]]
    df_bets['True'] = y_test_values[mask]
    df_bets['Stake'] = 1.0
    df_bets['Profit'] = df_bets.apply(calculate_profit, axis=1)
    return df_bets

def kelly_criterion(prob, odds):
    if odds == 1:
        return 0
    return max((prob * (odds - 1) - (1 - prob)) / (odds - 1), 0)

def strategy_value_bet_kelly(model, X_test, y_test, odds_df, min_ev=1.0, initial_bankroll=100, le=None):
    y_test_values = y_test.values if hasattr(y_test, 'values') else y_test
    probs = model.predict_proba(X_test)
    evs = probs * odds_df[['HomeOdds', 'DrawOdds', 'AwayOdds']].values
    best_ev = np.max(evs, axis=1)
    mask = best_ev > min_ev
    best_outcome_idx = np.argmax(evs, axis=1)
    outcome_map = {0:'H', 1:'D', 2:'A'}
    df_bets = odds_df[mask].copy()
    df_bets['Predicted'] = [outcome_map[i] for i in best_outcome_idx[mask]]
    if le:
        df_bets['True'] = le.inverse_transform(y_test_values[mask])
    else:
        df_bets['True'] = y_test_values[mask]
    df_bets['Prob'] = probs[mask, best_outcome_idx[mask]]
    df_bets['Odds'] = df_bets.apply(lambda row: row['HomeOdds'] if row['Predicted'] == 'H' else row['DrawOdds'] if row['Predicted'] == 'D' else row['AwayOdds'], axis=1)
    df_bets['Kelly'] = df_bets.apply(lambda row: kelly_criterion(row['Prob'], row['Odds']), axis=1)
    bankroll = initial_bankroll
    bankrolls = [bankroll]
    for i, row in df_bets.iterrows():
        stake = bankroll * row['Kelly']
        if stake <= 0.01: # Avoid betting tiny amounts or zero
            bankrolls.append(bankroll)
            continue
        
        if row['Predicted'] == row['True']:
            profit = (row['Odds'] - 1) * stake
        else:
            profit = -stake
        bankroll += profit
        bankrolls.append(bankroll)
    df_bets['Bankroll'] = bankrolls[1:]
    return df_bets

def strategy_random(odds_df, y_test):
    y_test_values = y_test.values if hasattr(y_test, 'values') else y_test
    random_preds = [random.choice(['H', 'D', 'A']) for _ in range(len(y_test_values))]
    df_bets = odds_df.copy()
    df_bets['Predicted'] = random_preds
    df_bets['True'] = y_test_values
    df_bets['Stake'] = 1.0
    df_bets['Profit'] = df_bets.apply(calculate_profit, axis=1)
    return df_bets

def strategy_grid_search(model, X_test, y_test, odds_df, value_thresholds, odds_min_list, conf_thresholds, le=None):
    print("\nAutomatizált stratégiakereső eredményei:")
    y_test_values = y_test.values if hasattr(y_test, 'values') else y_test
    best_roi = -float('inf')
    best_params = None
    best_df = None
    for value_thr in value_thresholds:
        for odds_min in odds_min_list:
            for conf_thr in conf_thresholds:
                probs = model.predict_proba(X_test)
                ev_home = probs[:,0] * odds_df['HomeOdds']
                ev_draw = probs[:,1] * odds_df['DrawOdds']
                ev_away = probs[:,2] * odds_df['AwayOdds']
                evs = np.array([ev_home, ev_draw, ev_away])
                odds = odds_df[['HomeOdds', 'DrawOdds', 'AwayOdds']].T.values
                best_outcome_idx = np.argmax(evs, axis=0)
                best_ev = evs[best_outcome_idx, np.arange(len(best_outcome_idx))]
                best_prob = probs[np.arange(len(probs)), best_outcome_idx]
                best_odds = odds[best_outcome_idx, np.arange(len(best_outcome_idx))]
                mask = (best_ev > value_thr) & (best_prob > conf_thr) & (best_odds > odds_min)
                if mask.sum() == 0:
                    continue
                outcome_map = {0:'H', 1:'D', 2:'A'}
                df_bets = odds_df[mask].copy()
                df_bets['Predicted'] = [outcome_map[i] for i in best_outcome_idx[mask]]
                if le:
                    df_bets['True'] = le.inverse_transform(y_test_values[mask])
                else:
                    df_bets['True'] = y_test_values[mask]
                df_bets['Stake'] = 1.0
                df_bets['Profit'] = df_bets.apply(calculate_profit, axis=1)
                total_profit = df_bets['Profit'].sum()
                roi = (total_profit / df_bets['Stake'].sum()) * 100
                win_rate = (df_bets['Predicted'] == df_bets['True']).mean() * 100
                print(f"Value küszöb: {value_thr}, Odds min: {odds_min}, Magabiztosság: {conf_thr} -> Fogadások: {len(df_bets)}, Találati arány: {win_rate:.2f}%, ROI: {roi:.2f}%, Profit: {total_profit:.2f}")
                if roi > best_roi:
                    best_roi = roi
                    best_params = (value_thr, odds_min, conf_thr)
                    best_df = df_bets
    if best_df is not None:
        print(f"\nLegjobb stratégia: Value küszöb: {best_params[0]}, Odds min: {best_params[1]}, Magabiztosság: {best_params[2]}")
        print(f"Fogadások: {len(best_df)}, ROI: {best_roi:.2f}%")
        plt.figure(figsize=(10, 5))
        plt.plot(best_df['Profit'].cumsum().values, label='Legjobb stratégia')
        plt.xlabel('Fogadás sorszáma')
        plt.ylabel('Kumulált profit')
        plt.title('Kumulált profit - Legjobb stratégia')
        plt.legend()
        plt.tight_layout()
        plt.savefig('cumulative_profit_best_strategy.png')
        plt.close()

def strategy_realistic_accumulator(model, X_test, y_test, odds_df, le, initial_bankroll=100, odds_range=(1.2, 3.0), matches_per_slip=2, max_slips_per_round=2, min_match_prob=0.6):
    bankroll = initial_bankroll
    bankroll_history = [bankroll]
    df_bets = pd.DataFrame(columns=['Date', 'Slip_ID', 'Matches_in_Slip', 'Combined_Odds', 'Predicted_Prob', 'Stake', 'Profit', 'Bankroll'])

    # Ensure y_test is in string format for comparison
    y_test_str = y_test.values if hasattr(y_test, 'values') else y_test
    if le:
        y_test_str = le.inverse_transform(y_test_str)

    # Get model predictions and probabilities for the entire test set
    probs_all = model.predict_proba(X_test)
    preds_all = model.predict(X_test)
    if le:
        preds_all = le.inverse_transform(preds_all)

    # Create a DataFrame with all necessary information for the test set
    test_data = odds_df.copy()
    test_data['Predicted_Outcome'] = preds_all
    test_data['True_Outcome'] = y_test_str
    test_data['HomeProb'] = probs_all[:, le.transform(['H'])[0]] if le else probs_all[:, 0]
    test_data['DrawProb'] = probs_all[:, le.transform(['D'])[0]] if le else probs_all[:, 1]
    test_data['AwayProb'] = probs_all[:, le.transform(['A'])[0]] if le else probs_all[:, 2]

    slip_id_counter = 0

    for date, daily_matches in test_data.groupby('Date'):
        if bankroll <= 0:
            break

        suitable_matches = []
        for idx, row in daily_matches.iterrows():
            pred_outcome = row['Predicted_Outcome']
            odds = 0
            prob = 0
            if pred_outcome == 'H':
                odds = row['HomeOdds']
                prob = row['HomeProb']
            elif pred_outcome == 'D':
                odds = row['DrawOdds']
                prob = row['DrawProb']
            elif pred_outcome == 'A':
                odds = row['AwayOdds']
                prob = row['AwayProb']

            if odds_range[0] <= odds <= odds_range[1] and prob >= min_match_prob:
                suitable_matches.append({
                    'Index': idx,
                    'Predicted_Outcome': pred_outcome,
                    'True_Outcome': row['True_Outcome'],
                    'Odds': odds,
                    'Prob': prob,
                    'HomeOdds': row['HomeOdds'],
                    'DrawOdds': row['DrawOdds'],
                    'AwayOdds': row['AwayOdds']
                })

        # Sort by predicted probability (highest first) to pick the most confident bets
        suitable_matches.sort(key=lambda x: x['Prob'], reverse=True)

        slips_formed = 0
        matches_taken_indices = set()

        while slips_formed < max_slips_per_round:
            current_slip_matches = []
            for match in suitable_matches:
                if match['Index'] not in matches_taken_indices:
                    current_slip_matches.append(match)
                    if len(current_slip_matches) == matches_per_slip:
                        break
            
            if len(current_slip_matches) < matches_per_slip:
                break # Not enough unique matches for a full slip

            # Mark matches as taken
            for match in current_slip_matches:
                matches_taken_indices.add(match['Index'])

            combined_odds = np.prod([m['Odds'] for m in current_slip_matches])
            combined_prob = np.prod([m['Prob'] for m in current_slip_matches])

            if combined_odds > 1 and combined_prob > 0: # Ensure odds are positive and probability is not zero
                kelly_fraction = kelly_criterion(combined_prob, combined_odds)
                stake = bankroll * kelly_fraction

                if stake < 0.5 and kelly_fraction > 0: # If Kelly stake is too small but positive, set a minimum
                    stake = 0.5
                elif stake < 0.01: # If Kelly stake is effectively zero, don't bet
                    continue

    return df_bets

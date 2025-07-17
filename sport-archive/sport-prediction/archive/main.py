import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
from data_loader import load_data
from feature_engineering import create_features
from model_trainer import (
    get_features_and_target,
    split_data,
    scale_features,
    select_features,
    encode_labels,
    get_models,
    tune_model,
    perform_cross_validation,
    get_ensemble_model,
)
from strategies import (
    evaluate_strategy,
    strategy_always_bet,
    strategy_high_odds,
    strategy_combined,
    strategy_value_bet,
    strategy_value_bet_kelly,
    strategy_random,
    strategy_grid_search,
    strategy_realistic_accumulator,
)

def main():
    # 1. Adatok betöltése és előkészítése
    print("Adatok betöltése és előkészítése...")
    df_2223 = load_data("pl2223.csv")
    df_2324 = load_data("pl2324.csv")
    df_2425 = load_data("pl2425.csv")
    
    df = pd.concat([df_2324, df_2425, df_2223], ignore_index=True)
    df = create_features(df)

    # 2. Jellemzők és célváltozó kiválasztása
    X, y, features = get_features_and_target(df)

    # 3. Adatok felosztása, skálázása és jellemzőválogatás
    X_train, X_test, y_train, y_test, split_idx = split_data(X, y)
    X_train_scaled, X_test_scaled, scaler = scale_features(X_train, X_test)

    models = get_models()
    model_rf = models['Random Forest']

    X_train_sel, X_test_sel, selector = select_features(model_rf, X_train_scaled, y_train, X_test_scaled, features)

    # 4. Modellek betanítása és értékelése
    y_train_enc, y_test_enc, le = encode_labels(y_train, y_test)

    tuned_models = {}
    for model_name, model in models.items():
        print(f"\n=== {model_name} ===")
        param_grid = {}
        if model_name == 'Random Forest':
            param_grid = {
                'n_estimators': [50, 100, 200],
                'max_depth': [None, 10, 20],
            }
        elif model_name == 'Logisztikus Regresszió':
            param_grid = {
                'C': [0.1, 1.0, 10.0],
                'solver': ['liblinear', 'lbfgs'],
            }
        elif model_name == 'XGBoost':
            param_grid = {
                'n_estimators': [50, 100, 200],
                'max_depth': [3, 5, 7],
                'learning_rate': [0.01, 0.1, 0.2],
            }

        if param_grid:
            print(f"Tuning {model_name}...")
            # Use y_train_enc for XGBoost, y_train for others during tuning
            y_train_for_tuning = y_train_enc if model_name == 'XGBoost' else y_train
            tuned_model = tune_model(model, param_grid, X_train_sel, y_train_for_tuning)
            tuned_models[model_name] = tuned_model
        else:
            tuned_models[model_name] = model # No tuning, use original model

        # Evaluate the (tuned) model
        current_model = tuned_models[model_name]
        if model_name == 'XGBoost':
            preds = le.inverse_transform(current_model.predict(X_test_sel))
        else:
            preds = current_model.predict(X_test_sel)

        print("\nModel értékelés:")
        print("Osztályozási jelentés:")
        print(classification_report(y_test, preds))
        print("\nKonfúziós mátrix:")
        print(confusion_matrix(y_test, preds))

        # Perform cross-validation
        print("\nCross-validation:")
        perform_cross_validation(current_model, X_train_sel, y_train_for_tuning)

    # Get and evaluate ensemble model
    print("\n=== Ensemble Model ===")
    ensemble_model = get_ensemble_model(tuned_models)
    ensemble_model.fit(X_train_sel, y_train_enc) # Fit ensemble on encoded labels
    ensemble_preds = le.inverse_transform(ensemble_model.predict(X_test_sel))

    print("\nEnsemble Model értékelés:")
    print("Osztályozási jelentés:")
    print(classification_report(y_test, ensemble_preds))
    print("\nKonfúziós mátrix:")
    print(confusion_matrix(y_test, ensemble_preds))

    print("\nCross-validation for Ensemble Model:")
    perform_cross_validation(ensemble_model, X_train_sel, y_train_enc)

    # 5. Fogadási stratégiák tesztelése
    odds_df = pd.DataFrame({
        'HomeOdds': df['B365H'].iloc[split_idx:].values,
        'AwayOdds': df['B365A'].iloc[split_idx:].values,
        'DrawOdds': df['B365D'].iloc[split_idx:].values
    }, index=y_test.index) # Keep original index for date

    # Add Date column to odds_df for easier grouping
    odds_df['Date'] = df['Date'].iloc[split_idx:].values

    # Add ensemble model to the models dictionary for strategy testing
    tuned_models['Ensemble'] = ensemble_model

    for model_name, model in tuned_models.items(): # Use tuned_models here
        print("\n\n" + '='*20 + " STRATÉGIÁK TESZTELÉSE: " + model_name.upper() + " " + '='*20)

        # Use the correct y_test for the model
        current_y_test = y_test_enc if model_name == 'XGBoost' or model_name == 'Ensemble' else y_test

        # Fit the model (already tuned, but fit on full X_train_sel for evaluation)
        if model_name == 'XGBoost' or model_name == 'Ensemble':
            model.fit(X_train_sel, y_train_enc)
        else:
            model.fit(X_train_sel, y_train)



        # --- Evaluate Strategy with Confidence Thresholds ---
        print("\n--- " + model_name + ": Konfidencia küszöbök tesztelése ---")
        best_threshold, best_roi, _, best_df_bets = evaluate_strategy(
            model, X_train_sel, y_train_enc if model_name == 'XGBoost' else y_train,
            X_test_sel, current_y_test, odds_df, le=le if model_name == 'XGBoost' else None)

        if model_name == 'XGBoost':
            xgboost_best_df_bets = best_df_bets # Store for later plotting

        if best_df_bets is not None:
            plt.figure(figsize=(10, 5))
            plt.plot(best_df_bets['Profit'].cumsum().values, label=f'{model_name} (Legjobb ROI: {best_roi:.2f}%, Küszöb: {best_threshold})')
            plt.xlabel('Fogadás sorszáma')
            plt.ylabel('Kumulált profit')
            plt.title(f'Kumulált profit - {model_name} (Sima)')
            plt.legend()
            plt.tight_layout()
            plt.savefig(f'plots/cumulative_profit_{model_name.replace(" ", "_").lower()}.png')
            plt.close()

        # --- Other Strategies ---
        strategies_to_run = [
            ("Magas odds hazai", lambda m=model: strategy_high_odds(m, X_test_sel, current_y_test, odds_df, 'H', 2.5)),
            ("Magas odds döntetlen", lambda m=model: strategy_high_odds(m, X_test_sel, current_y_test, odds_df, 'D', 2.5)),
            ("Magas odds vendég", lambda m=model: strategy_high_odds(m, X_test_sel, current_y_test, odds_df, 'A', 2.5)),
            ("Kombinált hazai", lambda m=model: strategy_combined(m, X_test_sel, current_y_test, odds_df, 'H', 2.5, 0.7)),
            ("Kombinált döntetlen", lambda m=model: strategy_combined(m, X_test_sel, current_y_test, odds_df, 'D', 2.5, 0.7)),
            ("Kombinált vendég", lambda m=model: strategy_combined(m, X_test_sel, current_y_test, odds_df, 'A', 2.5, 0.7)),
            ("Value bet", lambda m=model: strategy_value_bet(m, X_test_sel, current_y_test, odds_df, 1.0)),
            ("Value bet (Kelly)", lambda m=model: strategy_value_bet_kelly(m, X_test_sel, current_y_test, odds_df, 1.1, 100, le=le if model_name == 'XGBoost' else None)),
            ("Realista Akkumulátor", lambda m=model: strategy_realistic_accumulator(m, X_test_sel, current_y_test, odds_df, le=le if model_name == 'XGBoost' else None, initial_bankroll=100)),
        ]

        for strat_name, strat_func in strategies_to_run:
            df_bets = strat_func()

            # Inverse transform predictions if needed
            if model_name == 'XGBoost' and not df_bets.empty:
                if 'Predicted' in df_bets.columns and pd.api.types.is_integer_dtype(df_bets['Predicted']):
                    df_bets['Predicted'] = le.inverse_transform(df_bets['Predicted'])
                if 'True' in df_bets.columns and pd.api.types.is_integer_dtype(df_bets['True']):
                    df_bets['True'] = le.inverse_transform(df_bets['True'])

            if len(df_bets) == 0:
                print(f"""
{strat_name} stratégia ({model_name}): Nincs fogadás.""")
                continue

            if "Kelly" in strat_name:
                total_profit = df_bets['Bankroll'].iloc[-1] - 100 # Assuming initial bankroll is 100
                roi = (total_profit / 100) * 100 # ROI based on initial bankroll
                win_rate = (df_bets['Predicted'] == df_bets['True']).mean() * 100
            elif "Realista Akkumulátor" in strat_name:
                total_profit = df_bets['Profit'].sum()
                roi = (total_profit / df_bets['Stake'].sum()) * 100 if df_bets['Stake'].sum() > 0 else 0
                win_rate = (df_bets['Profit'] > 0).mean() * 100 # Win rate based on positive profit
            else:
                total_profit = df_bets['Profit'].sum()
                roi = (total_profit / df_bets['Stake'].sum()) * 100 if df_bets['Stake'].sum() > 0 else 0
                win_rate = (df_bets['Predicted'] == df_bets['True']).mean() * 100

            print(f"""
{strat_name} stratégia ({model_name}):""")
            print(f"Fogadások száma: {len(df_bets)}")
            print(f"Találati arány: {win_rate:.2f}%")
            print(f"Összprofit: {total_profit:.2f}")
            print(f"ROI: {roi:.2f}%")

            if "Kelly" in strat_name and not df_bets.empty:
                 print(f"Végső bankroll: {df_bets['Bankroll'].iloc[-1]:.2f}")

            plt.figure(figsize=(10, 5))
            plot_data = df_bets['Bankroll'].values if "Kelly" in strat_name else df_bets['Profit'].cumsum().values
            plot_label = 'Bankroll' if "Kelly" in strat_name else 'Kumulált profit'
            plt.plot(plot_data, label=f"{strat_name} ({model_name})")
            plt.xlabel('Fogadás sorszáma')
            plt.ylabel(plot_label)
            plt.title(f'{plot_label} - {strat_name} ({model_name})')
            plt.legend()
            plt.tight_layout()
            plt.savefig(f'plots/cumulative_profit_{model_name.replace(" ", "_").lower()}_{strat_name.replace(" ", "_").lower()}.png')
            plt.close()

    # --- Model-Independent Strategies ---
    print(f"""

{'='*20} MODELLFÜGGETLEN STRATÉGIÁK {'='*20}""")
    model_independent_strategies = [
        ("Mindig hazai", lambda: strategy_always_bet('H', odds_df, y_test)),
        ("Mindig döntetlen", lambda: strategy_always_bet('D', odds_df, y_test)),
        ("Mindig vendég", lambda: strategy_always_bet('A', odds_df, y_test)),
        ("Véletlen", lambda: strategy_random(odds_df, y_test)),
    ]
    for strat_name, strat_func in model_independent_strategies:
        df_bets = strat_func()
        if len(df_bets) == 0:
            print(f"{strat_name}: Nincs fogadás.")
            continue
        total_profit = df_bets['Profit'].sum()
        roi = (total_profit / df_bets['Stake'].sum()) * 100
        win_rate = (df_bets['Predicted'] == df_bets['True']).mean() * 100
        print(f"""
{strat_name} stratégia:""")
        print(f"Fogadások száma: {len(df_bets)}")
        print(f"Találati arány: {win_rate:.2f}%")
        print(f"Összprofit: {total_profit:.2f}")
        print(f"ROI: {roi:.2f}%")
        plt.figure(figsize=(10, 5))
        plt.plot(df_bets['Profit'].cumsum().values, label=strat_name)
        plt.xlabel('Fogadás sorszáma')
        plt.ylabel('Kumulált profit')
        plt.title(f'Kumulált profit - {strat_name}')
        plt.legend()
        plt.tight_layout()
        plt.savefig(f'plots/cumulative_profit_{strat_name.replace(" ", "_").lower()}.png')
        plt.close()


    # 8. Automatizált stratégiakereső (csak a legjobb modellel)
    print(f"""

{'='*20} AUTOMATIZÁLT STRATÉGIAKERESŐ (XGBOOST) {'='*20}""")
    value_thresholds = [1.0, 1.05, 1.1]
    odds_min_list = [1.5, 2.0, 2.5]
    conf_thresholds = [0.5, 0.6, 0.7]
    strategy_grid_search(tuned_models['XGBoost'], X_test_sel, y_test_enc, odds_df, value_thresholds, odds_min_list, conf_thresholds, le=le)

    # Plotting the best strategy (XGBoost with confidence threshold)
    if xgboost_best_df_bets is not None:
        initial_bankroll = 100
        xgboost_best_df_bets['Cumulative_Profit_from_100'] = initial_bankroll + xgboost_best_df_bets['Profit'].cumsum()

        plt.figure(figsize=(12, 6))
        plt.plot(xgboost_best_df_bets['Cumulative_Profit_from_100'], label='XGBoost Best Confidence Strategy')
        plt.axhline(y=initial_bankroll, color='r', linestyle='--', label='Initial Bankroll (100 Euros)')
        plt.xlabel('Bet Number')
        plt.ylabel('Bankroll (Euros)')
        plt.title('Cumulative Profit of Best XGBoost Confidence Strategy (Starting with 100 Euros)')
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plt.savefig('plots/cumulative_profit_xgboost_best_confidence_strategy.png')
        plt.close()

''

if __name__ == "__main__":
    main()

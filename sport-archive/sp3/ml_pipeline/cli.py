#!/usr/bin/env python3
"""
Egységes CLI: tanítás, predikció, összefoglaló, értékelés, value bet, odds, várható gól
Használat:
  python cli.py train      # Modell tanítása
  python cli.py predict --home_team ... --away_team ... --league ... --date ... --odds_home ... --odds_draw ... --odds_away ...
  python cli.py summary   # Adat összefoglaló
  python cli.py evaluate  # Modell értékelés
"""
import sys
import os
import argparse
from datetime import datetime

SRC = os.path.join(os.path.dirname(__file__), 'src')
sys.path.append(SRC)

from train_pipeline import train_model
from data_processor import summarize_data

import joblib
import pandas as pd
from colorama import Fore, Style, init
init(autoreset=True)

MODEL_PATH = "models/unified_football_model.pkl"

def predict_cli():
    parser = argparse.ArgumentParser(description="Futball predikciós CLI (value bet, odds, várható gól)")
    parser.add_argument('--home_team', type=str, help='Hazai csapat neve')
    parser.add_argument('--away_team', type=str, help='Vendég csapat neve')
    parser.add_argument('--league', type=str, help='Liga neve')
    parser.add_argument('--date', type=str, help='Meccs dátuma (YYYY-MM-DD)')
    parser.add_argument('--odds_home', type=float, help='Hazai odds')
    parser.add_argument('--odds_draw', type=float, help='Döntetlen odds')
    parser.add_argument('--odds_away', type=float, help='Vendég odds')
    args, unknown = parser.parse_known_args(sys.argv[2:])
    # Interaktív input, ha nincs argumentum
    if not args.home_team:
        args.home_team = input('Hazai csapat: ')
    if not args.away_team:
        args.away_team = input('Vendég csapat: ')
    if not args.league:
        args.league = input('Liga: ')
    if not args.date:
        args.date = input('Dátum (YYYY-MM-DD): ')
    if not args.odds_home:
        args.odds_home = float(input('Hazai odds: '))
    if not args.odds_draw:
        args.odds_draw = float(input('Döntetlen odds: '))
    if not args.odds_away:
        args.odds_away = float(input('Vendég odds: '))
    if not os.path.exists(MODEL_PATH):
        print(Fore.RED + f"❌ Modell nem található: {MODEL_PATH}")
        sys.exit(1)
    model_data = joblib.load(MODEL_PATH)
    le_home = model_data['le_home']
    le_away = model_data['le_away']
    le_league = model_data['le_league']
    features = model_data['features']
    # Kódolás
    try:
        X_enc = pd.DataFrame({
            'home_team_enc': [le_home.transform([args.home_team])[0]],
            'away_team_enc': [le_away.transform([args.away_team])[0]],
            'league_enc': [le_league.transform([args.league])[0]]
        })
    except Exception as e:
        print(Fore.RED + f"Hiba a csapat/liga kódolásánál: {e}")
        sys.exit(1)
    model = model_data['model']
    # Eredmény valószínűségek
    proba = model.predict_proba(X_enc.values)[0]
    classes = model.classes_
    proba_dict = dict(zip(classes, proba))
    # Várható gól becslés (egyszerű baseline: ligánkénti átlag, vagy modellel bővíthető)
    expected_goals_home = 1.4
    expected_goals_away = 1.1
    # Value bet logika
    value_bets = {}
    for outcome, odd in zip(['H','D','A'], [args.odds_home, args.odds_draw, args.odds_away]):
        implied = 1/odd if odd > 0 else 0
        model_prob = proba_dict.get(outcome, 0)
        value = model_prob - implied
        value_bets[outcome] = value
    best_bet = max(value_bets, key=value_bets.get)
    # Színes, informatív kimenet
    print(Style.BRIGHT + f"\n{args.league} | {args.home_team} vs {args.away_team} | {args.date}")
    print("-"*60)
    print(f"Hazai győzelem:   {proba_dict.get('H',0)*100:.1f}%   (odds: {args.odds_home})")
    print(f"Döntetlen:        {proba_dict.get('D',0)*100:.1f}%   (odds: {args.odds_draw})")
    print(f"Vendég győzelem:  {proba_dict.get('A',0)*100:.1f}%   (odds: {args.odds_away})")
    print(f"Várható gól (hazai): {expected_goals_home:.2f} | Várható gól (vendég): {expected_goals_away:.2f}")
    print("-"*60)
    if value_bets[best_bet] > 0.02:
        outcome_str = {'H':'Hazai','D':'Döntetlen','A':'Vendég'}[best_bet]
        print(Fore.GREEN + f"Érdemes fogadni: {outcome_str} ({value_bets[best_bet]*100:.1f}% value)")
    else:
        print(Fore.YELLOW + "Nincs igazán jó value fogadás a megadott oddsokkal.")
    print("-"*60)
    print(Style.DIM + f"Model: {type(model).__name__} | Futtatva: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Használat: python cli.py [train|predict|summary|evaluate]")
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "train":
        train_model()
    elif cmd == "predict":
        predict_cli()
    elif cmd == "summary":
        summarize_data()
    elif cmd == "evaluate":
        print("(Később implementálandó: részletes értékelés)")
    else:
        print(f"Ismeretlen parancs: {cmd}")
        sys.exit(1)

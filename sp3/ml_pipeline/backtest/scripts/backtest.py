#!/usr/bin/env python3
"""
Futball predikciós backtesting modul
- CSV-ből olvas múltbeli meccseket (dátum, liga, csapatok, oddsok, eredmény)
- Többféle fogadási stratégia szimulációja
- Bankroll menedzsment, eredmények összehasonlítása

Használat:
    python backtest.py --input matches.csv --strategy all_value --bankroll 10000 --stake_type fixed --stake 100

Stratégiák:
    all_value: minden value bet (>2%)
    home_value: csak hazai value bet
    away_value: csak vendég value bet
    draw_value: csak döntetlen value bet
    kelly: Kelly-kritérium szerinti tét
    over25_value: Over 2.5 value bet (később)
    btts_value: BTTS value bet (később)

A CSV-nek tartalmaznia kell: date,league,home_team,away_team,odds_home,odds_draw,odds_away,result (H/D/A)
"""
import csv
import argparse
import json
import subprocess
from collections import defaultdict

STRATEGIES = [
    "all_value", "home_value", "away_value", "draw_value", "kelly",
    "over25_value", "btts_value"
]

# Kelly-kritérium számítása
def kelly_fraction(prob, odds):
    b = odds - 1
    q = 1 - prob
    f = (b * prob - q) / b if b > 0 else 0
    return max(0, f)

def run_prediction(row):
    """Meghívja a predict_api.py-t egy meccsre, visszaadja a predikciót"""
    args = {
        "home_team": row["home_team"],
        "away_team": row["away_team"],
        "league": row["league"],
        "date": row["date"],
        "odds_home": float(row["odds_home"]),
        "odds_draw": float(row["odds_draw"]),
        "odds_away": float(row["odds_away"])
    }
    proc = subprocess.run([
        "python3", "predict_api.py", json.dumps(args)
    ], capture_output=True, text=True)
    if proc.returncode != 0:
        return None
    try:
        return json.loads(proc.stdout)
    except Exception:
        return None

def simulate_bet(outcome, odds, result, stake):
    if outcome == result:
        return (odds - 1) * stake
    else:
        return -stake

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Meccs CSV fájl")
    parser.add_argument("--strategies", nargs="*", choices=STRATEGIES, default=["all_value", "over25_value", "btts_value", "kelly"], help="Futtatandó stratégiák (több is lehet)")
    parser.add_argument("--bankroll", type=float, default=10000)
    parser.add_argument("--stake_type", choices=["fixed", "kelly"], default="fixed")
    parser.add_argument("--stake", type=float, default=100, help="Fix tét")
    parser.add_argument("--max_bets", type=int, default=1000, help="Max. fogadások száma teszthez")
    parser.add_argument("--value_threshold", type=float, default=0.02, help="Value bet threshold (pl. 0.01 vagy 0.00)")
    parser.add_argument("--multi_bet", action="store_true", help="Több value fogadás egy meccsen (nem csak az elsőre)")
    args = parser.parse_args()

    # Minden stratégiához külön bankroll, napló, stat
    results = {}
    for strat in args.strategies:
        results[strat] = {
            "bankroll": args.bankroll,
            "bets": [],
            "stats": defaultdict(int),
            "drawdown": 0,
            "max_bankroll": args.bankroll
        }

    with open(args.input, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for i, row in enumerate(reader):
            if i >= args.max_bets:
                break
            pred = run_prediction(row)
            if not pred or "value_bets" not in pred or "probabilities" not in pred:
                continue
            value_bets = pred["value_bets"]
            probs = pred["probabilities"]
            # Over/Under 2.5 value számítás
            odds_over = float(row.get("odds_over25", 2.0))
            odds_under = float(row.get("odds_under25", 1.8))
            prob_over = pred.get("over_under_25", {}).get("over_prob", 0)/100
            prob_under = pred.get("over_under_25", {}).get("under_prob", 0)/100
            value_over = prob_over - 1/odds_over if odds_over > 1 else 0
            value_under = prob_under - 1/odds_under if odds_under > 1 else 0
            # BTTS value számítás
            odds_btts_yes = float(row.get("odds_btts_yes", 1.9))
            odds_btts_no = float(row.get("odds_btts_no", 1.9))
            prob_btts_yes = pred.get("btts", {}).get("yes_prob", 0)/100
            prob_btts_no = pred.get("btts", {}).get("no_prob", 0)/100
            value_btts_yes = prob_btts_yes - 1/odds_btts_yes if odds_btts_yes > 1 else 0
            value_btts_no = prob_btts_no - 1/odds_btts_no if odds_btts_no > 1 else 0
            for strat in args.strategies:
                bets_to_make = []
                stake = args.stake
                # 1X2 stratégiák
                if strat == "all_value":
                    for k in ["home", "draw", "away"]:
                        if value_bets.get(k[0].upper(), 0) > args.value_threshold:
                            bets_to_make.append(k)
                            if not args.multi_bet:
                                break
                elif strat == "home_value" and value_bets.get("H", 0) > args.value_threshold:
                    bets_to_make.append("home")
                elif strat == "away_value" and value_bets.get("A", 0) > args.value_threshold:
                    bets_to_make.append("away")
                elif strat == "draw_value" and value_bets.get("D", 0) > args.value_threshold:
                    bets_to_make.append("draw")
                elif strat == "kelly":
                    kelly_bets = []
                    for k, o in zip(["H","D","A"], [row["odds_home"], row["odds_draw"], row["odds_away"]]):
                        prob = probs.get({"H":"home","D":"draw","A":"away"}[k], 0)/100
                        val = value_bets.get(k, 0)
                        if val > args.value_threshold:
                            f = kelly_fraction(prob, float(o))
                            if f > 0:
                                kelly_bets.append((k, f, o))
                    if kelly_bets:
                        kelly_bets.sort(key=lambda x: -x[1])
                        bets_to_make.append({"H":"home","D":"draw","A":"away"}[kelly_bets[0][0]])
                        stake = results[strat]["bankroll"] * kelly_bets[0][1]
                # Over/Under 2.5 stratégia
                elif strat == "over25_value":
                    if value_over > args.value_threshold:
                        bets_to_make.append("over25")
                    if value_under > args.value_threshold:
                        bets_to_make.append("under25")
                        if not args.multi_bet and bets_to_make:
                            bets_to_make = bets_to_make[:1]
                # BTTS stratégia
                elif strat == "btts_value":
                    if value_btts_yes > args.value_threshold:
                        bets_to_make.append("btts_yes")
                    if value_btts_no > args.value_threshold:
                        bets_to_make.append("btts_no")
                        if not args.multi_bet and bets_to_make:
                            bets_to_make = bets_to_make[:1]
                for bet in bets_to_make:
                    # Eredmény kiértékelése
                    if bet in ["home", "draw", "away"]:
                        odds = float(row[f"odds_{bet}"])
                        result = row["result"].lower()
                        profit = simulate_bet(bet[0].upper(), odds, result[0].upper(), stake)
                    elif bet == "over25":
                        odds = odds_over
                        result = "over25" if float(row.get("total_goals", -1)) > 2.5 else "under25"
                        profit = (odds-1)*stake if result=="over25" else -stake
                    elif bet == "under25":
                        odds = odds_under
                        result = "under25" if float(row.get("total_goals", -1)) <= 2.5 else "over25"
                        profit = (odds-1)*stake if result=="under25" else -stake
                    elif bet == "btts_yes":
                        odds = odds_btts_yes
                        result = "btts_yes" if row.get("btts_result", "")=="yes" else "btts_no"
                        profit = (odds-1)*stake if result=="btts_yes" else -stake
                    elif bet == "btts_no":
                        odds = odds_btts_no
                        result = "btts_no" if row.get("btts_result", "")=="no" else "btts_yes"
                        profit = (odds-1)*stake if result=="btts_no" else -stake
                    else:
                        continue
                    results[strat]["bankroll"] += profit
                    results[strat]["bets"].append({
                        "date": row["date"],
                        "match": f"{row['home_team']} - {row['away_team']}",
                        "bet": bet,
                        "odds": odds,
                        "stake": stake,
                        "result": result,
                        "profit": profit,
                        "bankroll": results[strat]["bankroll"]
                    })
                    results[strat]["stats"]["bets"] += 1
                    if profit > 0:
                        results[strat]["stats"]["wins"] += 1
                    else:
                        results[strat]["stats"]["losses"] += 1
                    results[strat]["stats"]["profit"] += profit
                    # Drawdown számítás
                    if results[strat]["bankroll"] > results[strat]["max_bankroll"]:
                        results[strat]["max_bankroll"] = results[strat]["bankroll"]
                    dd = results[strat]["max_bankroll"] - results[strat]["bankroll"]
                    if dd > results[strat]["drawdown"]:
                        results[strat]["drawdown"] = dd
    # Eredmények kiírása
    for strat in args.strategies:
        stats = results[strat]["stats"]
        n_bets = stats['bets']
        n_wins = stats['wins']
        n_losses = stats['losses']
        total_profit = stats['profit']
        avg_odds = sum(b['odds'] for b in results[strat]['bets'])/n_bets if n_bets else 0
        avg_stake = sum(b['stake'] for b in results[strat]['bets'])/n_bets if n_bets else 0
        avg_profit = total_profit/n_bets if n_bets else 0
        hitrate = 100*n_wins/n_bets if n_bets else 0
        print(f"\nStratégia: {strat}")
        print(f"Összes fogadás: {n_bets}")
        print(f"Találatok: {n_wins}, Vesztett: {n_losses}")
        print(f"Profit: {total_profit:.2f} Ft")
        print(f"ROI: {100*total_profit/(args.stake*n_bets) if n_bets else 0:.2f}%")
        print(f"Végső bankroll: {results[strat]['bankroll']:.2f} Ft")
        print(f"Max drawdown: {results[strat]['drawdown']:.2f} Ft")
        print(f"Találati arány: {hitrate:.2f}%")
        print(f"Átlagos odds: {avg_odds:.2f}")
        print(f"Átlagos tét: {avg_stake:.2f}")
        print(f"Átlagos profit fogadásonként: {avg_profit:.2f} Ft")
        # (Opcionális) részletes napló mentése
        with open(f"backtest_{strat}_log.json", "w") as f:
            json.dump(results[strat]["bets"], f, ensure_ascii=False, indent=2)

def run_all_strategies():
    import itertools
    thresholds = [0.00, 0.01, 0.03, 0.05]
    multi_bet_opts = [False, True]
    all_strats = ["all_value", "home_value", "away_value", "draw_value", "kelly", "over25_value", "btts_value"]
    for threshold, multi_bet in itertools.product(thresholds, multi_bet_opts):
        print(f"\n=== Teszt: threshold={threshold}, multi_bet={multi_bet} ===")
        for strat in all_strats:
            cmd = f"python3 backtest.py --input matches_backtest.csv --strategies {strat} --bankroll 10000 --stake_type fixed --stake 100 --max_bets 100 --value_threshold {threshold} {'--multi_bet' if multi_bet else ''}"
            print(f"\n>>> {strat} <<<")
            import subprocess
            subprocess.run(cmd, shell=True)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--auto":
        run_all_strategies()
    else:
        main()

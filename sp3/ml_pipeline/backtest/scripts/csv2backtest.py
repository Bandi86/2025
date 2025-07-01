# Script: csv2backtest.py
"""
Konvertálja a Premier League CSV-t (pl2324.csv) a backtest.py által elvárt formátumra.
Kimenet: matches_backtest.csv (date,league,home_team,away_team,odds_home,odds_draw,odds_away,result,total_goals,btts_result)
"""
import csv

input_path = "../../sport-prediction/data/premier_league/pl2324.csv"
output_path = "matches_backtest.csv"

with open(input_path, newline='') as infile, open(output_path, 'w', newline='') as outfile:
    reader = csv.DictReader(infile)
    fieldnames = [
        "date", "league", "home_team", "away_team",
        "odds_home", "odds_draw", "odds_away", "result",
        "total_goals", "btts_result"
    ]
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()
    for row in reader:
        try:
            date = row["Date"]
            league = row["Div"]
            home = row["HomeTeam"]
            away = row["AwayTeam"]
            odds_home = row["B365H"]
            odds_draw = row["B365D"]
            odds_away = row["B365A"]
            result = row["FTR"]
            total_goals = int(row["FTHG"]) + int(row["FTAG"])
            btts_result = "yes" if int(row["FTHG"]) > 0 and int(row["FTAG"]) > 0 else "no"
            writer.writerow({
                "date": date,
                "league": league,
                "home_team": home,
                "away_team": away,
                "odds_home": odds_home,
                "odds_draw": odds_draw,
                "odds_away": odds_away,
                "result": result,
                "total_goals": total_goals,
                "btts_result": btts_result
            })
        except Exception:
            continue
print(f"Kész: {output_path}")

import joblib
import sqlite3
import pandas as pd
import os

def predict_example():
    MODEL_PATH = "models/unified_football_model.pkl"
    DB_PATH = "db/unified_football.db"
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Modell nem található: {MODEL_PATH}")
        return
    if not os.path.exists(DB_PATH):
        print(f"❌ Adatbázis nem található: {DB_PATH}")
        return
    model_data = joblib.load(MODEL_PATH)
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("""
        SELECT * FROM matches
        WHERE home_team IS NOT NULL AND away_team IS NOT NULL
        AND home_goals IS NOT NULL AND away_goals IS NOT NULL
        AND league IS NOT NULL
        ORDER BY date DESC
        LIMIT 10
    """, conn)
    conn.close()
    if df.empty:
        print("❌ Nincs adat a predikcióhoz")
        return
    le_home = model_data['le_home']
    le_away = model_data['le_away']
    le_league = model_data['le_league']
    features = model_data['features']
    X = df[['home_team', 'away_team', 'league']]
    X_enc = pd.DataFrame({
        'home_team_enc': le_home.transform(X['home_team']),
        'away_team_enc': le_away.transform(X['away_team']),
        'league_enc': le_league.transform(X['league'])
    })
    pred = model_data['model'].predict(X_enc.values)
    for i, row in df.iterrows():
        print(f"{row['league']}: {row['home_team']} vs {row['away_team']} → Predikció: {pred[i]}")

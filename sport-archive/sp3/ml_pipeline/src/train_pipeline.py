import sqlite3
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import sys

def train_model():
    DB_PATH = "db/unified_football.db"
    MODEL_PATH = "models/unified_football_model.pkl"
    if not os.path.exists(DB_PATH):
        print(f"❌ Adatbázis nem található: {DB_PATH}")
        return
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("""
        SELECT * FROM matches
        WHERE home_team IS NOT NULL AND away_team IS NOT NULL
        AND home_goals IS NOT NULL AND away_goals IS NOT NULL
        AND league IS NOT NULL
        ORDER BY date DESC
    """, conn)
    conn.close()
    if df.empty or len(df) < 100:
        print(f"❌ Nincs elég adat a modell tanításához ({len(df)} meccs)")
        return
    print(f"✅ {len(df)} meccs betöltve\n")
    le_home = LabelEncoder()
    le_away = LabelEncoder()
    le_league = LabelEncoder()
    df['home_team_enc'] = le_home.fit_transform(df['home_team'])
    df['away_team_enc'] = le_away.fit_transform(df['away_team'])
    df['league_enc'] = le_league.fit_transform(df['league'])
    def get_result(row):
        if row['home_goals'] > row['away_goals']:
            return 'H'
        elif row['away_goals'] > row['home_goals']:
            return 'A'
        else:
            return 'D'
    df['result'] = df.apply(get_result, axis=1)
    features = ['home_team_enc', 'away_team_enc', 'league_enc']
    X = df[features].values
    y = df['result'].values
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    models = {
        'RandomForest': RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42),
        'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42)
    }
    best_acc = 0
    best_model = None
    best_name = None
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        acc = accuracy_score(y_test, preds)
        print(f"{name} pontosság: {acc:.3f}")
        if acc > best_acc:
            best_acc = acc
            best_model = model
            best_name = name
    if best_model is not None:
        joblib.dump({
            'model': best_model,
            'le_home': le_home,
            'le_away': le_away,
            'le_league': le_league,
            'features': features
        }, MODEL_PATH)
        print(f"\n✅ Legjobb modell: {best_name} ({best_acc:.3f}) elmentve: {MODEL_PATH}")
    else:
        print("❌ Nem sikerült modellt tanítani!")

if __name__ == "__main__":
    print("[INFO] train_pipeline.py elindult!")
    try:
        train_model()
        print("[INFO] train_pipeline.py sikeresen lefutott!")
    except Exception as e:
        print(f"[ERROR] train_pipeline.py futás közben hiba: {e}", file=sys.stderr)
        import traceback; traceback.print_exc()
        sys.exit(1)

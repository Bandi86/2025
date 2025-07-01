#!/usr/bin/env python3
"""
Egységes predikciós pipeline kizárólag CSV/strukturált adatbázis alapján
- Az adatforrás: models/unified_football.db (matches tábla)
- Nincs PDF-feldolgozás!
- Modell tanítás, validáció, tesztelés, predikció
"""

import sqlite3
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os

DB_PATH = "models/unified_football.db"
MODEL_PATH = "models/unified_football_model.pkl"

# 1. Adatok betöltése
print("\n=== Adatok betöltése az egységes adatbázisból ===")
if not os.path.exists(DB_PATH):
    print(f"❌ Adatbázis nem található: {DB_PATH}")
    exit(1)

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
    exit(1)

print(f"✅ {len(df)} meccs betöltve\n")

# 2. Feature engineering
print("=== Feature engineering ===")
# Csapatnév, liga kódolás
le_home = LabelEncoder()
le_away = LabelEncoder()
le_league = LabelEncoder()
df['home_team_enc'] = le_home.fit_transform(df['home_team'])
df['away_team_enc'] = le_away.fit_transform(df['away_team'])
df['league_enc'] = le_league.fit_transform(df['league'])

# Célváltozó: eredmény (H/A/D)
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

# 3. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 4. Modell tanítás
print("=== Modell tanítás ===")
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

# 5. Modell mentése
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
    exit(1)

# 6. Teszt riport
print("\n=== Teszt riport ===")
preds = best_model.predict(X_test)
print(classification_report(y_test, preds))
print(confusion_matrix(y_test, preds))

# 7. Példa predikció
print("\n=== Példa predikció ===")
example = X_test[0]
pred = best_model.predict([example])[0]
home = le_home.inverse_transform([example[0]])[0]
away = le_away.inverse_transform([example[1]])[0]
league = le_league.inverse_transform([example[2]])[0]
print(f"{league}: {home} vs {away} → Predikció: {pred}")

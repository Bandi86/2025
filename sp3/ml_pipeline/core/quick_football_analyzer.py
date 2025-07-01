#!/usr/bin/env python3
"""
🚀 GYORS FUTBALL ELEMZŐ RENDSZER

Egyszerűsített pipeline kis adathalmazokhoz:
- PDF adatkinyerés és tisztítás
- Egyszerű ML modell
- Alapvető előrejelzések
- Value bet keresés
"""

import os
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime
import json
import warnings
warnings.filterwarnings('ignore')

from advanced_football_extractor import AdvancedFootballExtractor
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import joblib

class QuickFootballAnalyzer:
    """Gyors futball elemző kis adathalmazokhoz"""

    def __init__(self, pdf_folder: str = "/home/bandi/Documents/code/2025/sp3/pdf"):
        self.pdf_folder = pdf_folder
        self.db_path = "quick_football.db"
        self.extractor = AdvancedFootballExtractor(self.db_path)
        self.model = None
        self.encoders = {}

    def run_analysis(self):
        """Gyors elemzés futtatása"""
        print("🚀 GYORS FUTBALL ELEMZŐ INDÍTÁSA")
        print("=" * 50)

        # 1. PDF feldolgozás
        print("\n1️⃣ PDF FELDOLGOZÁS")
        self._process_pdfs()

        # 2. Adatok tisztítása
        print("\n2️⃣ ADATTISZTÍTÁS")
        clean_count = self._clean_data()

        if clean_count < 5:
            print("❌ Túl kevés adat a további elemzéshez")
            return

        # 3. Egyszerű statisztikák
        print("\n3️⃣ ALAPSTATISZTIKÁK")
        self._basic_statistics()

        # 4. Egyszerű ML (ha van elég adat)
        print("\n4️⃣ EGYSZERŰ ML MODELL")
        if clean_count >= 10:
            self._simple_ml_training()
        else:
            print("📊 Túl kevés adat ML-hez, statisztikai módszereket használunk")
            self._statistical_predictions()

        # 5. Jelentés
        print("\n5️⃣ JELENTÉS")
        self._create_quick_report()

        print("\n✅ GYORS ELEMZÉS BEFEJEZVE")

    def _process_pdfs(self):
        """PDF-ek gyors feldolgozása"""
        pdf_files = [f for f in os.listdir(self.pdf_folder) if f.endswith('.pdf')]

        for pdf_file in pdf_files:
            pdf_path = os.path.join(self.pdf_folder, pdf_file)
            print(f"📄 {pdf_file}...")
            self.extractor.extract_comprehensive_data(pdf_path)

        self.extractor.save_all_data()
        print(f"✅ {len(self.extractor.match_results)} eredmény feldolgozva")

    def _clean_data(self) -> int:
        """Adatok tisztítása"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Rossz adatok törlése
        cursor.execute("""
            DELETE FROM match_results
            WHERE home_team LIKE '%Hendikep%'
            OR away_team LIKE '%Hendikep%'
            OR home_team LIKE '%Döntetlen%'
            OR away_team LIKE '%Döntetlen%'
            OR home_score > 10 OR away_score > 10
            OR LENGTH(home_team) < 3 OR LENGTH(away_team) < 3
            OR home_team = away_team
        """)

        cursor.execute("SELECT COUNT(*) FROM match_results")
        count = cursor.fetchone()[0]

        conn.commit()
        conn.close()

        print(f"✅ {count} tisztított eredmény")
        return count

    def _basic_statistics(self):
        """Alapvető statisztikák"""
        conn = sqlite3.connect(self.db_path)

        # Eredmény eloszlás
        df = pd.read_sql_query("""
            SELECT
                CASE
                    WHEN home_score > away_score THEN 'Hazai győzelem'
                    WHEN home_score < away_score THEN 'Vendég győzelem'
                    ELSE 'Döntetlen'
                END as result,
                COUNT(*) as count
            FROM match_results
            GROUP BY result
        """, conn)

        print("📊 Eredmény eloszlás:")
        for _, row in df.iterrows():
            print(f"   {row['result']}: {row['count']} ({row['count']/df['count'].sum():.1%})")

        # Liga statisztikák
        league_df = pd.read_sql_query("""
            SELECT league, COUNT(*) as matches
            FROM match_results
            GROUP BY league
            ORDER BY matches DESC
        """, conn)

        print("\n🏟️ Liga eloszlás:")
        for _, row in league_df.iterrows():
            print(f"   {row['league']}: {row['matches']} meccs")

        # Gólstatisztikák
        cursor = conn.cursor()
        cursor.execute("SELECT AVG(home_score + away_score) as avg_goals FROM match_results")
        avg_goals = cursor.fetchone()[0]

        cursor.execute("SELECT AVG(home_score) as avg_home, AVG(away_score) as avg_away FROM match_results")
        avg_home, avg_away = cursor.fetchone()

        print(f"\n⚽ Gólstatisztikák:")
        print(f"   Átlagos gólok meccsenkét: {avg_goals:.1f}")
        print(f"   Átlagos hazai gólok: {avg_home:.1f}")
        print(f"   Átlagos vendég gólok: {avg_away:.1f}")

        conn.close()

    def _simple_ml_training(self):
        """Egyszerű ML modell tanítása"""
        conn = sqlite3.connect(self.db_path)

        df = pd.read_sql_query("""
            SELECT home_team, away_team, home_score, away_score, league
            FROM match_results
        """, conn)
        conn.close()

        if len(df) < 10:
            print("❌ Túl kevés adat ML-hez")
            return

        # Eredmény címkék
        def get_result(row):
            if row['home_score'] > row['away_score']:
                return 1  # Hazai győzelem
            elif row['home_score'] < row['away_score']:
                return 2  # Vendég győzelem
            else:
                return 0  # Döntetlen

        df['result'] = df.apply(get_result, axis=1)

        # Egyszerű feature-ök
        self.encoders['home_team'] = LabelEncoder()
        self.encoders['away_team'] = LabelEncoder()
        self.encoders['league'] = LabelEncoder()

        # Összes csapat és liga
        all_teams = list(df['home_team'].unique()) + list(df['away_team'].unique())
        all_teams = list(set(all_teams))

        self.encoders['home_team'].fit(all_teams)
        self.encoders['away_team'].fit(all_teams)
        self.encoders['league'].fit(df['league'].unique())

        # Feature matrix
        X = []
        y = []

        for _, row in df.iterrows():
            try:
                home_id = self.encoders['home_team'].transform([row['home_team']])[0]
                away_id = self.encoders['away_team'].transform([row['away_team']])[0]
                league_id = self.encoders['league'].transform([row['league']])[0]

                X.append([home_id, away_id, league_id])
                y.append(row['result'])
            except:
                continue

        X = np.array(X)
        y = np.array(y)

        # Egyszerű modell tanítása
        self.model = LogisticRegression(random_state=42, max_iter=1000)
        self.model.fit(X, y)

        # Pontosság becslése
        predictions = self.model.predict(X)
        accuracy = accuracy_score(y, predictions)

        print(f"✅ Modell pontosság: {accuracy:.1%}")

        # Modell mentése
        model_data = {
            'model': self.model,
            'encoders': self.encoders,
            'accuracy': accuracy
        }
        joblib.dump(model_data, 'quick_football_model.pkl')

    def _statistical_predictions(self):
        """Statisztikai alapú előrejelzések"""
        conn = sqlite3.connect(self.db_path)

        # Hazai pálya előny számítása
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN home_score > away_score THEN 1 END) * 1.0 / COUNT(*) as home_win_rate
            FROM match_results
        """)
        home_win_rate = cursor.fetchone()[0]

        cursor.execute("""
            SELECT
                COUNT(CASE WHEN home_score < away_score THEN 1 END) * 1.0 / COUNT(*) as away_win_rate
            FROM match_results
        """)
        away_win_rate = cursor.fetchone()[0]

        draw_rate = 1.0 - home_win_rate - away_win_rate

        print("📊 Statisztikai valószínűségek:")
        print(f"   Hazai győzelem: {home_win_rate:.1%}")
        print(f"   Döntetlen: {draw_rate:.1%}")
        print(f"   Vendég győzelem: {away_win_rate:.1%}")

        # Ezeket használhatnánk jövőbeli meccsekre
        statistical_model = {
            'home_win_prob': home_win_rate,
            'draw_prob': draw_rate,
            'away_win_prob': away_win_rate
        }

        with open('statistical_model.json', 'w') as f:
            json.dump(statistical_model, f, indent=2)

        conn.close()

    def _create_quick_report(self):
        """Gyors jelentés készítése"""
        conn = sqlite3.connect(self.db_path)

        # Alapadatok
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM match_results")
        total_matches = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT home_team) + COUNT(DISTINCT away_team) FROM match_results")
        total_teams = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT league) FROM match_results")
        total_leagues = cursor.fetchone()[0]

        # Leggyakoribb eredmények
        top_results = pd.read_sql_query("""
            SELECT home_team, away_team, home_score, away_score, league
            FROM match_results
            ORDER BY RANDOM()
            LIMIT 5
        """, conn)

        conn.close()

        # Jelentés készítése
        report = f"""
🚀 GYORS FUTBALL ELEMZÉS JELENTÉS
================================
Dátum: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📊 ÖSSZEFOGLALÓ
---------------
• Összes meccs eredmény: {total_matches}
• Különböző csapatok: {total_teams}
• Különböző ligák: {total_leagues}
• Modell állapot: {'✅ Betanítva' if self.model else '📊 Statisztikai'}

🏆 MINTA EREDMÉNYEK
-------------------
"""

        for _, match in top_results.iterrows():
            report += f"• {match['home_team']} {match['home_score']}:{match['away_score']} {match['away_team']} ({match['league']})\n"

        report += f"""
✅ ELEMZÉS SIKERESEN BEFEJEZVE

📁 Létrehozott fájlok:
• quick_football.db - Adatbázis
• quick_football_model.pkl - ML modell (ha volt elég adat)
• statistical_model.json - Statisztikai modell
• quick_football_report.txt - Ez a jelentés
"""

        with open('quick_football_report.txt', 'w', encoding='utf-8') as f:
            f.write(report)

        print(report)

def main():
    """Gyors elemzés futtatása"""
    analyzer = QuickFootballAnalyzer()
    analyzer.run_analysis()

if __name__ == "__main__":
    main()

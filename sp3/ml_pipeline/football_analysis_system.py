#!/usr/bin/env python3
"""
🚀 FUTBALL ADATELEMZŐ ÉS ELŐREJELZŐ RENDSZER

Integrált pipeline:
1. PDF feldolgozás és adatkinyerés
2. Adatbázis tárolás
3. ML modell tanítás
4. Valós idejű előrejelzések
5. Eredmények követése
"""

import os
import sys
import json
import sqlite3
import pandas as pd
from datetime import datetime, timedelta
from enhanced_pdf_processor import EnhancedPDFProcessor
from football_prediction_model import FootballPredictionModel

class FootballAnalysisSystem:
    """
    Komplett futball elemző rendszer
    """

    def __init__(self, pdf_folder: str = "/home/bandi/Documents/code/2025/sp3/pdf"):
        self.pdf_folder = pdf_folder
        self.db_path = "football_master.db"

        # Komponensek
        self.pdf_processor = EnhancedPDFProcessor(self.db_path)
        self.ml_model = FootballPredictionModel(self.db_path)

        # Statisztikák
        self.stats = {
            'pdfs_processed': 0,
            'matches_extracted': 0,
            'predictions_made': 0,
            'model_accuracy': 0.0
        }

    def process_all_pdfs(self):
        """Minden PDF feldolgozása a mappából"""
        print("📁 PDF-ek keresése...")

        if not os.path.exists(self.pdf_folder):
            print(f"❌ PDF mappa nem található: {self.pdf_folder}")
            return False

        pdf_files = [f for f in os.listdir(self.pdf_folder) if f.endswith('.pdf')]

        if not pdf_files:
            print(f"❌ Nincs PDF fájl a mappában: {self.pdf_folder}")
            return False

        print(f"📄 {len(pdf_files)} PDF fájl található")

        total_results = 0
        total_stats = 0
        total_upcoming = 0

        for pdf_file in pdf_files:
            pdf_path = os.path.join(self.pdf_folder, pdf_file)
            print(f"\n🔍 Feldolgozás: {pdf_file}")

            try:
                # PDF feldolgozása
                text_content = self.pdf_processor.extract_text_with_structure(pdf_path)

                if text_content:
                    # Eredmények kinyerése
                    initial_results = len(self.pdf_processor.match_results)
                    initial_stats = len(self.pdf_processor.team_stats)
                    initial_upcoming = len(self.pdf_processor.upcoming_matches)

                    self.pdf_processor.extract_match_results_from_text(text_content)
                    self.pdf_processor.extract_upcoming_matches_from_text(text_content)

                    # Új adatok száma
                    new_results = len(self.pdf_processor.match_results) - initial_results
                    new_stats = len(self.pdf_processor.team_stats) - initial_stats
                    new_upcoming = len(self.pdf_processor.upcoming_matches) - initial_upcoming

                    total_results += new_results
                    total_stats += new_stats
                    total_upcoming += new_upcoming

                    print(f"✅ {new_results} eredmény, {new_stats} stat, {new_upcoming} jövőbeli meccs")

                    self.stats['pdfs_processed'] += 1

                else:
                    print(f"❌ Nem sikerült kinyerni: {pdf_file}")

            except Exception as e:
                print(f"❌ Hiba {pdf_file} feldolgozásakor: {e}")

        # Adatok mentése
        if total_results > 0 or total_stats > 0 or total_upcoming > 0:
            print(f"\n💾 Összesített adatok mentése...")
            self.pdf_processor.save_to_database()
            self.pdf_processor.export_to_csv()

            self.stats['matches_extracted'] = total_results

            print(f"✅ Összesen: {total_results} eredmény, {total_stats} stat, {total_upcoming} jövőbeli meccs")
            return True
        else:
            print("⚠️ Nem találtunk új adatokat")
            return False

    def train_prediction_model(self):
        """ML modell tanítása a összegyűjtött adatokon"""
        print("\n🤖 ML MODELL TANÍTÁSA")
        print("=" * 40)

        # Adatok betöltése
        self.ml_model.load_data_from_database()
        self.ml_model.load_additional_data()

        # Feature-ök létrehozása
        features = self.ml_model.create_features()

        if features is not None and len(features) >= 5:
            # Modell tanítása
            success = self.ml_model.train_models()

            if success:
                self.ml_model.save_model("football_master_model.pkl")
                self.stats['model_accuracy'] = self.ml_model.model_accuracy
                print(f"✅ Modell tanítása sikeres: {self.ml_model.model_accuracy:.1%}")
                return True
            else:
                print("❌ Modell tanítása sikertelen")
                return False
        else:
            print("❌ Nincs elegendő adat a modell tanításához")
            return False

    def predict_upcoming_matches(self):
        """Jövőbeli meccsek előrejelzése"""
        if self.ml_model.model_1x2 is None:
            print("❌ A modell még nincs betanítva")
            return

        print("\n🔮 JÖVŐBELI MECCSEK ELŐREJELZÉSE")
        print("=" * 40)

        # Adatbázisból jövőbeli meccsek lekérése
        conn = sqlite3.connect(self.db_path)
        upcoming_df = pd.read_sql_query(
            """SELECT DISTINCT home_team, away_team, league, odds_home, odds_draw, odds_away
               FROM upcoming_matches
               WHERE odds_home IS NOT NULL
               ORDER BY home_team""",
            conn
        )
        conn.close()

        if upcoming_df.empty:
            print("📭 Nincs jövőbeli meccs odds-okkal")
            return

        predictions = []

        for _, match in upcoming_df.iterrows():
            prediction = self.ml_model.predict_match(
                match['home_team'],
                match['away_team'],
                match.get('league')
            )

            if prediction:
                # Odds összehasonlítás
                actual_odds = {
                    'home': match.get('odds_home', 0),
                    'draw': match.get('odds_draw', 0),
                    'away': match.get('odds_away', 0)
                }

                # Value bet számítás
                value_bets = self._calculate_value_bets(prediction['probabilities'], actual_odds)

                prediction_data = {
                    'match': f"{match['home_team']} vs {match['away_team']}",
                    'prediction': prediction['predicted_result'],
                    'confidence': prediction['confidence'],
                    'probabilities': prediction['probabilities'],
                    'actual_odds': actual_odds,
                    'value_bets': value_bets
                }

                predictions.append(prediction_data)
                self.stats['predictions_made'] += 1

                print(f"\n💡 {prediction_data['match']}")
                print(f"   📊 Előrejelzés: {prediction_data['prediction']} ({prediction_data['confidence']:.1%})")

                if value_bets:
                    print(f"   💰 Value bet-ek: {', '.join(value_bets)}")

                print("-" * 30)

        # Előrejelzések mentése
        if predictions:
            self._save_predictions(predictions)
            print(f"✅ {len(predictions)} előrejelzés mentve")

    def _calculate_value_bets(self, predicted_probabilities, actual_odds):
        """Value bet-ek számítása"""
        value_bets = []

        # Implied probability vs predicted probability
        outcomes = [
            ('home_win', 'home', predicted_probabilities['home_win']),
            ('draw', 'draw', predicted_probabilities['draw']),
            ('away_win', 'away', predicted_probabilities['away_win'])
        ]

        for outcome_name, odds_key, predicted_prob in outcomes:
            actual_odd = actual_odds.get(odds_key, 0)

            if actual_odd > 1:  # Valid odds
                implied_prob = 1 / actual_odd

                # Value bet ha predicted > implied probability (+5% margin)
                if predicted_prob > implied_prob * 1.05:
                    value_percentage = ((predicted_prob / implied_prob) - 1) * 100
                    value_bets.append(f"{outcome_name} ({value_percentage:.1f}% value)")

        return value_bets

    def _save_predictions(self, predictions):
        """Előrejelzések mentése JSON-ba"""
        prediction_data = {
            'generated_at': datetime.now().isoformat(),
            'model_accuracy': self.stats['model_accuracy'],
            'predictions': predictions
        }

        with open('predictions.json', 'w', encoding='utf-8') as f:
            json.dump(prediction_data, f, indent=2, ensure_ascii=False)

    def analyze_team_performance(self, team_name):
        """Csapat teljesítmény elemzése"""
        print(f"\n📊 CSAPAT ELEMZÉS: {team_name}")
        print("=" * 40)

        conn = sqlite3.connect(self.db_path)

        # Meccs eredmények
        results_df = pd.read_sql_query(
            """SELECT * FROM match_results
               WHERE home_team = ? OR away_team = ?
               ORDER BY created_at DESC LIMIT 10""",
            conn, params=[team_name, team_name]
        )

        # Csapat statisztikák
        stats_df = pd.read_sql_query(
            """SELECT * FROM team_stats
               WHERE team_name = ?""",
            conn, params=[team_name]
        )

        conn.close()

        if results_df.empty:
            print(f"❌ Nincs adat {team_name} csapatról")
            return

        # Statisztikák számítása
        total_games = len(results_df)
        wins = 0
        draws = 0
        losses = 0
        goals_for = 0
        goals_against = 0

        for _, match in results_df.iterrows():
            home_score = match['home_score']
            away_score = match['away_score']

            if match['home_team'] == team_name:
                goals_for += home_score
                goals_against += away_score

                if home_score > away_score:
                    wins += 1
                elif home_score < away_score:
                    losses += 1
                else:
                    draws += 1
            else:
                goals_for += away_score
                goals_against += home_score

                if away_score > home_score:
                    wins += 1
                elif away_score < home_score:
                    losses += 1
                else:
                    draws += 1

        # Eredmények kiírása
        print(f"🏆 Meccsek: {total_games}")
        print(f"✅ Győzelmek: {wins} ({wins/total_games*100:.1f}%)")
        print(f"🤝 Döntetlenek: {draws} ({draws/total_games*100:.1f}%)")
        print(f"❌ Vereségek: {losses} ({losses/total_games*100:.1f}%)")
        print(f"⚽ Gólok: {goals_for}:{goals_against} ({goals_for/total_games:.1f} gól/meccs)")

        if not stats_df.empty:
            stat = stats_df.iloc[0]
            print(f"📈 Bajnoki pozíció: {stat.get('position', 'N/A')}")
            print(f"🏆 Pontok: {stat.get('points', 'N/A')}")

    def generate_summary_report(self):
        """Összefoglaló jelentés generálása"""
        print("\n📋 ÖSSZEFOGLALÓ JELENTÉS")
        print("=" * 50)

        # Adatbázis statisztikák
        conn = sqlite3.connect(self.db_path)

        results_count = pd.read_sql_query("SELECT COUNT(*) as count FROM match_results", conn).iloc[0]['count']
        teams_count = pd.read_sql_query("SELECT COUNT(DISTINCT team_name) as count FROM team_stats", conn).iloc[0]['count']
        leagues_count = pd.read_sql_query("SELECT COUNT(DISTINCT league) as count FROM team_stats", conn).iloc[0]['count']
        upcoming_count = pd.read_sql_query("SELECT COUNT(*) as count FROM upcoming_matches WHERE odds_home IS NOT NULL", conn).iloc[0]['count']

        conn.close()

        # Jelentés
        print(f"📄 Feldolgozott PDF-ek: {self.stats['pdfs_processed']}")
        print(f"⚽ Meccs eredmények: {results_count}")
        print(f"👥 Különböző csapatok: {teams_count}")
        print(f"🏟️ Különböző ligák: {leagues_count}")
        print(f"🔮 Jövőbeli meccsek: {upcoming_count}")
        print(f"🤖 Modell pontosság: {self.stats['model_accuracy']:.1%}")
        print(f"📊 Készített előrejelzések: {self.stats['predictions_made']}")

        # Fájlok listája
        print(f"\n📁 Generált fájlok:")
        files_to_check = [
            'football_master.db',
            'football_master_model.pkl',
            'predictions.json',
            'match_results.csv',
            'team_stats.csv',
            'upcoming_matches.csv'
        ]

        for file_name in files_to_check:
            if os.path.exists(file_name):
                size = os.path.getsize(file_name)
                print(f"   ✅ {file_name} ({size:,} bytes)")
            else:
                print(f"   ❌ {file_name} (nem létezik)")

def main():
    """Főprogram"""
    print("🚀 FUTBALL ADATELEMZŐ ÉS ELŐREJELZŐ RENDSZER")
    print("=" * 60)

    # Rendszer inicializálása
    system = FootballAnalysisSystem()

    # 1. PDF-ek feldolgozása
    print("\n1️⃣ PDF FELDOLGOZÁS")
    pdf_success = system.process_all_pdfs()

    if pdf_success:
        # 2. ML modell tanítása
        print("\n2️⃣ ML MODELL TANÍTÁSA")
        model_success = system.train_prediction_model()

        if model_success:
            # 3. Előrejelzések készítése
            print("\n3️⃣ ELŐREJELZÉSEK")
            system.predict_upcoming_matches()

            # 4. Csapat elemzések (példák)
            print("\n4️⃣ CSAPAT ELEMZÉSEK")
            example_teams = ["Dortmund", "Columbus", "Helsingborg"]

            for team in example_teams:
                system.analyze_team_performance(team)

        # 5. Összefoglaló jelentés
        print("\n5️⃣ ÖSSZEFOGLALÓ")
        system.generate_summary_report()

        print("\n✅ RENDSZER ELEMZÉS BEFEJEZVE!")
        print("📊 Részletes adatok: football_master.db")
        print("🤖 Modell: football_master_model.pkl")
        print("🔮 Előrejelzések: predictions.json")

    else:
        print("❌ PDF feldolgozás sikertelen, nem folytathatjuk")

if __name__ == "__main__":
    main()

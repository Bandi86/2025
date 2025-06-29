#!/usr/bin/env python3
"""
🚀 TELJES FUTBALL ELEMZŐ ÉS ELŐREJELZŐ PIPELINE

Komplex rendszer amely:
1. PDF-ekből kinyeri az összes futball adatot (eredmények, táblázatok, odds-ok)
2. Adatokat strukturáltan adatbázisba menti
3. ML modellt tanít az adatokból
4. Előrejelzéseket készít új meccsekre
5. Value bet-eket azonosít
6. Teljes elemzést nyújt
"""

import os
import sys
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import re
import json
import warnings
warnings.filterwarnings('ignore')

# Saját modulok
from advanced_football_extractor import AdvancedFootballExtractor

# ML imports
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

class ComprehensiveFootballPipeline:
    """
    Teljes futball elemző és előrejelző pipeline
    """

    def __init__(self, pdf_folder: str = "/home/bandi/Documents/code/2025/sp3/pdf"):
        self.pdf_folder = pdf_folder
        self.db_path = "comprehensive_football.db"

        # Komponensek
        self.extractor = AdvancedFootballExtractor(self.db_path)
        self.model = None
        self.label_encoders = {}
        self.scaler = StandardScaler()

        # Statisztikák
        self.stats = {
            'pdfs_processed': 0,
            'matches_extracted': 0,
            'teams_found': 0,
            'leagues_identified': 0,
            'model_accuracy': 0.0,
            'predictions_made': 0,
            'value_bets_found': 0
        }

    def run_full_pipeline(self) -> bool:
        """Teljes pipeline futtatása"""
        print("🚀 TELJES FUTBALL PIPELINE INDÍTÁSA")
        print("=" * 70)

        # 1. PDF-ek feldolgozása
        print("\n1️⃣ PDF ADATKINYERÉS")
        if not self._process_all_pdfs():
            print("❌ PDF feldolgozás sikertelen")
            return False

        # 2. Adatok tisztítása és validálása
        print("\n2️⃣ ADATTISZTÍTÁS ÉS VALIDÁLÁS")
        if not self._clean_and_validate_data():
            print("❌ Adattisztítás sikertelen")
            return False

        # 3. ML modell tanítása
        print("\n3️⃣ ML MODELL TANÍTÁSA")
        if not self._train_prediction_models():
            print("❌ Modell tanítás sikertelen")
            return False

        # 4. Jövőbeli meccsek előrejelzése
        print("\n4️⃣ ELŐREJELZÉSEK KÉSZÍTÉSE")
        self._make_predictions()

        # 5. Value bet-ek keresése
        print("\n5️⃣ VALUE BET ANALÍZIS")
        self._find_value_bets()

        # 6. Komplex jelentés készítése
        print("\n6️⃣ JELENTÉS GENERÁLÁSA")
        self._generate_comprehensive_report()

        print("\n✅ TELJES PIPELINE SIKERESEN BEFEJEZVE")
        return True

    def _process_all_pdfs(self) -> bool:
        """Minden PDF feldolgozása a mappából"""
        if not os.path.exists(self.pdf_folder):
            print(f"❌ PDF mappa nem található: {self.pdf_folder}")
            return False

        pdf_files = [f for f in os.listdir(self.pdf_folder) if f.endswith('.pdf')]

        if not pdf_files:
            print(f"❌ Nincs PDF fájl a mappában")
            return False

        print(f"📁 {len(pdf_files)} PDF fájl feldolgozása...")

        total_results = 0
        total_stats = 0
        total_upcoming = 0

        for pdf_file in pdf_files:
            pdf_path = os.path.join(self.pdf_folder, pdf_file)
            print(f"\n🔍 Feldolgozás: {pdf_file}")

            try:
                initial_results = len(self.extractor.match_results)
                initial_stats = len(self.extractor.team_stats)
                initial_upcoming = len(self.extractor.upcoming_matches)

                # PDF feldolgozása
                success = self.extractor.extract_comprehensive_data(pdf_path)

                if success:
                    new_results = len(self.extractor.match_results) - initial_results
                    new_stats = len(self.extractor.team_stats) - initial_stats
                    new_upcoming = len(self.extractor.upcoming_matches) - initial_upcoming

                    total_results += new_results
                    total_stats += new_stats
                    total_upcoming += new_upcoming

                    print(f"✅ +{new_results} eredmény, +{new_stats} stat, +{new_upcoming} upcoming")
                    self.stats['pdfs_processed'] += 1
                else:
                    print(f"⚠️ Részleges feldolgozás: {pdf_file}")

            except Exception as e:
                print(f"❌ Hiba {pdf_file}: {e}")
                continue

        # Adatok mentése
        self.extractor.save_all_data()
        self.extractor.export_comprehensive_data()

        self.stats['matches_extracted'] = total_results

        print(f"\n📊 Összesen: {total_results} eredmény, {total_stats} stat, {total_upcoming} upcoming")
        return total_results > 0

    def _clean_and_validate_data(self) -> bool:
        """Adatok tisztítása és validálása"""
        print("🧹 Adatok tisztítása...")

        # Duplikátumok eltávolítása adatbázisból
        conn = sqlite3.connect(self.db_path)

        # Meccs eredmények tisztítása
        cursor = conn.cursor()

        # Hendikep és odds sorok eltávolítása
        cursor.execute("""
            DELETE FROM match_results
            WHERE home_team LIKE '%Hendikep%'
            OR away_team LIKE '%Hendikep%'
            OR home_team LIKE '%Döntetlen%'
            OR away_team LIKE '%Döntetlen%'
            OR home_team LIKE '%Odds%'
            OR away_team LIKE '%Odds%'
            OR (home_score = 0 AND away_score = 0)
            OR home_team = away_team
        """)

        # Furcsa eredmények eltávolítása
        cursor.execute("""
            DELETE FROM match_results
            WHERE home_score > 10 OR away_score > 10
            OR LENGTH(home_team) < 3 OR LENGTH(away_team) < 3
        """)

        # Valódi eredmények számolása
        cursor.execute("SELECT COUNT(*) FROM match_results")
        clean_results = cursor.fetchone()[0]

        conn.commit()
        conn.close()

        print(f"✅ {clean_results} tisztított eredmény maradt")

        return clean_results > 5  # Minimum 5 valódi eredmény kell

    def _train_prediction_models(self) -> bool:
        """ML modellek tanítása"""
        print("🤖 ML modellek tanítása...")

        # Adatok betöltése
        df = self._prepare_training_data()

        if df is None or len(df) < 10:
            print("❌ Nincs elég adat a modell tanításához")
            return False

        print(f"📊 Tanítási adatok: {len(df)} meccs")

        # Feature engineering
        X, y = self._create_features(df)

        if X is None or len(X) == 0:
            print("❌ Feature-ök létrehozása sikertelen")
            return False

        # Train-test split - stratify csak ha minden osztályból van legalább 2
        unique, counts = np.unique(y, return_counts=True)
        min_count = min(counts)

        if min_count >= 2:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
        else:
            print(f"⚠️ Kis adathalmaz, stratifikáció nélkül: {dict(zip(unique, counts))}")
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

        # Több modell tanítása és összehasonlítása
        models = {
            'RandomForest': RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42),  # Egyszerűbb paraméterek
            'LogisticRegression': LogisticRegression(random_state=42, max_iter=1000, C=1.0)
        }

        # Ha túl kicsi az adathalmaz, csak LogisticRegression-t használjunk
        if len(X_train) < 20:
            models = {'LogisticRegression': LogisticRegression(random_state=42, max_iter=1000, C=1.0)}

        best_accuracy = 0
        best_model_name = None

        for name, model in models.items():
            print(f"🔧 {name} tanítása...")

            try:
                model.fit(X_train, y_train)
                predictions = model.predict(X_test)
                accuracy = accuracy_score(y_test, predictions)

                print(f"   {name} pontosság: {accuracy:.3f}")

                if accuracy > best_accuracy:
                    best_accuracy = accuracy
                    best_model_name = name
                    self.model = model

            except Exception as e:
                print(f"   ❌ {name} hiba: {e}")
                continue

        if self.model is not None:
            self.stats['model_accuracy'] = best_accuracy

            # Modell mentése
            model_data = {
                'model': self.model,
                'encoders': self.label_encoders,
                'scaler': self.scaler,
                'accuracy': best_accuracy,
                'model_type': best_model_name
            }
            joblib.dump(model_data, 'comprehensive_football_model.pkl')

            print(f"✅ Legjobb modell: {best_model_name} ({best_accuracy:.3f})")
            return True

        return False

    def _prepare_training_data(self) -> Optional[pd.DataFrame]:
        """Tanítási adatok előkészítése"""
        conn = sqlite3.connect(self.db_path)

        # Meccs eredmények betöltése
        df = pd.read_sql_query("""
            SELECT home_team, away_team, home_score, away_score, league, date
            FROM match_results
            WHERE home_team IS NOT NULL
            AND away_team IS NOT NULL
            AND league IS NOT NULL
            ORDER BY date DESC
        """, conn)

        conn.close()

        if df.empty:
            return None

        # Eredmény címke létrehozása (1: hazai győzelem, X: döntetlen, 2: vendég győzelem)
        def get_result(row):
            if row['home_score'] > row['away_score']:
                return '1'
            elif row['home_score'] < row['away_score']:
                return '2'
            else:
                return 'X'

        df['result'] = df.apply(get_result, axis=1)

        return df

    def _create_features(self, df: pd.DataFrame) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """Feature-ök létrehozása ML modellhez"""
        print("🔧 Feature engineering...")

        features = []
        labels = []

        # Label encoder-ek inicializálása
        if 'home_team' not in self.label_encoders:
            self.label_encoders['home_team'] = LabelEncoder()
            self.label_encoders['away_team'] = LabelEncoder()
            self.label_encoders['league'] = LabelEncoder()

        # Összes csapat és liga összegyűjtése
        all_teams = list(df['home_team'].unique()) + list(df['away_team'].unique())
        all_teams = list(set(all_teams))
        all_leagues = df['league'].unique()

        # Encoder-ek fit-elése
        self.label_encoders['home_team'].fit(all_teams)
        self.label_encoders['away_team'].fit(all_teams)
        self.label_encoders['league'].fit(all_leagues)

        # Feature-ök generálása minden meccshez
        for idx, row in df.iterrows():
            try:
                feature_vector = []

                # 1. Csapat ID-k
                home_id = self.label_encoders['home_team'].transform([row['home_team']])[0]
                away_id = self.label_encoders['away_team'].transform([row['away_team']])[0]
                league_id = self.label_encoders['league'].transform([row['league']])[0]

                feature_vector.extend([home_id, away_id, league_id])

                # 2. Történelmi adatok (korábbi meccsek alapján)
                home_stats = self._get_team_historical_stats(df, row['home_team'], idx)
                away_stats = self._get_team_historical_stats(df, row['away_team'], idx)

                feature_vector.extend(home_stats)
                feature_vector.extend(away_stats)

                # 3. H2H (Head-to-Head) statisztikák
                h2h_stats = self._get_h2h_stats(df, row['home_team'], row['away_team'], idx)
                feature_vector.extend(h2h_stats)

                # 4. Liga erősség
                league_strength = self._get_league_strength(row['league'])
                feature_vector.append(league_strength)

                features.append(feature_vector)
                labels.append(row['result'])

            except Exception as e:
                print(f"⚠️ Feature hiba {idx}: {e}")
                continue

        if not features:
            return None, None

        X = np.array(features)
        y = np.array(labels)

        # Scaling
        X = self.scaler.fit_transform(X)

        print(f"✅ {len(features)} feature vektor létrehozva")
        return X, y

    def _get_team_historical_stats(self, df: pd.DataFrame, team: str, current_idx: int) -> List[float]:
        """Csapat történelmi statisztikái"""
        # Csak a korábbi meccseket nézzük
        historical_matches = df[:current_idx]

        # Csapat meccsai (hazai és vendég)
        team_matches = historical_matches[
            (historical_matches['home_team'] == team) |
            (historical_matches['away_team'] == team)
        ]

        if len(team_matches) == 0:
            return [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]  # wins, draws, losses, goals_for, goals_against, avg_goals

        wins = 0
        draws = 0
        losses = 0
        goals_for = 0
        goals_against = 0

        for _, match in team_matches.iterrows():
            if match['home_team'] == team:
                # Hazai meccs
                team_goals = match['home_score']
                opponent_goals = match['away_score']
            else:
                # Vendég meccs
                team_goals = match['away_score']
                opponent_goals = match['home_score']

            goals_for += team_goals
            goals_against += opponent_goals

            if team_goals > opponent_goals:
                wins += 1
            elif team_goals < opponent_goals:
                losses += 1
            else:
                draws += 1

        total_matches = len(team_matches)
        win_rate = wins / total_matches if total_matches > 0 else 0
        avg_goals_for = goals_for / total_matches if total_matches > 0 else 0
        avg_goals_against = goals_against / total_matches if total_matches > 0 else 0

        return [win_rate, wins, draws, losses, avg_goals_for, avg_goals_against]

    def _get_h2h_stats(self, df: pd.DataFrame, home_team: str, away_team: str, current_idx: int) -> List[float]:
        """Head-to-Head statisztikák"""
        historical_matches = df[:current_idx]

        # H2H meccsek keresése
        h2h_matches = historical_matches[
            ((historical_matches['home_team'] == home_team) & (historical_matches['away_team'] == away_team)) |
            ((historical_matches['home_team'] == away_team) & (historical_matches['away_team'] == home_team))
        ]

        if len(h2h_matches) == 0:
            return [0.0, 0.0, 0.0]  # home_wins, draws, away_wins

        home_wins = 0
        draws = 0
        away_wins = 0

        for _, match in h2h_matches.iterrows():
            if match['home_team'] == home_team:
                # home_team hazai pályán
                if match['home_score'] > match['away_score']:
                    home_wins += 1
                elif match['home_score'] < match['away_score']:
                    away_wins += 1
                else:
                    draws += 1
            else:
                # home_team vendégben
                if match['away_score'] > match['home_score']:
                    home_wins += 1
                elif match['away_score'] < match['home_score']:
                    away_wins += 1
                else:
                    draws += 1

        total = len(h2h_matches)
        return [home_wins/total, draws/total, away_wins/total]

    def _get_league_strength(self, league: str) -> float:
        """Liga erősség becslése"""
        league_strengths = {
            "Premier League": 1.0,
            "La Liga": 0.95,
            "Bundesliga": 0.90,
            "Serie A": 0.85,
            "Ligue 1": 0.80,
            "Champions League": 1.0,
            "Europa League": 0.75,
            "Magyar NB I": 0.40,
            "Championship": 0.65,
            "Eredivisie": 0.70,
        }

        return league_strengths.get(league, 0.50)

    def _make_predictions(self):
        """Előrejelzések készítése jövőbeli meccsekre"""
        if self.model is None:
            print("❌ Nincs betanított modell")
            return

        print("🔮 Jövőbeli meccsek előrejelzése...")

        # Jövőbeli meccsek betöltése
        conn = sqlite3.connect(self.db_path)
        upcoming_df = pd.read_sql_query("""
            SELECT home_team, away_team, league, odds_home, odds_draw, odds_away
            FROM upcoming_matches
            WHERE odds_home IS NOT NULL
        """, conn)
        conn.close()

        if upcoming_df.empty:
            print("📝 Nincs jövőbeli meccs odds-okkal")
            return

        predictions = []

        for idx, match in upcoming_df.iterrows():
            try:
                # Feature-ök létrehozása
                prediction_features = self._create_prediction_features(match)

                if prediction_features is not None:
                    # Előrejelzés
                    pred_proba = self.model.predict_proba([prediction_features])[0]
                    predicted_class = self.model.predict([prediction_features])[0]

                    # Eredmény értelmezése
                    result_map = {'1': 'Hazai győzelem', 'X': 'Döntetlen', '2': 'Vendég győzelem'}

                    prediction = {
                        'home_team': match['home_team'],
                        'away_team': match['away_team'],
                        'predicted_result': result_map.get(predicted_class, predicted_class),
                        'confidence': max(pred_proba),
                        'probabilities': {
                            'home_win': pred_proba[2] if len(pred_proba) > 2 else 0,  # '1'
                            'draw': pred_proba[1] if len(pred_proba) > 1 else 0,      # 'X'
                            'away_win': pred_proba[0] if len(pred_proba) > 0 else 0   # '2'
                        },
                        'odds': {
                            'home': match['odds_home'],
                            'draw': match['odds_draw'],
                            'away': match['odds_away']
                        }
                    }

                    predictions.append(prediction)
                    self.stats['predictions_made'] += 1

                    print(f"🎯 {match['home_team']} vs {match['away_team']}: {prediction['predicted_result']} ({prediction['confidence']:.2f})")

            except Exception as e:
                print(f"⚠️ Előrejelzés hiba: {e}")
                continue

        # Előrejelzések mentése
        if predictions:
            with open('comprehensive_predictions.json', 'w', encoding='utf-8') as f:
                json.dump(predictions, f, indent=2, ensure_ascii=False)
            print(f"✅ {len(predictions)} előrejelzés mentve")

    def _create_prediction_features(self, match_row) -> Optional[List[float]]:
        """Feature vektor létrehozása előrejelzéshez"""
        try:
            # Történelmi adatok betöltése
            conn = sqlite3.connect(self.db_path)
            df = pd.read_sql_query("""
                SELECT home_team, away_team, home_score, away_score, league, date
                FROM match_results
                ORDER BY date DESC
            """, conn)
            conn.close()

            feature_vector = []

            # Csapat ID-k
            try:
                home_id = self.label_encoders['home_team'].transform([match_row['home_team']])[0]
                away_id = self.label_encoders['away_team'].transform([match_row['away_team']])[0]
                league_id = self.label_encoders['league'].transform([match_row['league']])[0]
            except ValueError:
                # Új csapat/liga, átlagos értékekkel helyettesítjük
                home_id = 0
                away_id = 1
                league_id = 0

            feature_vector.extend([home_id, away_id, league_id])

            # Történelmi statisztikák
            home_stats = self._get_team_historical_stats(df, match_row['home_team'], len(df))
            away_stats = self._get_team_historical_stats(df, match_row['away_team'], len(df))

            feature_vector.extend(home_stats)
            feature_vector.extend(away_stats)

            # H2H
            h2h_stats = self._get_h2h_stats(df, match_row['home_team'], match_row['away_team'], len(df))
            feature_vector.extend(h2h_stats)

            # Liga erősség
            league_strength = self._get_league_strength(match_row['league'])
            feature_vector.append(league_strength)

            # Scaling
            feature_vector = self.scaler.transform([feature_vector])[0]

            return feature_vector.tolist()

        except Exception as e:
            print(f"⚠️ Prediction feature hiba: {e}")
            return None

    def _find_value_bets(self):
        """Value bet-ek keresése"""
        print("💰 Value bet analízis...")

        try:
            with open('comprehensive_predictions.json', 'r', encoding='utf-8') as f:
                predictions = json.load(f)
        except:
            print("❌ Nincs előrejelzés fájl")
            return

        value_bets = []

        for pred in predictions:
            try:
                # Várt értékek számítása
                model_probs = pred['probabilities']
                odds = pred['odds']

                # Value számítás minden kimenetelre
                home_value = (model_probs['home_win'] * odds['home']) - 1
                draw_value = (model_probs['draw'] * odds['draw']) - 1
                away_value = (model_probs['away_win'] * odds['away']) - 1

                # Value bet threshold (5% felett)
                threshold = 0.05

                if home_value > threshold:
                    value_bets.append({
                        'match': f"{pred['home_team']} vs {pred['away_team']}",
                        'bet_type': 'Hazai győzelem',
                        'odds': odds['home'],
                        'model_probability': model_probs['home_win'],
                        'value': home_value,
                        'confidence': pred['confidence']
                    })

                if draw_value > threshold:
                    value_bets.append({
                        'match': f"{pred['home_team']} vs {pred['away_team']}",
                        'bet_type': 'Döntetlen',
                        'odds': odds['draw'],
                        'model_probability': model_probs['draw'],
                        'value': draw_value,
                        'confidence': pred['confidence']
                    })

                if away_value > threshold:
                    value_bets.append({
                        'match': f"{pred['home_team']} vs {pred['away_team']}",
                        'bet_type': 'Vendég győzelem',
                        'odds': odds['away'],
                        'model_probability': model_probs['away_win'],
                        'value': away_value,
                        'confidence': pred['confidence']
                    })

            except Exception as e:
                print(f"⚠️ Value bet hiba: {e}")
                continue

        # Value bet-ek rendezése érték szerint
        value_bets.sort(key=lambda x: x['value'], reverse=True)

        if value_bets:
            print(f"💎 {len(value_bets)} value bet találva")
            for bet in value_bets[:5]:  # Top 5
                print(f"   💰 {bet['match']}: {bet['bet_type']} ({bet['odds']:.2f}) - Value: {bet['value']:.1%}")

            # Value bet-ek mentése
            with open('value_bets.json', 'w', encoding='utf-8') as f:
                json.dump(value_bets, f, indent=2, ensure_ascii=False)

            self.stats['value_bets_found'] = len(value_bets)
        else:
            print("📝 Nem találhatóak value bet-ek")

    def _generate_comprehensive_report(self):
        """Komplex jelentés generálása"""
        print("📊 Komplex jelentés készítése...")

        report = {
            'timestamp': datetime.now().isoformat(),
            'pipeline_stats': self.stats,
            'data_summary': self._get_data_summary(),
            'model_performance': self._get_model_performance(),
            'predictions_summary': self._get_predictions_summary(),
            'value_bets_summary': self._get_value_bets_summary()
        }

        # Jelentés mentése JSON-ba
        with open('comprehensive_football_report.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        # Ember-olvasható jelentés
        self._create_readable_report(report)

        print("✅ Komplex jelentés elkészült")

    def _get_data_summary(self) -> Dict:
        """Adatok összefoglalása"""
        conn = sqlite3.connect(self.db_path)

        # Alapstatisztikák
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM match_results")
        total_matches = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT home_team) + COUNT(DISTINCT away_team) FROM match_results")
        total_teams = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT league) FROM match_results")
        total_leagues = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM upcoming_matches WHERE odds_home IS NOT NULL")
        upcoming_with_odds = cursor.fetchone()[0]

        # Liga statisztikák
        cursor.execute("""
            SELECT league, COUNT(*) as matches
            FROM match_results
            GROUP BY league
            ORDER BY matches DESC
        """)
        league_stats = dict(cursor.fetchall())

        conn.close()

        return {
            'total_matches': total_matches,
            'total_teams': total_teams,
            'total_leagues': total_leagues,
            'upcoming_with_odds': upcoming_with_odds,
            'league_distribution': league_stats
        }

    def _get_model_performance(self) -> Dict:
        """Modell teljesítmény adatok"""
        if self.model is None:
            return {'error': 'Nincs betanított modell'}

        return {
            'accuracy': self.stats['model_accuracy'],
            'model_type': getattr(self.model, '__class__', {}).get('__name__', 'Unknown'),
            'feature_count': len(self.label_encoders) * 2 + 10  # Becsült feature szám
        }

    def _get_predictions_summary(self) -> Dict:
        """Előrejelzések összefoglalása"""
        try:
            with open('comprehensive_predictions.json', 'r', encoding='utf-8') as f:
                predictions = json.load(f)

            if not predictions:
                return {'total': 0}

            # Eredmény típusok számolása
            result_types = {}
            confidence_levels = []

            for pred in predictions:
                result = pred['predicted_result']
                result_types[result] = result_types.get(result, 0) + 1
                confidence_levels.append(pred['confidence'])

            return {
                'total': len(predictions),
                'result_distribution': result_types,
                'average_confidence': sum(confidence_levels) / len(confidence_levels),
                'high_confidence_count': len([c for c in confidence_levels if c > 0.7])
            }

        except:
            return {'total': 0, 'error': 'Nincs előrejelzés adat'}

    def _get_value_bets_summary(self) -> Dict:
        """Value bet-ek összefoglalása"""
        try:
            with open('value_bets.json', 'r', encoding='utf-8') as f:
                value_bets = json.load(f)

            if not value_bets:
                return {'total': 0}

            # Bet típusok és értékek
            bet_types = {}
            values = []

            for bet in value_bets:
                bet_type = bet['bet_type']
                bet_types[bet_type] = bet_types.get(bet_type, 0) + 1
                values.append(bet['value'])

            return {
                'total': len(value_bets),
                'bet_type_distribution': bet_types,
                'average_value': sum(values) / len(values),
                'max_value': max(values),
                'high_value_count': len([v for v in values if v > 0.1])
            }

        except:
            return {'total': 0, 'error': 'Nincs value bet adat'}

    def _create_readable_report(self, report: Dict):
        """Ember-olvasható jelentés készítése"""

        readable_report = f"""
🚀 KOMPLEX FUTBALL ELEMZŐ PIPELINE JELENTÉS
==========================================
Készítve: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📊 ADATOK ÖSSZEFOGLALÓJA
------------------------
• Feldolgozott PDF-ek: {report['pipeline_stats']['pdfs_processed']}
• Kinyert meccs eredmények: {report['data_summary']['total_matches']}
• Azonosított csapatok: {report['data_summary']['total_teams']}
• Azonosított ligák: {report['data_summary']['total_leagues']}
• Jövőbeli meccsek odds-okkal: {report['data_summary']['upcoming_with_odds']}

🏟️ LIGA ELOSZLÁS
-----------------
"""

        for league, count in report['data_summary']['league_distribution'].items():
            readable_report += f"• {league}: {count} meccs\n"

        readable_report += f"""
🤖 MODELL TELJESÍTMÉNY
----------------------
• Pontosság: {report['model_performance'].get('accuracy', 0):.1%}
• Modell típus: {report['model_performance'].get('model_type', 'N/A')}

🔮 ELŐREJELZÉSEK
----------------
• Összes előrejelzés: {report['predictions_summary']['total']}
• Átlagos biztonság: {report['predictions_summary'].get('average_confidence', 0):.1%}
• Magas biztonságú előrejelzések: {report['predictions_summary'].get('high_confidence_count', 0)}

💰 VALUE BET-EK
---------------
• Összes value bet: {report['value_bets_summary']['total']}
• Átlagos value: {report['value_bets_summary'].get('average_value', 0):.1%}
• Magas value bet-ek (>10%): {report['value_bets_summary'].get('high_value_count', 0)}

✅ PIPELINE SIKERESEN BEFEJEZVE
"""

        with open('readable_football_report.txt', 'w', encoding='utf-8') as f:
            f.write(readable_report)

        print(readable_report)


def main():
    """Teljes pipeline futtatása"""
    print("🚀 KOMPLEX FUTBALL ELEMZŐ ÉS ELŐREJELZŐ PIPELINE")
    print("=" * 70)

    pipeline = ComprehensiveFootballPipeline()

    try:
        success = pipeline.run_full_pipeline()

        if success:
            print("\n🎉 PIPELINE SIKERESEN BEFEJEZVE!")
            print("\n📁 Generált fájlok:")
            print("   📊 comprehensive_match_results.csv")
            print("   📊 comprehensive_team_stats.csv")
            print("   📊 comprehensive_upcoming_matches.csv")
            print("   🤖 comprehensive_football_model.pkl")
            print("   🔮 comprehensive_predictions.json")
            print("   💰 value_bets.json")
            print("   📋 comprehensive_football_report.json")
            print("   📄 readable_football_report.txt")
            print("   🗃️ comprehensive_football.db")
        else:
            print("\n❌ PIPELINE HIBA!")

    except Exception as e:
        print(f"\n💥 KRITIKUS HIBA: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

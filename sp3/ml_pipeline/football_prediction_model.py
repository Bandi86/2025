import pandas as pd
import numpy as np
import sqlite3
import json
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import pickle
import warnings
warnings.filterwarnings('ignore')

class FootballPredictionModel:
    """
    Intelligens futball előrejelző modell

    Felhasználja:
    - Meccs eredményeket
    - Bajnoki táblázatokat
    - Csapat statisztikákat
    - Historikus odds adatokat
    """

    def __init__(self, db_path: str = "football_data.db"):
        self.db_path = db_path
        self.model_1x2 = None  # 1X2 eredmény előrejelzése
        self.model_odds = None  # Odds becslése
        self.label_encoders = {}
        self.feature_stats = {}

        # Modell teljesítmény metrikák
        self.model_accuracy = 0.0
        self.predictions_made = 0

    def load_data_from_database(self):
        """Adatok betöltése SQLite adatbázisból"""
        print("📊 Adatok betöltése adatbázisból...")

        conn = sqlite3.connect(self.db_path)

        # Meccs eredmények
        self.match_results = pd.read_sql_query(
            "SELECT * FROM match_results ORDER BY created_at", conn
        )

        # Csapat statisztikák
        self.team_stats = pd.read_sql_query(
            "SELECT * FROM team_stats ORDER BY updated_at", conn
        )

        # Jövőbeli meccsek odds-okkal
        self.upcoming_matches = pd.read_sql_query(
            "SELECT * FROM upcoming_matches WHERE odds_home IS NOT NULL", conn
        )

        conn.close()

        print(f"✅ Betöltve: {len(self.match_results)} eredmény, {len(self.team_stats)} stat, {len(self.upcoming_matches)} odds")

    def load_additional_data(self):
        """További adatok betöltése CSV-ből"""
        print("📁 További adatok betöltése...")

        try:
            import os
            # Kinyert meccsek (odds nélkül is)
            if os.path.exists('extracted_matches.csv'):
                extracted = pd.read_csv('extracted_matches.csv')
                print(f"📄 Kinyert meccsek: {len(extracted)}")

                # Eredményes meccsek szűrése
                result_matches = extracted[
                    extracted['raw_line'].str.contains(r'\d+:\d+', regex=True, na=False)
                ]

                if not result_matches.empty:
                    self._parse_extracted_results(result_matches)

        except Exception as e:
            print(f"⚠️ További adatok betöltési hiba: {e}")

    def _parse_extracted_results(self, extracted_df):
        """Kinyert eredmények feldolgozása"""
        print("🔍 Kinyert eredmények elemzése...")

        additional_results = []

        for _, row in extracted_df.iterrows():
            raw_line = str(row['raw_line'])

            # Eredmény pattern keresése
            import re
            score_match = re.search(r'(\d+):(\d+)', raw_line)

            if score_match:
                home_score = int(score_match.group(1))
                away_score = int(score_match.group(2))

                # Csapat nevek kinyerése
                teams = raw_line.split(' - ')
                if len(teams) >= 2:
                    home_team = teams[0].strip()
                    away_part = teams[1].strip()

                    # Away csapat név tisztítása (eredmény eltávolítása)
                    away_team = re.sub(r'\s*\d+:\d+.*', '', away_part).strip()

                    if len(home_team) > 2 and len(away_team) > 2:
                        additional_results.append({
                            'home_team': home_team,
                            'away_team': away_team,
                            'home_score': home_score,
                            'away_score': away_score,
                            'date': row.get('date', '2025-06-27'),
                            'league': self._estimate_league(home_team)
                        })

        if additional_results:
            additional_df = pd.DataFrame(additional_results)
            self.match_results = pd.concat([self.match_results, additional_df], ignore_index=True)
            print(f"✅ {len(additional_results)} további eredmény hozzáadva")

    def create_features(self):
        """ML feature-ök létrehozása"""
        print("🔧 Feature-ök létrehozása...")

        if self.match_results.empty:
            print("❌ Nincs elegendő adat a feature-ökhöz")
            return None

        # Előzetesen felépítjük az encoder-eket
        all_teams = list(self.match_results['home_team'].unique()) + list(self.match_results['away_team'].unique())
        all_teams = list(set(all_teams))  # Duplikátumok eltávolítása

        all_leagues = list(self.match_results['league'].unique()) if 'league' in self.match_results.columns else ['Unknown League']

        self.label_encoders['team'] = LabelEncoder()
        self.label_encoders['team'].fit(all_teams)

        self.label_encoders['league'] = LabelEncoder()
        self.label_encoders['league'].fit(all_leagues)

        features = []

        for _, match in self.match_results.iterrows():
            home_team = match['home_team']
            away_team = match['away_team']

            # Alapvető feature-ök
            feature_row = {
                'home_team_encoded': self._encode_team(home_team),
                'away_team_encoded': self._encode_team(away_team),
                'league_encoded': self._encode_league(match.get('league', 'Unknown')),
            }

            # Csapat statisztikák hozzáadása
            home_stats = self._get_team_stats(home_team)
            away_stats = self._get_team_stats(away_team)

            feature_row.update({
                'home_team_form': home_stats.get('form_score', 0.5),
                'away_team_form': away_stats.get('form_score', 0.5),
                'home_team_strength': home_stats.get('strength', 0.5),
                'away_team_strength': away_stats.get('strength', 0.5),
                'strength_difference': home_stats.get('strength', 0.5) - away_stats.get('strength', 0.5),
            })

            # Historikus H2H adatok
            h2h_stats = self._get_h2h_stats(home_team, away_team)
            feature_row.update({
                'h2h_home_wins': h2h_stats.get('home_wins', 0),
                'h2h_away_wins': h2h_stats.get('away_wins', 0),
                'h2h_draws': h2h_stats.get('draws', 0),
                'h2h_total_games': h2h_stats.get('total_games', 0),
            })

            # Target változók (eredmények)
            home_score = match.get('home_score', 0)
            away_score = match.get('away_score', 0)

            if home_score > away_score:
                result = 1  # Hazai győzelem
            elif home_score < away_score:
                result = 2  # Idegen győzelem
            else:
                result = 0  # Döntetlen

            feature_row['result'] = result
            feature_row['total_goals'] = home_score + away_score
            feature_row['goal_difference'] = home_score - away_score

            features.append(feature_row)

        self.features_df = pd.DataFrame(features)
        print(f"✅ {len(features)} feature sor létrehozva")

        return self.features_df

    def _encode_team(self, team_name):
        """Csapat név enkódolása"""
        if 'team' not in self.label_encoders:
            self.label_encoders['team'] = LabelEncoder()

        try:
            return self.label_encoders['team'].transform([team_name])[0]
        except:
            # Új csapat - újra tanítjuk az encoder-t
            if hasattr(self.label_encoders['team'], 'classes_'):
                all_teams = list(self.label_encoders['team'].classes_) + [team_name]
            else:
                all_teams = [team_name]
            self.label_encoders['team'].fit(all_teams)
            return self.label_encoders['team'].transform([team_name])[0]

    def _encode_league(self, league_name):
        """Liga név enkódolása"""
        if 'league' not in self.label_encoders:
            self.label_encoders['league'] = LabelEncoder()

        try:
            return self.label_encoders['league'].transform([league_name])[0]
        except:
            # Új liga
            if hasattr(self.label_encoders['league'], 'classes_'):
                all_leagues = list(self.label_encoders['league'].classes_) + [league_name]
            else:
                all_leagues = [league_name]
            self.label_encoders['league'].fit(all_leagues)
            return self.label_encoders['league'].transform([league_name])[0]

    def _get_team_stats(self, team_name):
        """Csapat statisztikák lekérése"""
        team_stats = self.team_stats[self.team_stats['team_name'] == team_name]

        if team_stats.empty:
            return {
                'form_score': 0.5,
                'strength': 0.5,
                'points_per_game': 1.0
            }

        stats = team_stats.iloc[0]

        # Form score számítása (pont/meccs alapon)
        matches_played = max(stats.get('matches_played', 1), 1)
        points = stats.get('points', 0)
        form_score = min(points / (matches_played * 3), 1.0)

        # Csapat erősség (gólkülönbség és pozíció alapján)
        goal_diff = stats.get('goal_difference', 0)
        position = stats.get('position', 10)

        # Normalizált erősség (0-1 skála)
        strength = max(0.1, min(0.9, (20 - position) / 20 + goal_diff / 100))

        return {
            'form_score': form_score,
            'strength': strength,
            'points_per_game': points / matches_played if matches_played > 0 else 1.0
        }

    def _get_h2h_stats(self, home_team, away_team):
        """Head-to-Head statisztikák"""
        h2h_matches = self.match_results[
            ((self.match_results['home_team'] == home_team) &
             (self.match_results['away_team'] == away_team)) |
            ((self.match_results['home_team'] == away_team) &
             (self.match_results['away_team'] == home_team))
        ]

        if h2h_matches.empty:
            return {'home_wins': 0, 'away_wins': 0, 'draws': 0, 'total_games': 0}

        home_wins = 0
        away_wins = 0
        draws = 0

        for _, match in h2h_matches.iterrows():
            home_score = match.get('home_score', 0)
            away_score = match.get('away_score', 0)

            if match['home_team'] == home_team:
                if home_score > away_score:
                    home_wins += 1
                elif home_score < away_score:
                    away_wins += 1
                else:
                    draws += 1
            else:  # Fordított
                if home_score > away_score:
                    away_wins += 1
                elif home_score < away_score:
                    home_wins += 1
                else:
                    draws += 1

        return {
            'home_wins': home_wins,
            'away_wins': away_wins,
            'draws': draws,
            'total_games': len(h2h_matches)
        }

    def _estimate_league(self, team_name):
        """Liga becslése csapat név alapján"""
        team_name_lower = team_name.lower()

        # Magyar csapatok
        if any(hungarian in team_name_lower for hungarian in ['ferencváros', 'fradi', 'ftc', 'újpest', 'honvéd', 'mtk', 'debrecen']):
            return "Magyar NB I"

        # Premier League
        if any(epl in team_name_lower for epl in ['arsenal', 'chelsea', 'liverpool', 'manchester', 'tottenham', 'city', 'united']):
            return "Premier League"

        # MLS
        if any(mls in team_name_lower for mls in ['mls', 'atlanta', 'columbus', 'chicago', 'philadelphia', 'vancouver']):
            return "MLS"

        # Bundesliga
        if any(bundesliga in team_name_lower for bundesliga in ['dortmund', 'bayern', 'leipzig', 'frankfurt']):
            return "Bundesliga"

        return "Unknown League"

    def train_models(self):
        """ML modellek tanítása"""
        print("🤖 ML modellek tanítása...")

        if self.features_df is None or self.features_df.empty:
            print("❌ Nincs elegendő adat a tanításhoz")
            return False

        # Feature-ök és target változók elkülönítése
        feature_columns = [col for col in self.features_df.columns
                          if col not in ['result', 'total_goals', 'goal_difference']]

        X = self.features_df[feature_columns]
        y_result = self.features_df['result']  # 1X2 eredmény

        if len(X) < 5:
            print("❌ Túl kevés adat a tanításhoz (minimum 5 meccs szükséges)")
            return False

        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_result, test_size=0.2, random_state=42, stratify=y_result
        )

        # 1X2 eredmény modell
        self.model_1x2 = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )

        self.model_1x2.fit(X_train, y_train)

        # Modell értékelése
        y_pred = self.model_1x2.predict(X_test)
        self.model_accuracy = accuracy_score(y_test, y_pred)

        print(f"✅ Modell pontossága: {self.model_accuracy:.2%}")
        print("\n📊 Részletes jelentés:")
        print(classification_report(y_test, y_pred,
                                  target_names=['Döntetlen', 'Hazai győzelem', 'Idegen győzelem']))

        # Feature fontosság
        feature_importance = pd.DataFrame({
            'feature': feature_columns,
            'importance': self.model_1x2.feature_importances_
        }).sort_values('importance', ascending=False)

        print("\n🎯 Legfontosabb feature-ök:")
        print(feature_importance.head(5).to_string(index=False))

        return True

    def predict_match(self, home_team, away_team, league=None):
        """Meccs eredmény előrejelzése"""
        if self.model_1x2 is None:
            print("❌ A modell még nincs betanítva")
            return None

        print(f"🔮 Előrejelzés: {home_team} vs {away_team}")

        # Feature-ök létrehozása az új meccshez
        feature_row = {
            'home_team_encoded': self._encode_team(home_team),
            'away_team_encoded': self._encode_team(away_team),
            'league_encoded': self._encode_league(league or 'Unknown League'),
        }

        # Csapat statisztikák
        home_stats = self._get_team_stats(home_team)
        away_stats = self._get_team_stats(away_team)

        feature_row.update({
            'home_team_form': home_stats.get('form_score', 0.5),
            'away_team_form': away_stats.get('form_score', 0.5),
            'home_team_strength': home_stats.get('strength', 0.5),
            'away_team_strength': away_stats.get('strength', 0.5),
            'strength_difference': home_stats.get('strength', 0.5) - away_stats.get('strength', 0.5),
        })

        # H2H statisztikák
        h2h_stats = self._get_h2h_stats(home_team, away_team)
        feature_row.update({
            'h2h_home_wins': h2h_stats.get('home_wins', 0),
            'h2h_away_wins': h2h_stats.get('away_wins', 0),
            'h2h_draws': h2h_stats.get('draws', 0),
            'h2h_total_games': h2h_stats.get('total_games', 0),
        })

        # DataFrame konverzió
        feature_df = pd.DataFrame([feature_row])

        # Előrejelzés
        result_proba = self.model_1x2.predict_proba(feature_df)[0]
        result_pred = self.model_1x2.predict(feature_df)[0]

        # Eredmény interpretálása
        result_names = ['Döntetlen', 'Hazai győzelem', 'Idegen győzelem']

        prediction = {
            'predicted_result': result_names[result_pred],
            'probabilities': {
                'draw': result_proba[0],
                'home_win': result_proba[1],
                'away_win': result_proba[2]
            },
            'confidence': max(result_proba),
            'home_team_strength': home_stats.get('strength', 0.5),
            'away_team_strength': away_stats.get('strength', 0.5),
            'h2h_summary': h2h_stats
        }

        # Eredmény kiírása
        print(f"📊 Előrejelzés: {prediction['predicted_result']}")
        print(f"🎯 Megbízhatóság: {prediction['confidence']:.1%}")
        print(f"📈 Valószínűségek:")
        print(f"   🏠 Hazai győzelem: {result_proba[1]:.1%}")
        print(f"   🤝 Döntetlen: {result_proba[0]:.1%}")
        print(f"   🛫 Idegen győzelem: {result_proba[2]:.1%}")

        self.predictions_made += 1

        return prediction

    def save_model(self, model_path="football_model.pkl"):
        """Modell mentése"""
        print(f"💾 Modell mentése: {model_path}")

        model_data = {
            'model_1x2': self.model_1x2,
            'label_encoders': self.label_encoders,
            'model_accuracy': self.model_accuracy,
            'feature_stats': self.feature_stats,
            'trained_at': datetime.now().isoformat()
        }

        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)

        print("✅ Modell sikeresen elmentve")

    def load_model(self, model_path="football_model.pkl"):
        """Modell betöltése"""
        print(f"📂 Modell betöltése: {model_path}")

        try:
            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)

            self.model_1x2 = model_data['model_1x2']
            self.label_encoders = model_data['label_encoders']
            self.model_accuracy = model_data.get('model_accuracy', 0.0)
            self.feature_stats = model_data.get('feature_stats', {})

            print(f"✅ Modell betöltve (pontosság: {self.model_accuracy:.1%})")
            return True

        except Exception as e:
            print(f"❌ Modell betöltési hiba: {e}")
            return False

def main():
    """ML modell tesztelése"""
    import os

    print("🤖 FUTBALL ELŐREJELZŐ MODELL")
    print("=" * 50)

    # Modell inicializálása
    model = FootballPredictionModel()

    # 1. Adatok betöltése
    print("\n1️⃣ ADATOK BETÖLTÉSE")
    model.load_data_from_database()
    model.load_additional_data()

    # 2. Feature-ök létrehozása
    print("\n2️⃣ FEATURE-ÖK LÉTREHOZÁSA")
    features = model.create_features()

    if features is not None and len(features) > 0:
        # 3. Modell tanítása
        print("\n3️⃣ MODELL TANÍTÁSA")
        training_success = model.train_models()

        if training_success:
            # 4. Modell mentése
            print("\n4️⃣ MODELL MENTÉSE")
            model.save_model()

            # 5. Tesztelés néhány előrejelzéssel
            print("\n5️⃣ TESZT ELŐREJELZÉSEK")

            # Ismert csapatokkal tesztelés
            test_matches = [
                ("Dortmund", "Bayern München", "Bundesliga"),
                ("Manchester City", "Liverpool", "Premier League"),
                ("Columbus", "Atlanta Utd", "MLS"),
                ("Ferencváros", "Újpest", "Magyar NB I")
            ]

            for home, away, league in test_matches:
                print(f"\n🔍 Teszt: {home} vs {away}")
                prediction = model.predict_match(home, away, league)
                print("-" * 40)

            print(f"\n✅ MODELL KÉSZ!")
            print(f"📊 Tanítási pontosság: {model.model_accuracy:.1%}")
            print(f"🔮 Előrejelzések készítve: {model.predictions_made}")
            print(f"💾 Modell mentve: football_model.pkl")

        else:
            print("❌ Modell tanítása sikertelen")
    else:
        print("❌ Nincs elegendő adat a modell tanításához")

if __name__ == "__main__":
    main()

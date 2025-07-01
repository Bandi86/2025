import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
from datetime import datetime, timedelta

class FootballPredictor:
    def __init__(self, fixtures_path, teams_path, team_stats_path=None):
        self.fixtures_path = fixtures_path
        self.teams_path = teams_path
        self.team_stats_path = team_stats_path
        self.fixtures_df = None
        self.teams_df = None
        self.team_stats_df = None
        self.result_model = None
        self.goals_model = None
        self.scaler = StandardScaler()
        self.feature_columns = []

    def load_data(self):
        """Adatok betöltése és alapvető normalizálás"""
        print("Adatok betöltése...")
        self.fixtures_df = pd.read_csv(self.fixtures_path)
        self.teams_df = pd.read_csv(self.teams_path)

        if self.team_stats_path and os.path.exists(self.team_stats_path):
            self.team_stats_df = pd.read_csv(self.team_stats_path)

        # Dátum normalizálás
        self.fixtures_df['date'] = pd.to_datetime(self.fixtures_df['date'])

        # Eredmény kódolás
        def get_result(row):
            if row['homeTeamScore'] > row['awayTeamScore']:
                return 'H'
            elif row['homeTeamScore'] < row['awayTeamScore']:
                return 'A'
            else:
                return 'D'

        self.fixtures_df['result'] = self.fixtures_df.apply(get_result, axis=1)
        self.fixtures_df['result_encoded'] = self.fixtures_df['result'].map({'H': 0, 'D': 1, 'A': 2})

        # Csak befejezett meccsek (statusId == 28)
        self.fixtures_df = self.fixtures_df[self.fixtures_df['statusId'] == 28].copy()
        self.fixtures_df = self.fixtures_df.sort_values('date').reset_index(drop=True)

        print(f"Betöltve {len(self.fixtures_df)} befejezett meccs")

    def compute_advanced_features(self, window=10):
        """Fejlett feature engineering: forma, trend, h2h, liga sajátosságok"""
        print("Fejlett jellemzők számítása...")

        features_list = []

        for idx, match in self.fixtures_df.iterrows():
            if idx % 1000 == 0:
                print(f"Feldolgozva: {idx}/{len(self.fixtures_df)}")

            home_team = match['homeTeamId']
            away_team = match['awayTeamId']
            match_date = match['date']
            league_id = match['leagueId']

            # Múltbeli meccsek (csak a jelenlegi meccs előtt)
            past_matches = self.fixtures_df[self.fixtures_df['date'] < match_date].copy()

            if len(past_matches) < 5:  # Minimum adatmennyiség
                continue

            # 1. FORMA TRENDEK (utolsó N meccs)
            home_form = self._get_team_form(past_matches, home_team, window)
            away_form = self._get_team_form(past_matches, away_team, window)

            # 2. EGYMÁS ELLENI EREDMÉNYEK (H2H)
            h2h_stats = self._get_h2h_stats(past_matches, home_team, away_team)

            # 3. LIGA-SPECIFIKUS SAJÁTOSSÁGOK
            league_stats = self._get_league_stats(past_matches, league_id)

            # 4. RÖVID TÁVÚ FORMA (utolsó 3 meccs)
            home_recent = self._get_team_form(past_matches, home_team, 3)
            away_recent = self._get_team_form(past_matches, away_team, 3)

            # 5. HAZAI/VENDÉG SPECIFIKUS FORMA
            home_home_form = self._get_home_away_form(past_matches, home_team, True, window)
            away_away_form = self._get_home_away_form(past_matches, away_team, False, window)

            feature_row = {
                'match_idx': idx,
                'homeTeamId': home_team,
                'awayTeamId': away_team,
                'leagueId': league_id,
                'result': match['result'],
                'result_encoded': match['result_encoded'],
                'total_goals': match['homeTeamScore'] + match['awayTeamScore'],
                'home_goals': match['homeTeamScore'],
                'away_goals': match['awayTeamScore'],

                # Forma jellemzők
                'home_avg_goals_scored': home_form['avg_goals_scored'],
                'home_avg_goals_conceded': home_form['avg_goals_conceded'],
                'home_win_rate': home_form['win_rate'],
                'home_avg_points': home_form['avg_points'],
                'away_avg_goals_scored': away_form['avg_goals_scored'],
                'away_avg_goals_conceded': away_form['avg_goals_conceded'],
                'away_win_rate': away_form['win_rate'],
                'away_avg_points': away_form['avg_points'],

                # Rövid távú forma
                'home_recent_goals_scored': home_recent['avg_goals_scored'],
                'home_recent_win_rate': home_recent['win_rate'],
                'away_recent_goals_scored': away_recent['avg_goals_scored'],
                'away_recent_win_rate': away_recent['win_rate'],

                # Hazai/vendég specifikus
                'home_home_win_rate': home_home_form['win_rate'],
                'home_home_avg_goals': home_home_form['avg_goals_scored'],
                'away_away_win_rate': away_away_form['win_rate'],
                'away_away_avg_goals': away_away_form['avg_goals_scored'],

                # H2H
                'h2h_home_wins': h2h_stats['home_wins'],
                'h2h_draws': h2h_stats['draws'],
                'h2h_away_wins': h2h_stats['away_wins'],
                'h2h_avg_goals': h2h_stats['avg_total_goals'],

                # Liga sajátosságok
                'league_avg_goals': league_stats['avg_goals'],
                'league_home_advantage': league_stats['home_win_rate'],

                # Erőviszonyok
                'goal_diff_advantage': home_form['avg_goals_scored'] - home_form['avg_goals_conceded'] -
                                     (away_form['avg_goals_scored'] - away_form['avg_goals_conceded']),
                'form_advantage': home_form['avg_points'] - away_form['avg_points']
            }

            features_list.append(feature_row)

        self.features_df = pd.DataFrame(features_list)
        print(f"Elkészült {len(self.features_df)} meccs jellemzői")

    def _get_team_form(self, past_matches, team_id, window):
        """Csapat forma számítása"""
        team_matches = past_matches[
            (past_matches['homeTeamId'] == team_id) |
            (past_matches['awayTeamId'] == team_id)
        ].tail(window)

        if len(team_matches) == 0:
            return {'avg_goals_scored': 1.0, 'avg_goals_conceded': 1.0, 'win_rate': 0.33, 'avg_points': 1.0}

        goals_scored = []
        goals_conceded = []
        points = []

        for _, match in team_matches.iterrows():
            if match['homeTeamId'] == team_id:
                goals_scored.append(match['homeTeamScore'])
                goals_conceded.append(match['awayTeamScore'])
                if match['result'] == 'H':
                    points.append(3)
                elif match['result'] == 'D':
                    points.append(1)
                else:
                    points.append(0)
            else:
                goals_scored.append(match['awayTeamScore'])
                goals_conceded.append(match['homeTeamScore'])
                if match['result'] == 'A':
                    points.append(3)
                elif match['result'] == 'D':
                    points.append(1)
                else:
                    points.append(0)

        wins = sum([1 for p in points if p == 3])

        return {
            'avg_goals_scored': np.mean(goals_scored),
            'avg_goals_conceded': np.mean(goals_conceded),
            'win_rate': wins / len(points),
            'avg_points': np.mean(points)
        }

    def _get_home_away_form(self, past_matches, team_id, is_home, window):
        """Hazai/vendég specifikus forma"""
        if is_home:
            team_matches = past_matches[past_matches['homeTeamId'] == team_id].tail(window)
        else:
            team_matches = past_matches[past_matches['awayTeamId'] == team_id].tail(window)

        if len(team_matches) == 0:
            return {'avg_goals_scored': 1.0, 'win_rate': 0.33}

        goals_scored = []
        wins = 0

        for _, match in team_matches.iterrows():
            if is_home:
                goals_scored.append(match['homeTeamScore'])
                if match['result'] == 'H':
                    wins += 1
            else:
                goals_scored.append(match['awayTeamScore'])
                if match['result'] == 'A':
                    wins += 1

        return {
            'avg_goals_scored': np.mean(goals_scored),
            'win_rate': wins / len(team_matches)
        }

    def _get_h2h_stats(self, past_matches, home_team, away_team):
        """Egymás elleni statisztikák"""
        h2h_matches = past_matches[
            ((past_matches['homeTeamId'] == home_team) & (past_matches['awayTeamId'] == away_team)) |
            ((past_matches['homeTeamId'] == away_team) & (past_matches['awayTeamId'] == home_team))
        ].tail(10)  # Utolsó 10 egymás elleni

        if len(h2h_matches) == 0:
            return {'home_wins': 0, 'draws': 0, 'away_wins': 0, 'avg_total_goals': 2.5}

        home_wins = 0
        away_wins = 0
        draws = 0
        total_goals = []

        for _, match in h2h_matches.iterrows():
            total_goals.append(match['homeTeamScore'] + match['awayTeamScore'])

            if match['homeTeamId'] == home_team:
                if match['result'] == 'H':
                    home_wins += 1
                elif match['result'] == 'D':
                    draws += 1
                else:
                    away_wins += 1
            else:
                if match['result'] == 'A':
                    home_wins += 1
                elif match['result'] == 'D':
                    draws += 1
                else:
                    away_wins += 1

        return {
            'home_wins': home_wins,
            'draws': draws,
            'away_wins': away_wins,
            'avg_total_goals': np.mean(total_goals)
        }

    def _get_league_stats(self, past_matches, league_id):
        """Liga specifikus statisztikák"""
        league_matches = past_matches[past_matches['leagueId'] == league_id].tail(100)

        if len(league_matches) == 0:
            return {'avg_goals': 2.5, 'home_win_rate': 0.45}

        total_goals = league_matches['homeTeamScore'] + league_matches['awayTeamScore']
        home_wins = len(league_matches[league_matches['result'] == 'H'])

        return {
            'avg_goals': total_goals.mean(),
            'home_win_rate': home_wins / len(league_matches)
        }

    def prepare_ml_data(self):
        """Gépi tanuláshoz adatok előkészítése"""
        print("Gépi tanulási adatok előkészítése...")

        # Feature oszlopok kiválasztása (numerikus jellemzők)
        feature_cols = [col for col in self.features_df.columns if col not in
                       ['match_idx', 'homeTeamId', 'awayTeamId', 'leagueId', 'result', 'result_encoded',
                        'total_goals', 'home_goals', 'away_goals']]

        self.feature_columns = feature_cols
        X = self.features_df[feature_cols].fillna(0)

        # Célváltozók
        y_result = self.features_df['result_encoded']
        y_total_goals = self.features_df['total_goals']

        # Adatok felosztása
        X_train, X_test, y_result_train, y_result_test, y_goals_train, y_goals_test = train_test_split(
            X, y_result, y_total_goals, test_size=0.2, random_state=42, stratify=y_result
        )

        # Normalizálás
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        return X_train_scaled, X_test_scaled, y_result_train, y_result_test, y_goals_train, y_goals_test

    def train_models(self):
        """Random Forest modellek tanítása"""
        print("Modellek tanítása...")

        X_train, X_test, y_result_train, y_result_test, y_goals_train, y_goals_test = self.prepare_ml_data()

        # Eredmény előrejelzés modell (klasszifikáció)
        self.result_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1
        )
        self.result_model.fit(X_train, y_result_train)

        # Gólok előrejelzés modell (regresszió)
        self.goals_model = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1
        )
        self.goals_model.fit(X_train, y_goals_train)

        # Tesztelés
        result_pred = self.result_model.predict(X_test)
        goals_pred = self.goals_model.predict(X_test)

        print(f"Eredmény előrejelzés pontossága: {accuracy_score(y_result_test, result_pred):.3f}")
        print(f"Gólok előrejelzés RMSE: {np.sqrt(np.mean((y_goals_test - goals_pred)**2)):.3f}")

        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.result_model.feature_importances_
        }).sort_values('importance', ascending=False)

        print("\nTop 10 legfontosabb jellemző:")
        print(feature_importance.head(10))

    def save_models(self, model_dir='models'):
        """Modellek mentése"""
        os.makedirs(model_dir, exist_ok=True)

        joblib.dump(self.result_model, f'{model_dir}/result_model.pkl')
        joblib.dump(self.goals_model, f'{model_dir}/goals_model.pkl')
        joblib.dump(self.scaler, f'{model_dir}/scaler.pkl')

        # Feature oszlopok mentése
        with open(f'{model_dir}/feature_columns.txt', 'w') as f:
            for col in self.feature_columns:
                f.write(f"{col}\n")

        print(f"Modellek elmentve: {model_dir}/")

    def load_models(self, model_dir='models'):
        """Modellek betöltése"""
        self.result_model = joblib.load(f'{model_dir}/result_model.pkl')
        self.goals_model = joblib.load(f'{model_dir}/goals_model.pkl')
        self.scaler = joblib.load(f'{model_dir}/scaler.pkl')

        with open(f'{model_dir}/feature_columns.txt', 'r') as f:
            self.feature_columns = [line.strip() for line in f.readlines()]

        print("Modellek betöltve!")

    def predict_match(self, home_team_id, away_team_id, league_id=None):
        """Egy meccs előrejelzése valószínűségekkel"""
        if self.result_model is None or self.goals_model is None:
            raise ValueError("Előbb tanítsd be vagy töltsd be a modelleket!")

        # Jellemzők számítása a jövőbeli meccsre
        features = self._compute_match_features(home_team_id, away_team_id, league_id)

        if features is None:
            return self._fallback_prediction(home_team_id, away_team_id)

        # Előrejelzés
        features_scaled = self.scaler.transform([features])

        # Eredmény valószínűségek
        result_probs = self.result_model.predict_proba(features_scaled)[0]
        result_pred = self.result_model.predict(features_scaled)[0]

        # Gólok előrejelzés
        total_goals_pred = max(0, self.goals_model.predict(features_scaled)[0])

        # Eredmény mappolás
        result_map = {0: 'H', 1: 'D', 2: 'A'}
        result_names = ['Hazai győzelem', 'Döntetlen', 'Vendég győzelem']

        return {
            'home_team_id': home_team_id,
            'away_team_id': away_team_id,
            'predicted_result': result_map[result_pred],
            'result_probabilities': {
                'home_win': round(result_probs[0] * 100, 1),
                'draw': round(result_probs[1] * 100, 1),
                'away_win': round(result_probs[2] * 100, 1)
            },
            'expected_total_goals': round(total_goals_pred, 2),
            'confidence': round(max(result_probs) * 100, 1)
        }

    def _compute_match_features(self, home_team_id, away_team_id, league_id=None):
        """Egy jövőbeli meccs jellemzőinek számítása"""
        if league_id is None:
            # Leggyakoribb liga keresése ezeknek a csapatoknak
            home_leagues = self.fixtures_df[self.fixtures_df['homeTeamId'] == home_team_id]['leagueId']
            away_leagues = self.fixtures_df[self.fixtures_df['awayTeamId'] == away_team_id]['leagueId']
            common_leagues = set(home_leagues) & set(away_leagues)

            if common_leagues:
                league_id = list(common_leagues)[0]
            else:
                return None

        # Legfrissebb adatok alapján számítás
        home_form = self._get_team_form(self.fixtures_df, home_team_id, 10)
        away_form = self._get_team_form(self.fixtures_df, away_team_id, 10)
        home_recent = self._get_team_form(self.fixtures_df, home_team_id, 3)
        away_recent = self._get_team_form(self.fixtures_df, away_team_id, 3)
        home_home_form = self._get_home_away_form(self.fixtures_df, home_team_id, True, 10)
        away_away_form = self._get_home_away_form(self.fixtures_df, away_team_id, False, 10)
        h2h_stats = self._get_h2h_stats(self.fixtures_df, home_team_id, away_team_id)
        league_stats = self._get_league_stats(self.fixtures_df, league_id)

        features = [
            home_form['avg_goals_scored'],
            home_form['avg_goals_conceded'],
            home_form['win_rate'],
            home_form['avg_points'],
            away_form['avg_goals_scored'],
            away_form['avg_goals_conceded'],
            away_form['win_rate'],
            away_form['avg_points'],
            home_recent['avg_goals_scored'],
            home_recent['win_rate'],
            away_recent['avg_goals_scored'],
            away_recent['win_rate'],
            home_home_form['win_rate'],
            home_home_form['avg_goals_scored'],
            away_away_form['win_rate'],
            away_away_form['avg_goals_scored'],
            h2h_stats['home_wins'],
            h2h_stats['draws'],
            h2h_stats['away_wins'],
            h2h_stats['avg_total_goals'],
            league_stats['avg_goals'],
            league_stats['home_win_rate'],
            home_form['avg_goals_scored'] - home_form['avg_goals_conceded'] -
            (away_form['avg_goals_scored'] - away_form['avg_goals_conceded']),
            home_form['avg_points'] - away_form['avg_points']
        ]

        return features

    def _fallback_prediction(self, home_team_id, away_team_id):
        """Egyszerű fallback predikció, ha nincs elég adat"""
        return {
            'home_team_id': home_team_id,
            'away_team_id': away_team_id,
            'predicted_result': 'D',
            'result_probabilities': {
                'home_win': 40.0,
                'draw': 30.0,
                'away_win': 30.0
            },
            'expected_total_goals': 2.5,
            'confidence': 50.0
        }

    def get_team_name(self, team_id):
        """Csapat név lekérése"""
        team = self.teams_df[self.teams_df['teamId'] == team_id]
        if len(team) > 0:
            return team.iloc[0]['displayName']
        return f"Team {team_id}"

    def find_team_id_by_name(self, team_name):
        """Csapat ID keresése név alapján"""
        if self.teams_df is None:
            print("❌ Csapatok adatai nincsenek betöltve!")
            return None

        # Pontos egyezés keresése
        exact_match = self.teams_df[self.teams_df['displayName'].str.lower() == team_name.lower()]
        if len(exact_match) > 0:
            return exact_match.iloc[0]['teamId']

        # Részleges egyezés keresése
        partial_match = self.teams_df[self.teams_df['displayName'].str.lower().str.contains(team_name.lower(), na=False)]
        if len(partial_match) > 0:
            return partial_match.iloc[0]['teamId']

        # Alternatív névkeresés (rövid név, becenév, stb.)
        name_variations = {
            'manchester city': ['man city', 'city'],
            'manchester united': ['man utd', 'man united', 'united'],
            'tottenham': ['spurs', 'tottenham hotspur'],
            'barcelona': ['barca', 'fc barcelona'],
            'real madrid': ['madrid', 'real'],
            'atletico madrid': ['atletico', 'atlético madrid'],
            'bayern munich': ['bayern', 'fc bayern munich'],
            'borussia dortmund': ['dortmund', 'bvb'],
            'inter': ['inter milan', 'internazionale'],
            'ac milan': ['milan'],
            'juventus': ['juve'],
            'psg': ['paris saint-germain', 'paris'],
            'rb leipzig': ['leipzig']
        }

        team_lower = team_name.lower()
        for standard_name, variations in name_variations.items():
            if team_lower == standard_name or team_lower in variations:
                # Keresés a standard név alapján
                standard_match = self.teams_df[self.teams_df['displayName'].str.lower().str.contains(standard_name.split()[0], na=False)]
                if len(standard_match) > 0:
                    return standard_match.iloc[0]['teamId']

        print(f"❌ Nem találtam csapatot: '{team_name}'")
        return None

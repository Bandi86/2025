import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, GridSearchCV
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
from advanced_predictor import FootballPredictor

class EnhancedFootballPredictor(FootballPredictor):
    """
    Fejlesztett futball predikció osztály ensemble modellekkel és hyperparameter tuning-gal
    """

    def __init__(self, fixtures_path, teams_path, team_stats_path=None):
        super().__init__(fixtures_path, teams_path, team_stats_path)
        self.ensemble_model = None
        self.best_params = None

    def train_enhanced_models(self, use_grid_search=True, use_ensemble=True):
        """Fejlesztett modellek tanítása"""
        print("🔧 Fejlesztett modellek tanítása...")

        # Adatok előkészítése
        self.compute_advanced_features()
        X, y_result, y_goals = self.prepare_ml_data()

        if len(X) == 0:
            print("❌ Nincs adat a tanításhoz")
            return

        print(f"📊 Tanítási adatok: {len(X)} meccs, {len(X.columns)} feature")

        # Train/test split
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_result, test_size=0.2, random_state=42, stratify=y_result
        )

        if use_grid_search:
            print("🔍 Hyperparameter optimalizálás...")
            self.result_model = self._optimize_model(X_train, y_train)
        else:
            # Alap Random Forest
            self.result_model = RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=10,
                random_state=42,
                n_jobs=-1
            )
            self.result_model.fit(X_train, y_train)

        if use_ensemble:
            print("🎯 Ensemble model építése...")
            self.ensemble_model = self._build_ensemble_model(X_train, y_train)

        # Gólok modell (marad Random Forest)
        from sklearn.ensemble import RandomForestRegressor
        self.goals_model = RandomForestRegressor(
            n_estimators=200,
            max_depth=12,
            min_samples_split=8,
            random_state=42,
            n_jobs=-1
        )

        _, _, y_goals_train = self.prepare_ml_data()
        X_goals_train, X_goals_test, y_goals_train, y_goals_test = train_test_split(
            X, y_goals, test_size=0.2, random_state=42
        )

        self.goals_model.fit(X_goals_train, y_goals_train)

        # Modellek értékelése
        self._evaluate_models(X_test, y_test, X_goals_test, y_goals_test)

        # Feature scaling
        self.scaler.fit(X_train)
        self.feature_columns = X.columns.tolist()

        print("✅ Fejlesztett modellek betanítva!")

    def _optimize_model(self, X_train, y_train):
        """Hyperparameter optimalizálás Grid Search-csel"""

        # Random Forest parameter grid
        rf_param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 15, 20, None],
            'min_samples_split': [5, 10, 15],
            'min_samples_leaf': [1, 2, 4],
            'max_features': ['sqrt', 'log2', None]
        }

        rf = RandomForestClassifier(random_state=42, n_jobs=-1)

        print("🔍 Random Forest Grid Search futtatása...")
        rf_grid = GridSearchCV(
            rf, rf_param_grid,
            cv=5,
            scoring='accuracy',
            n_jobs=-1,
            verbose=1
        )

        rf_grid.fit(X_train, y_train)

        print(f"✅ Legjobb Random Forest pontosság: {rf_grid.best_score_:.3f}")
        print(f"📋 Legjobb paraméterek: {rf_grid.best_params_}")

        self.best_params = rf_grid.best_params_
        return rf_grid.best_estimator_

    def _build_ensemble_model(self, X_train, y_train):
        """Ensemble model építése több algoritmussal"""

        # Alap modellek
        rf = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=10,
            random_state=42
        )

        gb = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )

        lr = LogisticRegression(
            random_state=42,
            max_iter=1000,
            multi_class='multinomial'
        )

        # Ensemble (Voting Classifier)
        ensemble = VotingClassifier(
            estimators=[
                ('rf', rf),
                ('gb', gb),
                ('lr', lr)
            ],
            voting='soft'  # Probability-based voting
        )

        ensemble.fit(X_train, y_train)

        # Cross-validation értékelés
        cv_scores = cross_val_score(ensemble, X_train, y_train, cv=5, scoring='accuracy')
        print(f"🎯 Ensemble CV pontosság: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

        return ensemble

    def _evaluate_models(self, X_test, y_test, X_goals_test, y_goals_test):
        """Modellek részletes értékelése"""
        print("\n📊 MODELL ÉRTÉKELÉS")
        print("=" * 50)

        # Eredmény predikció értékelése
        result_pred = self.result_model.predict(X_test)
        result_acc = accuracy_score(y_test, result_pred)

        print(f"🎯 Random Forest pontosság: {result_acc:.3f}")

        if self.ensemble_model:
            ensemble_pred = self.ensemble_model.predict(X_test)
            ensemble_acc = accuracy_score(y_test, ensemble_pred)
            print(f"🎯 Ensemble pontosság: {ensemble_acc:.3f}")

            # Ha ensemble jobb, akkor azt használjuk
            if ensemble_acc > result_acc:
                print("✅ Ensemble modell választva!")
                self.result_model = self.ensemble_model
            else:
                print("✅ Random Forest modell választva!")

        # Részletes classification report
        print("\n📋 Classification Report:")
        print(classification_report(y_test, result_pred,
                                  target_names=['Home Win', 'Draw', 'Away Win']))

        # Confusion Matrix
        print("\n🔢 Confusion Matrix:")
        cm = confusion_matrix(y_test, result_pred)
        print("      H    D    A")
        for i, row in enumerate(cm):
            label = ['H', 'D', 'A'][i]
            print(f"  {label} {row[0]:3d} {row[1]:3d} {row[2]:3d}")

        # Gólok predikció értékelése
        goals_pred = self.goals_model.predict(X_goals_test)
        goals_rmse = np.sqrt(np.mean((y_goals_test - goals_pred) ** 2))
        goals_mae = np.mean(np.abs(y_goals_test - goals_pred))

        print(f"\n⚽ Gólok RMSE: {goals_rmse:.3f}")
        print(f"⚽ Gólok MAE: {goals_mae:.3f}")

        # Feature importance (top 15)
        if hasattr(self.result_model, 'feature_importances_'):
            feature_imp = pd.DataFrame({
                'feature': X_test.columns,
                'importance': self.result_model.feature_importances_
            }).sort_values('importance', ascending=False)

            print(f"\n🎯 Top 15 legfontosabb feature:")
            for i, row in feature_imp.head(15).iterrows():
                print(f"  {row['feature']:<25} {row['importance']:.3f}")

    def analyze_prediction_confidence(self, X_test, y_test):
        """Predikciós confidence elemzése"""
        if not hasattr(self.result_model, 'predict_proba'):
            print("❌ A modell nem támogatja a probability prediction-t")
            return

        probs = self.result_model.predict_proba(X_test)
        predictions = self.result_model.predict(X_test)

        # Confidence = max probability
        confidences = np.max(probs, axis=1)

        # Confidence bins elemzése
        confidence_bins = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

        print("\n📊 CONFIDENCE ELEMZÉS")
        print("=" * 40)
        print("Confidence | Count | Accuracy")
        print("-" * 30)

        for i in range(len(confidence_bins)-1):
            low, high = confidence_bins[i], confidence_bins[i+1]
            mask = (confidences >= low) & (confidences < high)

            if np.sum(mask) > 0:
                bin_acc = accuracy_score(y_test[mask], predictions[mask])
                print(f"{low:.1f}-{high:.1f}   | {np.sum(mask):5d} | {bin_acc:.3f}")

        # ROI szempontjából fontos: magas confidence esetén jobb pontosság?
        high_conf_mask = confidences >= 0.6
        if np.sum(high_conf_mask) > 0:
            high_conf_acc = accuracy_score(y_test[high_conf_mask], predictions[high_conf_mask])
            print(f"\n✅ Magas confidence (>60%) pontosság: {high_conf_acc:.3f}")
            print(f"📊 Magas confidence meccsek száma: {np.sum(high_conf_mask)}")

def main():
    """Fejlesztett modell tanítás és értékelés"""
    fixtures_path = '../data/espn20242025/base_data/fixtures.csv'
    teams_path = '../data/espn20242025/base_data/teams.csv'

    predictor = EnhancedFootballPredictor(fixtures_path, teams_path)
    predictor.load_data()

    print("🚀 FEJLESZTETT FUTBALL PREDIKCIÓS MODELL")
    print("=" * 50)

    # Fejlesztett modellek tanítása
    predictor.train_enhanced_models(
        use_grid_search=True,   # Hyperparameter optimalizálás
        use_ensemble=True       # Ensemble modellek
    )

    # Confidence elemzés
    X, y_result, _ = predictor.prepare_ml_data()
    if len(X) > 0:
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_result, test_size=0.2, random_state=42, stratify=y_result
        )
        predictor.analyze_prediction_confidence(X_test, y_test)

    # Modellek mentése
    predictor.save_models()
    print("\n✅ Fejlesztett modellek elmentve!")

if __name__ == "__main__":
    main()

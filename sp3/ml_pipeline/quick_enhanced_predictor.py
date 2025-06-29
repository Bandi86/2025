import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score
from advanced_predictor import FootballPredictor

class QuickEnhancedPredictor(FootballPredictor):
    """
    Gyors model javítás jobb paraméterekkel és feature szelektálással
    """

    def __init__(self, fixtures_path, teams_path, team_stats_path=None):
        super().__init__(fixtures_path, teams_path, team_stats_path)

    def train_improved_models(self):
        """Javított modellek tanítása jobb paraméterekkel"""
        print("🚀 Javított modellek tanítása...")

        # Jellemzők számítása
        self.compute_advanced_features()
        X_train, X_test, y_result_train, y_result_test, y_goals_train, y_goals_test = self.prepare_ml_data()

        if len(X_train) == 0:
            print("❌ Nincs adat a tanításhoz")
            return

        print(f"📊 Tanítási adatok: {len(X_train)} meccs")

        # 1. Javított Random Forest eredmény modellje
        print("🎯 Eredmény modell tanítása...")
        self.result_model = RandomForestClassifier(
            n_estimators=300,           # Több fa
            max_depth=20,               # Mélyebb fák
            min_samples_split=8,        # Kisebb split threshold
            min_samples_leaf=3,         # Kisebb leaf threshold
            max_features='sqrt',        # Feature randomness
            bootstrap=True,
            oob_score=True,            # Out-of-bag score
            random_state=42,
            n_jobs=-1
        )

        self.result_model.fit(X_train, y_result_train)

        # 2. Javított Random Forest gólok modellje
        print("⚽ Gólok modell tanítása...")
        self.goals_model = RandomForestRegressor(
            n_estimators=250,
            max_depth=15,
            min_samples_split=6,
            min_samples_leaf=2,
            max_features='sqrt',
            bootstrap=True,
            oob_score=True,
            random_state=42,
            n_jobs=-1
        )

        self.goals_model.fit(X_train, y_goals_train)

        # Értékelés
        self._evaluate_performance(X_test, y_result_test, X_test, y_goals_test)

        # Feature columns mentése (a base class-ból)
        if hasattr(self, 'feature_columns'):
            print(f"📊 Feature columns már beállítva: {len(self.feature_columns)}")

        print("✅ Javított modellek tanítása kész!")

    def _evaluate_performance(self, X_test, y_test, X_goals_test, y_goals_test):
        """Teljesítmény értékelése"""
        print("\n📊 MODELL TELJESÍTMÉNY")
        print("=" * 40)

        # Eredmény predikció
        result_pred = self.result_model.predict(X_test)
        result_acc = accuracy_score(y_test, result_pred)

        print(f"🎯 Eredmény pontosság: {result_acc:.3f} ({result_acc*100:.1f}%)")

        if hasattr(self.result_model, 'oob_score_'):
            print(f"📊 Out-of-bag score: {self.result_model.oob_score_:.3f}")

        # Gólok predikció
        goals_pred = self.goals_model.predict(X_goals_test)
        goals_rmse = np.sqrt(np.mean((y_goals_test - goals_pred) ** 2))
        goals_mae = np.mean(np.abs(y_goals_test - goals_pred))

        print(f"⚽ Gólok RMSE: {goals_rmse:.3f}")
        print(f"⚽ Gólok MAE: {goals_mae:.3f}")

        if hasattr(self.goals_model, 'oob_score_'):
            print(f"📊 Gólok OOB R²: {self.goals_model.oob_score_:.3f}")

        # Feature importance top 10
        if hasattr(self, 'feature_columns') and self.feature_columns:
            feature_imp = pd.DataFrame({
                'feature': self.feature_columns,
                'importance': self.result_model.feature_importances_
            }).sort_values('importance', ascending=False)

            print(f"\n🔝 Top 10 legfontosabb feature:")
            for i, row in feature_imp.head(10).iterrows():
                print(f"  {row['feature']:<25} {row['importance']:.3f}")
        else:
            print(f"\n🔝 Feature importance: {len(self.result_model.feature_importances_)} features")

        # Confidence elemzés
        self._analyze_confidence(X_test, y_test)

    def _analyze_confidence(self, X_test, y_test):
        """Confidence elemzés (ROI szempontjából fontos)"""
        probs = self.result_model.predict_proba(X_test)
        predictions = self.result_model.predict(X_test)
        confidences = np.max(probs, axis=1)

        print(f"\n🎯 CONFIDENCE ELEMZÉS (ROI szempontból)")
        print("-" * 35)

        # Confidence bins
        bins = [(0.4, 0.5), (0.5, 0.6), (0.6, 0.7), (0.7, 1.0)]

        for low, high in bins:
            mask = (confidences >= low) & (confidences < high)
            count = np.sum(mask)

            if count > 0:
                accuracy = accuracy_score(y_test[mask], predictions[mask])
                print(f"Confidence {low:.1f}-{high:.1f}: {count:4d} meccs, {accuracy:.3f} pontosság")

        # Magas confidence (jó fogadási lehetőségek)
        high_conf_mask = confidences >= 0.6
        if np.sum(high_conf_mask) > 0:
            high_conf_acc = accuracy_score(y_test[high_conf_mask], predictions[high_conf_mask])
            print(f"\n✅ Magas confidence (≥60%): {high_conf_acc:.3f} pontosság")
            print(f"📊 Meccsek száma: {np.sum(high_conf_mask)} ({(np.sum(high_conf_mask)/len(y_test)*100):.1f}%)")

            if high_conf_acc > 0.55:
                print("🎯 Ez jó ROI potenciált jelent!")

    def get_betting_ready_prediction(self, home_team_id, away_team_id, league_id=None):
        """
        Fogadás-optimalizált predikció (confidence threshold-okkal)
        """
        base_prediction = self.predict_match(home_team_id, away_team_id, league_id)

        # Confidence alapú kockázat értékelés
        confidence = base_prediction['confidence']

        if confidence >= 70:
            risk_level = "LOW"
            betting_recommendation = "STRONG BET"
        elif confidence >= 60:
            risk_level = "MEDIUM"
            betting_recommendation = "GOOD BET"
        elif confidence >= 55:
            risk_level = "HIGH"
            betting_recommendation = "CAREFUL BET"
        else:
            risk_level = "VERY HIGH"
            betting_recommendation = "AVOID"

        # Enhanced prediction object
        enhanced_prediction = base_prediction.copy()
        enhanced_prediction.update({
            'risk_level': risk_level,
            'betting_recommendation': betting_recommendation,
            'model_type': 'QuickEnhanced',
            'oob_score': getattr(self.result_model, 'oob_score_', None)
        })

        return enhanced_prediction

def main():
    """Gyors javított modell tanítás"""
    fixtures_path = '../data/espn20242025/base_data/fixtures.csv'
    teams_path = '../data/espn20242025/base_data/teams.csv'

    predictor = QuickEnhancedPredictor(fixtures_path, teams_path)
    predictor.load_data()

    print("⚡ GYORS JAVÍTOTT FUTBALL PREDIKCIÓ")
    print("=" * 40)

    # Javított modellek tanítása
    predictor.train_improved_models()

    # Modellek mentése
    predictor.save_models()
    print("\n💾 Javított modellek elmentve!")

    # Teszt predikció
    print("\n🧪 TESZT PREDIKCIÓ:")
    print("-" * 20)

    # Barcelona vs Real Madrid
    try:
        barca_id = predictor.find_team_id_by_name("Barcelona")
        real_id = predictor.find_team_id_by_name("Real Madrid")

        if barca_id and real_id:
            prediction = predictor.get_betting_ready_prediction(barca_id, real_id)

            print(f"🏆 {predictor.get_team_name(barca_id)} vs {predictor.get_team_name(real_id)}")
            print(f"🎯 Predikció: {prediction['predicted_result']} ({prediction['confidence']}%)")
            print(f"⚡ Model típus: {prediction['model_type']}")
            print(f"⚠️  Kockázat: {prediction['risk_level']}")
            print(f"💰 Fogadási javaslat: {prediction['betting_recommendation']}")
            print(f"⚽ Várható gólok: {prediction['expected_total_goals']}")

            if prediction['oob_score']:
                print(f"📊 OOB score: {prediction['oob_score']:.3f}")
    except Exception as e:
        print(f"❌ Teszt hiba: {e}")

if __name__ == "__main__":
    main()

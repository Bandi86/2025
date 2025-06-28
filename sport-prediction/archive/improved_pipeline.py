import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss, accuracy_score
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
import lightgbm as lgb
from sklearn.ensemble import VotingClassifier
import warnings
warnings.filterwarnings('ignore')

class ImprovedModelPipeline:
    """Javított modell pipeline idősor-kompatibilis validációval."""

    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.best_models = {}

    def get_advanced_models(self):
        """Fejlett modellek lekérése."""
        return {
            'RandomForest_Tuned': RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=10,
                min_samples_leaf=5,
                max_features='sqrt',
                random_state=42,
                n_jobs=-1
            ),
            'GradientBoosting': GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            ),
            'XGBoost_Improved': XGBClassifier(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=5,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                eval_metric='mlogloss'
            ),
            'LightGBM': lgb.LGBMClassifier(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=5,
                random_state=42,
                verbose=-1
            ),
            'LogisticRegression_L2': LogisticRegression(
                C=1.0,
                penalty='l2',
                solver='lbfgs',
                max_iter=1000,
                random_state=42
            )
        }

    def time_series_validation(self, X, y, model, n_splits=5):
        """Idősor kompatibilis cross-validation."""
        tscv = TimeSeriesSplit(n_splits=n_splits)
        scores = []

        for train_idx, val_idx in tscv.split(X):
            X_train_fold = X.iloc[train_idx] if hasattr(X, 'iloc') else X[train_idx]
            X_val_fold = X.iloc[val_idx] if hasattr(X, 'iloc') else X[val_idx]
            y_train_fold = y.iloc[train_idx] if hasattr(y, 'iloc') else y[train_idx]
            y_val_fold = y.iloc[val_idx] if hasattr(y, 'iloc') else y[val_idx]

            # Skálázás ha szükséges
            if isinstance(model, LogisticRegression):
                scaler = StandardScaler()
                X_train_fold = scaler.fit_transform(X_train_fold)
                X_val_fold = scaler.transform(X_val_fold)

            # Modell tanítás és értékelés
            model_copy = model.__class__(**model.get_params())
            model_copy.fit(X_train_fold, y_train_fold)

            # Valószínűségek a log loss számításhoz
            y_pred_proba = model_copy.predict_proba(X_val_fold)
            score = log_loss(y_val_fold, y_pred_proba)
            scores.append(score)

        return np.mean(scores), np.std(scores)

    def train_and_evaluate_models(self, X_train, X_test, y_train, y_test, feature_names=None):
        """Modellek tanítása és értékelése idősor validációval."""
        models = self.get_advanced_models()
        results = {}

        print("🚀 Fejlett modellek tanítása idősor validációval...")

        for name, model in models.items():
            print(f"\n--- {name} ---")

            # Idősor validáció
            mean_score, std_score = self.time_series_validation(X_train, y_train, model)
            print(f"Cross-validation log loss: {mean_score:.4f} (+/- {std_score:.4f})")

            # Skálázás logisztikus regresszióhoz
            if isinstance(model, LogisticRegression):
                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)
                self.scalers[name] = scaler
            else:
                X_train_scaled = X_train
                X_test_scaled = X_test

            # Teljes modell tanítás
            model.fit(X_train_scaled, y_train)

            # Teszt értékelés
            y_pred = model.predict(X_test_scaled)
            y_pred_proba = model.predict_proba(X_test_scaled)

            accuracy = accuracy_score(y_test, y_pred)
            test_logloss = log_loss(y_test, y_pred_proba)

            print(f"Test accuracy: {accuracy:.4f}")
            print(f"Test log loss: {test_logloss:.4f}")

            # Feature importance (ha elérhető)
            if hasattr(model, 'feature_importances_') and feature_names:
                importances = model.feature_importances_
                feature_importance = list(zip(feature_names, importances))
                feature_importance.sort(key=lambda x: x[1], reverse=True)
                print("Top 5 jellemző:")
                for feat, imp in feature_importance[:5]:
                    print(f"  {feat}: {imp:.4f}")

            results[name] = {
                'model': model,
                'cv_score': mean_score,
                'cv_std': std_score,
                'test_accuracy': accuracy,
                'test_logloss': test_logloss,
                'predictions': y_pred,
                'probabilities': y_pred_proba
            }

            self.models[name] = model

        return results

    def create_smart_ensemble(self, model_results, X_train, y_train, X_test):
        """Intelligens ensemble létrehozása a legjobb modellek alapján."""
        # Modellek rangsorolása log loss alapján
        sorted_models = sorted(model_results.items(), key=lambda x: x[1]['cv_score'])

        # Top 3 modell kiválasztása
        top_models = sorted_models[:3]
        print(f"\n🏆 Ensemble a top 3 modellből: {[name for name, _ in top_models]}")

        # Súlyok a teljesítmény alapján (fordított log loss)
        weights = []
        estimators = []

        for name, results in top_models:
            weight = 1 / (results['cv_score'] + 0.001)  # Kisebb log loss = nagyobb súly
            weights.append(weight)
            estimators.append((name, self.models[name]))

        # Súlyok normalizálása
        total_weight = sum(weights)
        weights = [w/total_weight for w in weights]

        print(f"Model súlyok: {dict(zip([name for name, _ in top_models], weights))}")

        # Weighted voting ensemble
        class WeightedVotingClassifier:
            def __init__(self, estimators, weights, scalers):
                self.estimators = estimators
                self.weights = weights
                self.scalers = scalers

            def fit(self, X, y):
                for name, estimator in self.estimators:
                    if name in self.scalers:
                        X_scaled = self.scalers[name].transform(X)
                    else:
                        X_scaled = X
                    estimator.fit(X_scaled, y)
                return self

            def predict_proba(self, X):
                probas = []
                for (name, estimator), weight in zip(self.estimators, self.weights):
                    if name in self.scalers:
                        X_scaled = self.scalers[name].transform(X)
                    else:
                        X_scaled = X
                    proba = estimator.predict_proba(X_scaled)
                    probas.append(proba * weight)
                return np.sum(probas, axis=0)

            def predict(self, X):
                proba = self.predict_proba(X)
                return np.argmax(proba, axis=1)

        ensemble = WeightedVotingClassifier(estimators, weights, self.scalers)
        ensemble.fit(X_train, y_train)

        # Ensemble értékelés
        y_pred_ensemble = ensemble.predict(X_test)
        y_pred_proba_ensemble = ensemble.predict_proba(X_test)

        return ensemble, y_pred_ensemble, y_pred_proba_ensemble

    def analyze_predictions_confidence(self, y_pred_proba, confidence_thresholds=[0.4, 0.5, 0.6, 0.7, 0.8]):
        """Predikciók megbizhatóságának elemzése."""
        print("\n📊 Predikciós magabiztosság elemzése:")

        max_probas = np.max(y_pred_proba, axis=1)

        for threshold in confidence_thresholds:
            confident_predictions = np.sum(max_probas >= threshold)
            percentage = (confident_predictions / len(max_probas)) * 100
            avg_confidence = np.mean(max_probas[max_probas >= threshold]) if confident_predictions > 0 else 0

            print(f"  {threshold:.1f}+ magabiztosság: {confident_predictions} predikció ({percentage:.1f}%), átlag: {avg_confidence:.3f}")

        return max_probas

def run_improved_pipeline(X_train, X_test, y_train, y_test, feature_names=None):
    """Teljes javított pipeline futtatása."""
    pipeline = ImprovedModelPipeline()

    # Modellek tanítása
    results = pipeline.train_and_evaluate_models(X_train, X_test, y_train, y_test, feature_names)

    # Smart ensemble
    ensemble, y_pred_ensemble, y_pred_proba_ensemble = pipeline.create_smart_ensemble(
        results, X_train, y_train, X_test
    )

    # Magabiztosság elemzés
    confidence_scores = pipeline.analyze_predictions_confidence(y_pred_proba_ensemble)

    # Legjobb egyedi modell
    best_model_name = min(results.keys(), key=lambda x: results[x]['cv_score'])
    best_model = pipeline.models[best_model_name]

    return {
        'results': results,
        'ensemble': ensemble,
        'ensemble_predictions': y_pred_ensemble,
        'ensemble_probabilities': y_pred_proba_ensemble,
        'best_model': best_model,
        'best_model_name': best_model_name,
        'confidence_scores': confidence_scores,
        'pipeline': pipeline
    }

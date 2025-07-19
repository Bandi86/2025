"""
Meccs eredmény előrejelző modell tréningelése
"""

import pandas as pd
import numpy as np
from pathlib import Path
import logging
from datetime import datetime
import joblib
import json
from typing import Dict, List, Tuple

from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns

# Saját modulok
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.data_processor import DataProcessor

logger = logging.getLogger(__name__)

class MatchPredictorTrainer:
    """Meccs eredmény előrejelző tréningelő"""
    
    def __init__(self, output_dir: str = "models"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.data_processor = DataProcessor()
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
        
    def prepare_training_data(self) -> Tuple[pd.DataFrame, pd.Series]:
        """Tréning adatok előkészítése"""
        
        logger.info("📊 Tréning adatok előkészítése...")
        
        # ML dataset betöltése
        ml_df = self.data_processor.create_ml_dataset()
        
        if ml_df.empty:
            raise ValueError("Nincs adat a tréninghez")
            
        # Csak befejezett meccsek
        ml_df = ml_df[ml_df['status'] == 'FINISHED'].copy()
        
        # Csak érvényes eredményekkel
        ml_df = ml_df[ml_df['result'].notna()].copy()
        
        logger.info(f"Tréning adatok: {len(ml_df)} meccs")
        
        # Feature selection
        feature_columns = self._select_features(ml_df)
        
        X = ml_df[feature_columns].copy()
        y = ml_df['result'].copy()
        
        logger.info(f"Features: {len(feature_columns)}")
        logger.info(f"Target eloszlás: {y.value_counts().to_dict()}")
        
        return X, y
        
    def _select_features(self, df: pd.DataFrame) -> List[str]:
        """Feature selection"""
        
        # Numerikus features
        numeric_features = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Kizárjuk a target változókat és ID-kat
        exclude_features = [
            'match_id', 'home_score', 'away_score', 'result_numeric', 
            'home_win', 'away_win', 'draw', 'year'  # year lehet túl specifikus
        ]
        
        features = [col for col in numeric_features if col not in exclude_features]
        
        # Kategorikus encoded features hozzáadása
        categorical_encoded = [col for col in df.columns if col.endswith('_encoded')]
        features.extend(categorical_encoded)
        
        # Hiányzó értékek ellenőrzése
        features = [col for col in features if col in df.columns and df[col].notna().sum() > len(df) * 0.5]
        
        logger.info(f"Kiválasztott features: {len(features)}")
        return features
        
    def train_models(self) -> Dict:
        """Több modell tréningelése"""
        
        logger.info("🤖 Modellek tréningelése...")
        
        # Adatok előkészítése
        X, y = self.prepare_training_data()
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scaling
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        self.scalers['main'] = scaler
        
        # Modellek definíciója
        models_config = {
            'random_forest': {
                'model': RandomForestClassifier(random_state=42),
                'params': {
                    'n_estimators': [100, 200],
                    'max_depth': [10, 20, None],
                    'min_samples_split': [2, 5]
                },
                'use_scaling': False
            },
            'gradient_boosting': {
                'model': GradientBoostingClassifier(random_state=42),
                'params': {
                    'n_estimators': [100, 200],
                    'learning_rate': [0.1, 0.05],
                    'max_depth': [3, 5]
                },
                'use_scaling': False
            },
            'logistic_regression': {
                'model': LogisticRegression(random_state=42, max_iter=1000),
                'params': {
                    'C': [0.1, 1, 10],
                    'penalty': ['l1', 'l2'],
                    'solver': ['liblinear']
                },
                'use_scaling': True
            }
        }
        
        results = {}
        
        # Minden modell tréningelése
        for model_name, config in models_config.items():
            logger.info(f"🔄 {model_name} tréningelése...")
            
            # Adatok kiválasztása (scaled vagy nem)
            if config['use_scaling']:
                X_train_model = X_train_scaled
                X_test_model = X_test_scaled
            else:
                X_train_model = X_train
                X_test_model = X_test
                
            # Grid search
            grid_search = GridSearchCV(
                config['model'],
                config['params'],
                cv=5,
                scoring='accuracy',
                n_jobs=-1
            )
            
            grid_search.fit(X_train_model, y_train)
            
            # Legjobb modell
            best_model = grid_search.best_estimator_
            
            # Predikciók
            y_pred = best_model.predict(X_test_model)
            
            # Értékelés
            accuracy = accuracy_score(y_test, y_pred)
            cv_scores = cross_val_score(best_model, X_train_model, y_train, cv=5)
            
            results[model_name] = {
                'model': best_model,
                'best_params': grid_search.best_params_,
                'accuracy': accuracy,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'classification_report': classification_report(y_test, y_pred, output_dict=True),
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
                'use_scaling': config['use_scaling']
            }
            
            # Feature importance (ha van)
            if hasattr(best_model, 'feature_importances_'):
                feature_importance = dict(zip(X.columns, best_model.feature_importances_))
                self.feature_importance[model_name] = feature_importance
                
            logger.info(f"✅ {model_name}: {accuracy:.3f} accuracy")
            
        # Legjobb modell kiválasztása
        best_model_name = max(results.keys(), key=lambda k: results[k]['accuracy'])
        logger.info(f"🏆 Legjobb modell: {best_model_name} ({results[best_model_name]['accuracy']:.3f})")
        
        self.models = results
        
        # Modellek mentése
        self._save_models(X.columns.tolist())
        
        return results
        
    def _save_models(self, feature_names: List[str]):
        """Modellek és metaadatok mentése"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Minden modell mentése
        for model_name, model_data in self.models.items():
            model_dir = self.output_dir / model_name
            model_dir.mkdir(exist_ok=True)
            
            # Modell mentése
            model_path = model_dir / f"model_{timestamp}.joblib"
            joblib.dump(model_data['model'], model_path)
            
            # Metaadatok
            metadata = {
                'model_name': model_name,
                'timestamp': timestamp,
                'accuracy': model_data['accuracy'],
                'cv_mean': model_data['cv_mean'],
                'cv_std': model_data['cv_std'],
                'best_params': model_data['best_params'],
                'use_scaling': model_data['use_scaling'],
                'feature_names': feature_names,
                'classification_report': model_data['classification_report']
            }
            
            metadata_path = model_dir / f"metadata_{timestamp}.json"
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2, default=str)
                
            logger.info(f"💾 {model_name} mentve: {model_path}")
            
        # Scaler mentése
        scaler_path = self.output_dir / f"scaler_{timestamp}.joblib"
        joblib.dump(self.scalers['main'], scaler_path)
        
        # Feature importance mentése
        if self.feature_importance:
            importance_path = self.output_dir / f"feature_importance_{timestamp}.json"
            with open(importance_path, 'w') as f:
                json.dump(self.feature_importance, f, indent=2)
                
    def create_training_report(self) -> str:
        """Tréning jelentés létrehozása"""
        
        if not self.models:
            return "Nincs tréningelt modell"
            
        report = []
        report.append("🤖 MECCS ELŐREJELZŐ TRÉNING JELENTÉS")
        report.append("=" * 50)
        report.append("")
        
        # Modellek összehasonlítása
        report.append("📊 MODELLEK TELJESÍTMÉNYE:")
        for model_name, model_data in self.models.items():
            report.append(f"  {model_name}:")
            report.append(f"    Accuracy: {model_data['accuracy']:.3f}")
            report.append(f"    CV Mean: {model_data['cv_mean']:.3f} ± {model_data['cv_std']:.3f}")
            report.append(f"    Best params: {model_data['best_params']}")
            report.append("")
            
        # Feature importance (legjobb modell)
        best_model_name = max(self.models.keys(), key=lambda k: self.models[k]['accuracy'])
        if best_model_name in self.feature_importance:
            report.append(f"🎯 TOP 10 FEATURE ({best_model_name}):")
            importance = self.feature_importance[best_model_name]
            sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:10]
            
            for feature, score in sorted_features:
                report.append(f"  {feature}: {score:.3f}")
            report.append("")
            
        # Eredmény eloszlás
        report.append("📈 PREDIKCIÓS TELJESÍTMÉNY:")
        best_model_data = self.models[best_model_name]
        class_report = best_model_data['classification_report']
        
        for class_name in ['HOME_WIN', 'DRAW', 'AWAY_WIN']:
            if class_name in class_report:
                metrics = class_report[class_name]
                report.append(f"  {class_name}:")
                report.append(f"    Precision: {metrics['precision']:.3f}")
                report.append(f"    Recall: {metrics['recall']:.3f}")
                report.append(f"    F1-score: {metrics['f1-score']:.3f}")
                
        return "\n".join(report)


if __name__ == "__main__":
    # Teszt tréning
    logging.basicConfig(level=logging.INFO)
    
    trainer = MatchPredictorTrainer()
    
    try:
        # Modellek tréningelése
        results = trainer.train_models()
        
        # Jelentés
        report = trainer.create_training_report()
        print(report)
        
        # Jelentés mentése
        report_path = trainer.output_dir / f"training_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
            
        print(f"\n💾 Jelentés mentve: {report_path}")
        
    except Exception as e:
        logger.error(f"Hiba a tréning során: {e}")
        raise
"""
Meccs eredmény előrejelző bot
"""

import pandas as pd
import numpy as np
from pathlib import Path
import logging
from datetime import datetime
import joblib
import json
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

class MatchPredictor:
    """Meccs eredmény előrejelző bot"""
    
    def __init__(self, model_dir: str = None):
        if model_dir is None:
            # Relatív útvonal a betmentors mappából
            current_dir = Path(__file__).parent.parent.parent
            model_dir = current_dir / "models"
        self.model_dir = Path(model_dir)
        self.model = None
        self.scaler = None
        self.metadata = None
        self.feature_names = []
        
    def load_best_model(self, model_type: str = None) -> bool:
        """Legjobb modell betöltése"""
        
        if not self.model_dir.exists():
            logger.error(f"Model könyvtár nem található: {self.model_dir}")
            return False
            
        # Elérhető modellek keresése
        available_models = {}
        
        for model_subdir in self.model_dir.iterdir():
            if not model_subdir.is_dir():
                continue
                
            model_name = model_subdir.name
            
            # Legfrissebb modell keresése
            model_files = list(model_subdir.glob("model_*.joblib"))
            metadata_files = list(model_subdir.glob("metadata_*.json"))
            
            if model_files and metadata_files:
                # Legfrissebb fájlok
                latest_model = max(model_files, key=lambda x: x.stat().st_mtime)
                latest_metadata = max(metadata_files, key=lambda x: x.stat().st_mtime)
                
                # Metadata betöltése
                try:
                    with open(latest_metadata, 'r') as f:
                        metadata = json.load(f)
                        
                    available_models[model_name] = {
                        'model_path': latest_model,
                        'metadata_path': latest_metadata,
                        'metadata': metadata,
                        'accuracy': metadata.get('accuracy', 0)
                    }
                except Exception as e:
                    logger.warning(f"Hiba metadata betöltésekor: {latest_metadata}, {e}")
                    
        if not available_models:
            logger.error("Nem találhatók tréningelt modellek")
            return False
            
        # Modell kiválasztása
        if model_type and model_type in available_models:
            selected_model = available_models[model_type]
        else:
            # Legjobb accuracy alapján
            selected_model = max(available_models.values(), key=lambda x: x['accuracy'])
            model_type = [k for k, v in available_models.items() if v == selected_model][0]
            
        # Modell betöltése
        try:
            self.model = joblib.load(selected_model['model_path'])
            self.metadata = selected_model['metadata']
            self.feature_names = self.metadata.get('feature_names', [])
            
            logger.info(f"✅ Modell betöltve: {model_type}")
            logger.info(f"   Accuracy: {self.metadata.get('accuracy', 0):.3f}")
            logger.info(f"   Features: {len(self.feature_names)}")
            
            # Scaler betöltése (ha szükséges)
            if self.metadata.get('use_scaling', False):
                scaler_files = list(self.model_dir.glob("scaler_*.joblib"))
                if scaler_files:
                    latest_scaler = max(scaler_files, key=lambda x: x.stat().st_mtime)
                    self.scaler = joblib.load(latest_scaler)
                    logger.info("✅ Scaler betöltve")
                else:
                    logger.warning("Scaler szükséges, de nem található")
                    
            return True
            
        except Exception as e:
            logger.error(f"Hiba a modell betöltésekor: {e}")
            return False
            
    def predict_match(self, match_features: Dict) -> Dict:
        """Egy meccs eredményének előrejelzése"""
        
        if self.model is None:
            raise ValueError("Modell nincs betöltve. Használd a load_best_model() metódust.")
            
        # Features DataFrame-mé alakítása
        df = pd.DataFrame([match_features])
        
        # Hiányzó features pótlása - optimalizált módszer
        missing_features = {}
        for feature in self.feature_names:
            if feature not in df.columns:
                missing_features[feature] = 0  # Alapértelmezett érték
                
        if missing_features:
            # Egyszerre hozzáadjuk az összes hiányzó feature-t
            missing_df = pd.DataFrame([missing_features])
            df = pd.concat([df, missing_df], axis=1)
                
        # Feature sorrend
        X = df[self.feature_names]
        
        # Scaling (ha szükséges)
        if self.scaler is not None:
            X = self.scaler.transform(X)
            
        # Predikció
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        # Osztályok lekérése
        classes = self.model.classes_
        
        # Eredmény összeállítása
        result = {
            'prediction': prediction,
            'confidence': max(probabilities),
            'probabilities': {
                class_name: prob for class_name, prob in zip(classes, probabilities)
            },
            'model_info': {
                'model_type': self.metadata.get('model_name', 'unknown'),
                'accuracy': self.metadata.get('accuracy', 0),
                'timestamp': self.metadata.get('timestamp', '')
            }
        }
        
        return result
        
    def predict_matches_batch(self, matches_data: List[Dict]) -> List[Dict]:
        """Több meccs batch predikciója"""
        
        results = []
        
        for i, match_data in enumerate(matches_data):
            try:
                prediction = self.predict_match(match_data)
                prediction['match_index'] = i
                results.append(prediction)
                
            except Exception as e:
                logger.error(f"Hiba a {i}. meccs predikciójánál: {e}")
                results.append({
                    'match_index': i,
                    'error': str(e),
                    'prediction': None
                })
                
        return results
        
    def create_prediction_report(self, predictions: List[Dict], match_info: List[Dict] = None) -> str:
        """Predikciós jelentés létrehozása"""
        
        if not predictions:
            return "Nincs predikció"
            
        report = []
        report.append("🔮 MECCS ELŐREJELZÉSEK")
        report.append("=" * 50)
        report.append("")
        
        # Modell információ
        if predictions[0].get('model_info'):
            model_info = predictions[0]['model_info']
            report.append(f"🤖 Modell: {model_info.get('model_type', 'N/A')}")
            report.append(f"📊 Accuracy: {model_info.get('accuracy', 0):.3f}")
            report.append(f"📅 Tréning: {model_info.get('timestamp', 'N/A')}")
            report.append("")
            
        # Predikciók
        for i, pred in enumerate(predictions):
            if pred.get('error'):
                report.append(f"❌ Meccs {i+1}: Hiba - {pred['error']}")
                continue
                
            match_name = f"Meccs {i+1}"
            if match_info and i < len(match_info):
                info = match_info[i]
                home = info.get('home_team', 'Home')
                away = info.get('away_team', 'Away')
                match_name = f"{home} vs {away}"
                
            report.append(f"⚽ {match_name}")
            report.append(f"   🎯 Előrejelzés: {pred['prediction']}")
            report.append(f"   🎲 Biztonság: {pred['confidence']:.1%}")
            
            # Valószínűségek
            probs = pred['probabilities']
            report.append("   📊 Valószínűségek:")
            for outcome, prob in probs.items():
                report.append(f"      {outcome}: {prob:.1%}")
            report.append("")
            
        # Összefoglaló
        valid_predictions = [p for p in predictions if not p.get('error')]
        if valid_predictions:
            prediction_counts = {}
            for pred in valid_predictions:
                outcome = pred['prediction']
                prediction_counts[outcome] = prediction_counts.get(outcome, 0) + 1
                
            report.append("📈 ÖSSZEFOGLALÓ:")
            for outcome, count in prediction_counts.items():
                percentage = count / len(valid_predictions) * 100
                report.append(f"   {outcome}: {count} meccs ({percentage:.1f}%)")
                
        return "\n".join(report)
        
    def get_model_info(self) -> Dict:
        """Betöltött modell információi"""
        
        if self.model is None:
            return {"error": "Nincs betöltött modell"}
            
        return {
            "model_type": self.metadata.get('model_name', 'unknown'),
            "accuracy": self.metadata.get('accuracy', 0),
            "cv_mean": self.metadata.get('cv_mean', 0),
            "cv_std": self.metadata.get('cv_std', 0),
            "timestamp": self.metadata.get('timestamp', ''),
            "feature_count": len(self.feature_names),
            "uses_scaling": self.metadata.get('use_scaling', False),
            "best_params": self.metadata.get('best_params', {})
        }


if __name__ == "__main__":
    # Teszt predikció
    logging.basicConfig(level=logging.INFO)
    
    predictor = MatchPredictor()
    
    # Modell betöltése
    if predictor.load_best_model():
        
        # Modell info
        info = predictor.get_model_info()
        print("🤖 MODELL INFORMÁCIÓ:")
        for key, value in info.items():
            print(f"  {key}: {value}")
        print()
        
        # Teszt predikció (dummy adatok)
        test_match = {
            'ball_possession_home': 55,
            'ball_possession_away': 45,
            'shots_home': 12,
            'shots_away': 8,
            'total_goals': 2.5,
            'is_weekend': 1,
            'is_top_league': 1
        }
        
        try:
            prediction = predictor.predict_match(test_match)
            
            print("🔮 TESZT PREDIKCIÓ:")
            print(f"Előrejelzés: {prediction['prediction']}")
            print(f"Biztonság: {prediction['confidence']:.1%}")
            print("Valószínűségek:")
            for outcome, prob in prediction['probabilities'].items():
                print(f"  {outcome}: {prob:.1%}")
                
        except Exception as e:
            print(f"❌ Hiba a predikció során: {e}")
    else:
        print("❌ Nem sikerült modellt betölteni")
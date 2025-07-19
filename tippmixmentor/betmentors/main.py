#!/usr/bin/env python3
"""
BettingMentor AI System - Fő orchestrator
"""

import argparse
import logging
import sys
from pathlib import Path
from datetime import datetime

# Saját modulok
from data.data_processor import DataProcessor
from training.match_predictor_trainer import MatchPredictorTrainer
from mentor_bots.match_predictor.predictor import MatchPredictor
from mentor_bots.advanced_analyzer.value_bet_finder import ValueBetFinder

# Logging beállítása
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('betmentors.log')
    ]
)

logger = logging.getLogger(__name__)

class BettingMentorAI:
    """Fő BettingMentor AI rendszer"""
    
    def __init__(self):
        self.data_processor = DataProcessor()
        self.trainer = MatchPredictorTrainer()
        self.predictor = MatchPredictor()
        self.value_bet_finder = ValueBetFinder()
        
    def process_data(self):
        """Adatok feldolgozása"""
        logger.info("🔄 Adatok feldolgozása...")
        
        try:
            # Adatok összefoglalója
            summary = self.data_processor.get_data_summary()
            
            print("📊 ADATOK ÖSSZEFOGLALÓJA:")
            print(f"Összes meccs: {summary.get('total_matches', 0)}")
            print(f"Országok: {summary.get('countries', 0)}")
            print(f"Ligák: {summary.get('leagues', 0)}")
            print(f"Csapatok: {summary.get('teams', 0)}")
            
            if summary.get('result_distribution'):
                print("Eredmény eloszlás:")
                for result, count in summary['result_distribution'].items():
                    print(f"  {result}: {count}")
                    
            # ML dataset létrehozása
            ml_df = self.data_processor.create_ml_dataset()
            
            if not ml_df.empty:
                print(f"\n🤖 ML Dataset: {len(ml_df)} meccs, {len(ml_df.columns)} feature")
                return True
            else:
                print("❌ Nem sikerült ML datasetet létrehozni")
                return False
                
        except Exception as e:
            logger.error(f"Hiba az adatfeldolgozás során: {e}")
            return False
            
    def train_models(self):
        """Modellek tréningelése"""
        logger.info("🤖 Modellek tréningelése...")
        
        try:
            results = self.trainer.train_models()
            
            # Jelentés
            report = self.trainer.create_training_report()
            print(report)
            
            return True
            
        except Exception as e:
            logger.error(f"Hiba a tréning során: {e}")
            return False
            
    def make_predictions(self, test_data=None):
        """Predikciók készítése"""
        logger.info("🔮 Predikciók készítése...")
        
        try:
            # Modell betöltése
            if not self.predictor.load_best_model():
                print("❌ Nem sikerült modellt betölteni")
                return False
                
            # Modell info
            info = self.predictor.get_model_info()
            print("🤖 HASZNÁLT MODELL:")
            print(f"  Típus: {info.get('model_type', 'N/A')}")
            print(f"  Accuracy: {info.get('accuracy', 0):.3f}")
            print(f"  Features: {info.get('feature_count', 0)}")
            print()
            
            # Teszt predikciók (ha nincs valós adat)
            if test_data is None:
                test_data = [
                    {
                        'ball_possession_home': 58,
                        'ball_possession_away': 42,
                        'shots_home': 15,
                        'shots_away': 7,
                        'is_weekend': 1,
                        'is_top_league': 1
                    },
                    {
                        'ball_possession_home': 45,
                        'ball_possession_away': 55,
                        'shots_home': 8,
                        'shots_away': 12,
                        'is_weekend': 0,
                        'is_top_league': 0
                    }
                ]
                
                match_info = [
                    {'home_team': 'Arsenal', 'away_team': 'Chelsea'},
                    {'home_team': 'Barcelona', 'away_team': 'Real Madrid'}
                ]
            else:
                match_info = None
                
            # Predikciók
            predictions = self.predictor.predict_matches_batch(test_data)
            
            # Jelentés
            report = self.predictor.create_prediction_report(predictions, match_info)
            print(report)
            
            return True
            
        except Exception as e:
            logger.error(f"Hiba a predikció során: {e}")
            return False
            
    def find_value_bets(self):
        """Értékes fogadások keresése"""
        logger.info("💰 Értékes fogadások keresése...")
        
        try:
            # Adatok betöltése
            df = self.data_processor.load_all_sources()
            
            if df.empty:
                print("❌ Nincs adat az értékes fogadások kereséséhez")
                return False
                
            # Csak olyan meccsek, ahol vannak odds adatok
            odds_columns = ['odds_home', 'odds_draw', 'odds_away']
            df_with_odds = df.dropna(subset=odds_columns, how='all')
            
            if df_with_odds.empty:
                print("❌ Nincs odds adat az értékes fogadások kereséséhez")
                return False
                
            print(f"📊 Elemzés: {len(df_with_odds)} meccs odds adatokkal")
            
            # Értékes fogadások keresése
            value_bets = self.value_bet_finder.find_value_bets(df_with_odds)
            
            if not value_bets:
                print("📈 Nem találhatók értékes fogadások a jelenlegi kritériumokkal")
                return True
                
            # Jelentés
            report = self.value_bet_finder.create_value_bets_report(value_bets)
            print(report)
            
            return True
            
        except Exception as e:
            logger.error(f"Hiba az értékes fogadások keresése során: {e}")
            return False
            
    def full_pipeline(self):
        """Teljes pipeline futtatása"""
        logger.info("🚀 Teljes BettingMentor AI pipeline indítása...")
        
        print("🎯 BETTINGMENTOR AI SYSTEM")
        print("=" * 50)
        print()
        
        # 1. Adatok feldolgozása
        if not self.process_data():
            print("❌ Adatfeldolgozás sikertelen")
            return False
            
        print("\n" + "="*50 + "\n")
        
        # 2. Modellek tréningelése
        if not self.train_models():
            print("❌ Modell tréning sikertelen")
            return False
            
        print("\n" + "="*50 + "\n")
        
        # 3. Predikciók
        if not self.make_predictions():
            print("❌ Predikciók sikertelenül")
            return False
            
        print("\n🎉 TELJES PIPELINE SIKERESEN BEFEJEZVE!")
        return True


def main():
    """Fő függvény CLI argumentumokkal"""
    
    parser = argparse.ArgumentParser(description='BettingMentor AI System')
    parser.add_argument('command', choices=['data', 'train', 'predict', 'value-bets', 'full'], 
                       help='Futtatandó parancs')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Részletes kimenet')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        
    # AI rendszer inicializálása
    ai_system = BettingMentorAI()
    
    # Parancs végrehajtása
    if args.command == 'data':
        success = ai_system.process_data()
    elif args.command == 'train':
        success = ai_system.train_models()
    elif args.command == 'predict':
        success = ai_system.make_predictions()
    elif args.command == 'value-bets':
        success = ai_system.find_value_bets()
    elif args.command == 'full':
        success = ai_system.full_pipeline()
    else:
        print(f"Ismeretlen parancs: {args.command}")
        success = False
        
    # Kilépési kód
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
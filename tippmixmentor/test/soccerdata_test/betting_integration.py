#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Példa a soccerdata integrálására a BettingMentor projektbe.
Ez a script bemutatja, hogyan lehet a soccerdata által gyűjtött adatokat
felhasználni a fogadási predikciók készítéséhez.
"""

import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# Hozzáadjuk a projekt gyökérkönyvtárát a Python elérési úthoz
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

try:
    import soccerdata as sd
except ImportError:
    print("A soccerdata modul nem található. Telepítsd a következő paranccsal:")
    print("pip install soccerdata")
    sys.exit(1)

class DrawPredictionBot:
    """
    Egyszerű bot, amely a döntetlen kimenetelű mérkőzéseket próbálja megjósolni
    a soccerdata által gyűjtött adatok alapján.
    """
    
    def __init__(self, liga="ENG-Premier League", szezon="2023"):
        """Inicializálja a botot a megadott liga és szezon adataival."""
        self.liga = liga
        self.szezon = szezon
        self.model = None
        self.fbref = None
        self.output_dir = "test/soccerdata_test/output"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def collect_data(self):
        """Adatok gyűjtése a soccerdata segítségével."""
        print(f"Adatok gyűjtése a következő ligából: {self.liga}, szezon: {self.szezon}")
        
        try:
            self.fbref = sd.FBref(self.liga, self.szezon)
            
            # Mérkőzések ütemezésének lekérése
            meccsek = self.fbref.read_schedule()
            
            # Csapat statisztikák lekérése
            csapat_statisztikak = self.fbref.read_team_season_stats(stat_type="standard")
            
            return meccsek, csapat_statisztikak
            
        except Exception as e:
            print(f"Hiba az adatok gyűjtése során: {e}")
            return None, None
    
    def prepare_features(self, meccsek, csapat_statisztikak):
        """
        Feature-ök előkészítése a modell számára.
        Egyszerű feature-öket készítünk a mérkőzés és csapat adatokból.
        """
        print("Feature-ök előkészítése...")
        
        if meccsek is None or csapat_statisztikak is None:
            print("Nincsenek adatok a feature-ök előkészítéséhez.")
            return None, None
        
        # Csak a már lejátszott mérkőzéseket vesszük figyelembe
        meccsek = meccsek.dropna(subset=['GF', 'GA'])
        
        # Létrehozzuk a target változót: 1 ha döntetlen, 0 ha nem
        meccsek['is_draw'] = (meccsek['GF'] == meccsek['GA']).astype(int)
        
        # Csapat statisztikák hozzáadása a mérkőzésekhez
        merged_data = pd.DataFrame()
        
        for _, match in meccsek.iterrows():
            home_team = match['home']
            away_team = match['away']
            
            # Hazai csapat statisztikái
            home_stats = csapat_statisztikak[csapat_statisztikak['team'] == home_team]
            
            # Vendég csapat statisztikái
            away_stats = csapat_statisztikak[csapat_statisztikak['team'] == away_team]
            
            if home_stats.empty or away_stats.empty:
                continue
                
            # Egy sor létrehozása a mérkőzéshez
            row = {
                'match_id': match.get('match_id', ''),
                'date': match.get('date', ''),
                'home_team': home_team,
                'away_team': away_team,
                'home_goals': match.get('GF', 0),
                'away_goals': match.get('GA', 0),
                'is_draw': match['is_draw']
            }
            
            # Hazai csapat statisztikáinak hozzáadása
            for col in home_stats.columns:
                if col != 'team' and col != 'season':
                    try:
                        row[f'home_{col}'] = home_stats[col].values[0]
                    except:
                        row[f'home_{col}'] = np.nan
            
            # Vendég csapat statisztikáinak hozzáadása
            for col in away_stats.columns:
                if col != 'team' and col != 'season':
                    try:
                        row[f'away_{col}'] = away_stats[col].values[0]
                    except:
                        row[f'away_{col}'] = np.nan
            
            # Különbségek számítása
            for col in home_stats.columns:
                if col != 'team' and col != 'season':
                    try:
                        home_val = home_stats[col].values[0]
                        away_val = away_stats[col].values[0]
                        if isinstance(home_val, (int, float)) and isinstance(away_val, (int, float)):
                            row[f'diff_{col}'] = home_val - away_val
                    except:
                        pass
            
            merged_data = pd.concat([merged_data, pd.DataFrame([row])], ignore_index=True)
        
        # Hiányzó értékek kezelése
        merged_data = merged_data.fillna(0)
        
        # Feature-ök és target változó szétválasztása
        features = merged_data.drop(['match_id', 'date', 'home_team', 'away_team', 
                                    'home_goals', 'away_goals', 'is_draw'], axis=1)
        target = merged_data['is_draw']
        
        return features, target
    
    def train_model(self, features, target):
        """Modell betanítása a feature-ök és target változó alapján."""
        print("Modell betanítása...")
        
        if features is None or target is None:
            print("Nincsenek adatok a modell betanításához.")
            return False
        
        # Adatok felosztása tanító és teszt halmazra
        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=0.2, random_state=42
        )
        
        # Random Forest modell létrehozása és betanítása
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_train, y_train)
        
        # Modell kiértékelése
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Modell pontossága: {accuracy:.4f}")
        
        # Részletes kiértékelés
        print("\nOsztályozási jelentés:")
        print(classification_report(y_test, y_pred))
        
        # Modell mentése
        joblib.dump(self.model, f"{self.output_dir}/draw_prediction_model.pkl")
        print(f"Modell elmentve: {self.output_dir}/draw_prediction_model.pkl")
        
        return True
    
    def predict_upcoming_matches(self):
        """Közelgő mérkőzések predikciója."""
        print("Közelgő mérkőzések predikciója...")
        
        if self.model is None:
            print("Nincs betanított modell.")
            return None
        
        try:
            # Közelgő mérkőzések lekérése
            upcoming_matches = self.fbref.read_schedule()
            
            # Csak a még nem lejátszott mérkőzéseket vesszük figyelembe
            upcoming_matches = upcoming_matches[upcoming_matches['GF'].isna()]
            
            if upcoming_matches.empty:
                print("Nincsenek közelgő mérkőzések.")
                return None
            
            # Csapat statisztikák lekérése
            csapat_statisztikak = self.fbref.read_team_season_stats(stat_type="standard")
            
            # Predikciók készítése
            predictions = []
            
            for _, match in upcoming_matches.iterrows():
                home_team = match['home']
                away_team = match['away']
                
                # Hazai csapat statisztikái
                home_stats = csapat_statisztikak[csapat_statisztikak['team'] == home_team]
                
                # Vendég csapat statisztikái
                away_stats = csapat_statisztikak[csapat_statisztikak['team'] == away_team]
                
                if home_stats.empty or away_stats.empty:
                    continue
                
                # Feature-ök létrehozása
                features = {}
                
                # Hazai csapat statisztikáinak hozzáadása
                for col in home_stats.columns:
                    if col != 'team' and col != 'season':
                        try:
                            features[f'home_{col}'] = home_stats[col].values[0]
                        except:
                            features[f'home_{col}'] = 0
                
                # Vendég csapat statisztikáinak hozzáadása
                for col in away_stats.columns:
                    if col != 'team' and col != 'season':
                        try:
                            features[f'away_{col}'] = away_stats[col].values[0]
                        except:
                            features[f'away_{col}'] = 0
                
                # Különbségek számítása
                for col in home_stats.columns:
                    if col != 'team' and col != 'season':
                        try:
                            home_val = home_stats[col].values[0]
                            away_val = away_stats[col].values[0]
                            if isinstance(home_val, (int, float)) and isinstance(away_val, (int, float)):
                                features[f'diff_{col}'] = home_val - away_val
                        except:
                            pass
                
                # Predikció
                features_df = pd.DataFrame([features])
                
                # Hiányzó oszlopok kezelése
                for col in self.model.feature_names_in_:
                    if col not in features_df.columns:
                        features_df[col] = 0
                
                # Csak a modell által használt oszlopokat tartjuk meg
                features_df = features_df[self.model.feature_names_in_]
                
                # Predikció
                draw_prob = self.model.predict_proba(features_df)[0][1]
                is_draw_prediction = 1 if draw_prob > 0.5 else 0
                
                predictions.append({
                    'date': match.get('date', ''),
                    'home_team': home_team,
                    'away_team': away_team,
                    'draw_probability': draw_prob,
                    'is_draw_prediction': is_draw_prediction
                })
            
            # Predikciók DataFrame-be rendezése
            predictions_df = pd.DataFrame(predictions)
            
            # Predikciók mentése
            predictions_df.to_csv(f"{self.output_dir}/draw_predictions.csv", index=False)
            print(f"Predikciók elmentve: {self.output_dir}/draw_predictions.csv")
            
            return predictions_df
            
        except Exception as e:
            print(f"Hiba a predikciók készítése során: {e}")
            import traceback
            traceback.print_exc()
            return None

def main():
    """Fő függvény a soccerdata és BettingMentor integrációjának teszteléséhez."""
    print("SoccerData és BettingMentor integráció teszt")
    print("=" * 50)
    
    # Bot létrehozása
    bot = DrawPredictionBot(liga="ENG-Premier League", szezon="2023")
    
    # Adatok gyűjtése
    meccsek, csapat_statisztikak = bot.collect_data()
    
    if meccsek is not None and csapat_statisztikak is not None:
        # Feature-ök előkészítése
        features, target = bot.prepare_features(meccsek, csapat_statisztikak)
        
        if features is not None and target is not None:
            # Modell betanítása
            if bot.train_model(features, target):
                # Közelgő mérkőzések predikciója
                predictions = bot.predict_upcoming_matches()
                
                if predictions is not None and not predictions.empty:
                    print("\nTop 5 legvalószínűbb döntetlen mérkőzés:")
                    top_draws = predictions.sort_values(by='draw_probability', ascending=False).head(5)
                    print(top_draws[['date', 'home_team', 'away_team', 'draw_probability']])

if __name__ == "__main__":
    main()
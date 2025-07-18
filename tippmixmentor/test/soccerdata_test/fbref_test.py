#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Egyszerű teszt a soccerdata FBref funkcionalitásának bemutatására.
Ez a script bemutatja, hogyan lehet adatokat lekérni az FBref adatforrásból
és hogyan lehet azokat feldolgozni a BettingMentor projektben.
"""

import os
import sys
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

# Hozzáadjuk a projekt gyökérkönyvtárát a Python elérési úthoz
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

try:
    import soccerdata as sd
except ImportError:
    print("A soccerdata modul nem található. Telepítsd a következő paranccsal:")
    print("pip install soccerdata")
    sys.exit(1)

def main():
    """Fő függvény a soccerdata teszteléséhez."""
    print("SoccerData FBref teszt")
    print("=" * 50)
    
    # Beállítjuk a liga és szezon paramétereket
    liga = "ENG-Premier League"  # Angol Premier League
    szezon = "2023"  # 2022-2023-as szezon
    
    print(f"Liga: {liga}")
    print(f"Szezon: {szezon}")
    print("-" * 50)
    
    try:
        # FBref adatforrás inicializálása
        print("FBref adatforrás inicializálása...")
        fbref = sd.FBref(liga, szezon)
        
        # Mérkőzések ütemezésének lekérése
        print("\nMérkőzések ütemezésének lekérése...")
        meccsek = fbref.read_schedule()
        print(f"Összesen {len(meccsek)} mérkőzés található az adatbázisban.")
        print("\nElső 5 mérkőzés:")
        print(meccsek.head())
        
        # Csapat szezon statisztikák lekérése
        print("\nCsapat passzolási statisztikák lekérése...")
        csapat_statisztikak = fbref.read_team_season_stats(stat_type="passing")
        print("\nCsapat passzolási statisztikák (első 5 csapat):")
        print(csapat_statisztikak.head())
        
        # Játékos szezon statisztikák lekérése
        print("\nJátékos standard statisztikák lekérése...")
        jatekos_statisztikak = fbref.read_player_season_stats(stat_type="standard")
        print("\nJátékos standard statisztikák (első 5 játékos):")
        print(jatekos_statisztikak.head())
        
        # Adatok mentése CSV fájlokba
        output_dir = "test/soccerdata_test/output"
        os.makedirs(output_dir, exist_ok=True)
        
        meccsek.to_csv(f"{output_dir}/meccsek_{liga}_{szezon}.csv", index=False)
        csapat_statisztikak.to_csv(f"{output_dir}/csapat_statisztikak_{liga}_{szezon}.csv", index=False)
        jatekos_statisztikak.to_csv(f"{output_dir}/jatekos_statisztikak_{liga}_{szezon}.csv", index=False)
        
        print(f"\nAz adatok sikeresen mentve a {output_dir} mappába.")
        
        # Egyszerű adatelemzés és vizualizáció
        print("\nEgyszerű adatelemzés végrehajtása...")
        
        # Hazai és vendég gólok átlaga
        hazai_golok_atlag = meccsek['GF'].mean()
        vendeg_golok_atlag = meccsek['GA'].mean()
        
        print(f"Hazai gólok átlaga: {hazai_golok_atlag:.2f}")
        print(f"Vendég gólok átlaga: {vendeg_golok_atlag:.2f}")
        
        # Top 5 legtöbb gólt szerző csapat
        if 'GF' in csapat_statisztikak.columns:
            top_golszerzo_csapatok = csapat_statisztikak.sort_values(by='GF', ascending=False).head(5)
            print("\nTop 5 legtöbb gólt szerző csapat:")
            print(top_golszerzo_csapatok[['team', 'GF']])
        
        # Top 5 legtöbb gólt szerző játékos
        if 'goals' in jatekos_statisztikak.columns:
            top_golszerzo_jatekosok = jatekos_statisztikak.sort_values(by='goals', ascending=False).head(5)
            print("\nTop 5 legtöbb gólt szerző játékos:")
            print(top_golszerzo_jatekosok[['player', 'team', 'goals']])
        
        print("\nA teszt sikeresen lefutott!")
        
    except Exception as e:
        print(f"\nHiba történt: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
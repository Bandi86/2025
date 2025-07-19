#!/usr/bin/env python3
"""
BettingMentor AI System setup script
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Parancs futtatása leírással"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} sikeres")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} sikertelen: {e}")
        print(f"Hiba: {e.stderr}")
        return False

def setup_environment():
    """Környezet beállítása"""
    
    print("🎯 BETTINGMENTOR AI SYSTEM SETUP")
    print("=" * 50)
    
    # Python verzió ellenőrzése
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print(f"❌ Python 3.8+ szükséges, jelenlegi: {python_version.major}.{python_version.minor}")
        return False
        
    print(f"✅ Python verzió: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # Könyvtárak létrehozása
    directories = [
        "data/processed",
        "data/merged", 
        "data/features",
        "training/models",
        "training/experiments",
        "mentor_bots/match_predictor",
        "mentor_bots/value_finder",
        "mentor_bots/risk_analyzer",
        "logs"
    ]
    
    print("\n📁 Könyvtárak létrehozása...")
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"  ✅ {directory}")
    
    # Requirements telepítése
    print("\n📦 Python csomagok telepítése...")
    if not run_command("pip install -r requirements.txt", "Függőségek telepítése"):
        print("⚠️  Próbáld: pip3 install -r requirements.txt")
        if not run_command("pip3 install -r requirements.txt", "Függőségek telepítése (pip3)"):
            return False
    
    # __init__.py fájlok létrehozása
    print("\n🐍 Python csomagok inicializálása...")
    init_files = [
        "data/__init__.py",
        "training/__init__.py", 
        "mentor_bots/__init__.py",
        "mentor_bots/match_predictor/__init__.py",
        "mentor_bots/value_finder/__init__.py",
        "mentor_bots/risk_analyzer/__init__.py"
    ]
    
    for init_file in init_files:
        Path(init_file).touch()
        print(f"  ✅ {init_file}")
    
    # Jogosultságok beállítása
    print("\n🔐 Jogosultságok beállítása...")
    os.chmod("main.py", 0o755)
    os.chmod("setup.py", 0o755)
    
    print("\n🎉 SETUP SIKERESEN BEFEJEZVE!")
    print("\n🚀 Használat:")
    print("  python main.py data      # Adatok feldolgozása")
    print("  python main.py train     # Modellek tréningelése") 
    print("  python main.py predict   # Predikciók készítése")
    print("  python main.py full      # Teljes pipeline")
    
    return True

def check_data_sources():
    """Adatforrások ellenőrzése"""
    
    print("\n🔍 ADATFORRÁSOK ELLENŐRZÉSE:")
    
    # Flashscore scraper adatok
    flashscore_path = Path("../webscrapper/automated-flashscore-scraper/scraped_data")
    if flashscore_path.exists():
        countries = list(flashscore_path.iterdir())
        print(f"✅ Flashscore adatok: {len(countries)} ország")
        
        total_matches = 0
        for country_dir in countries:
            if country_dir.is_dir():
                for league_dir in country_dir.iterdir():
                    if league_dir.is_dir():
                        for season_dir in league_dir.iterdir():
                            if season_dir.is_dir():
                                json_files = list(season_dir.glob("*.json"))
                                total_matches += len(json_files)
                                
        print(f"   Becsült meccsek: {total_matches} fájl")
    else:
        print("⚠️  Flashscore adatok nem találhatók")
        print("   Futtasd előbb a webscrapper-t!")
    
    # TODO: Egyéb adatforrások ellenőrzése
    
    return True

if __name__ == "__main__":
    if setup_environment():
        check_data_sources()
    else:
        print("\n❌ Setup sikertelen!")
        sys.exit(1)
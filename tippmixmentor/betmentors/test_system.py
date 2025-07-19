#!/usr/bin/env python3
"""
BettingMentor AI System gyors teszt
"""

import sys
import logging
from pathlib import Path

# Logging beállítása
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def test_imports():
    """Importok tesztelése"""
    print("🧪 IMPORTOK TESZTELÉSE:")
    
    try:
        import pandas as pd
        print(f"✅ pandas {pd.__version__}")
    except ImportError as e:
        print(f"❌ pandas: {e}")
        return False
        
    try:
        import numpy as np
        print(f"✅ numpy {np.__version__}")
    except ImportError as e:
        print(f"❌ numpy: {e}")
        return False
        
    try:
        import sklearn
        print(f"✅ scikit-learn {sklearn.__version__}")
    except ImportError as e:
        print(f"❌ scikit-learn: {e}")
        return False
        
    try:
        import joblib
        print(f"✅ joblib {joblib.__version__}")
    except ImportError as e:
        print(f"❌ joblib: {e}")
        return False
        
    return True

def test_data_loader():
    """Data loader tesztelése"""
    print("\n📊 DATA LOADER TESZT:")
    
    try:
        from data.sources.flashscore_loader import FlashscoreDataLoader
        
        loader = FlashscoreDataLoader()
        leagues = loader.get_available_leagues()
        
        print(f"✅ FlashscoreDataLoader működik")
        print(f"   Elérhető ligák: {len(leagues)}")
        
        if leagues:
            print("   Példa ligák:")
            for league in leagues[:3]:
                print(f"     {league['country']}/{league['league']}")
                
        return True
        
    except Exception as e:
        print(f"❌ FlashscoreDataLoader hiba: {e}")
        return False

def test_data_processor():
    """Data processor tesztelése"""
    print("\n🔄 DATA PROCESSOR TESZT:")
    
    try:
        from data.data_processor import DataProcessor
        
        processor = DataProcessor()
        summary = processor.get_data_summary()
        
        print(f"✅ DataProcessor működik")
        print(f"   Összes meccs: {summary.get('total_matches', 0)}")
        print(f"   Országok: {summary.get('countries', 0)}")
        print(f"   Ligák: {summary.get('leagues', 0)}")
        
        return True
        
    except Exception as e:
        print(f"❌ DataProcessor hiba: {e}")
        return False

def test_file_structure():
    """Fájlstruktúra tesztelése"""
    print("\n📁 FÁJLSTRUKTÚRA TESZT:")
    
    required_dirs = [
        "data/sources",
        "data/processed", 
        "training/models",
        "mentor_bots/match_predictor"
    ]
    
    all_exist = True
    for directory in required_dirs:
        if Path(directory).exists():
            print(f"✅ {directory}")
        else:
            print(f"❌ {directory} hiányzik")
            all_exist = False
            
    return all_exist

def test_main_system():
    """Fő rendszer tesztelése"""
    print("\n🤖 FŐ RENDSZER TESZT:")
    
    try:
        from main import BettingMentorAI
        
        ai_system = BettingMentorAI()
        print("✅ BettingMentorAI inicializálva")
        
        # Gyors adatfeldolgozás teszt
        summary = ai_system.data_processor.get_data_summary()
        if summary.get('total_matches', 0) > 0:
            print(f"✅ Adatok elérhetők: {summary['total_matches']} meccs")
        else:
            print("⚠️  Nincs adat - futtasd előbb a scraper-t")
            
        return True
        
    except Exception as e:
        print(f"❌ BettingMentorAI hiba: {e}")
        return False

def main():
    """Fő teszt függvény"""
    
    print("🎯 BETTINGMENTOR AI SYSTEM TESZT")
    print("=" * 50)
    
    tests = [
        ("Importok", test_imports),
        ("Fájlstruktúra", test_file_structure), 
        ("Data Loader", test_data_loader),
        ("Data Processor", test_data_processor),
        ("Fő Rendszer", test_main_system)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                print(f"⚠️  {test_name} teszt részben sikertelen")
        except Exception as e:
            print(f"❌ {test_name} teszt hiba: {e}")
            
    print("\n" + "=" * 50)
    print(f"📊 TESZT EREDMÉNYEK: {passed}/{total} sikeres")
    
    if passed == total:
        print("🎉 Minden teszt sikeres! A rendszer használatra kész.")
        return True
    elif passed >= total * 0.7:
        print("⚠️  A legtöbb teszt sikeres, de vannak problémák.")
        return True
    else:
        print("❌ Túl sok teszt sikertelen. Ellenőrizd a setup-ot!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
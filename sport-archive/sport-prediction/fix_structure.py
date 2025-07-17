#!/usr/bin/env python3
"""
🔧 PROJEKT STRUKTÚRA JAVÍTÓ
Javítja az import path-okat az új struktúrához
"""

import os
import sys

def fix_daily_assistant():
    """Javítja a daily_betting_assistant.py fájlt"""
    file_path = "/home/bandi/Documents/code/2025/sport-prediction/src/tools/daily_betting_assistant.py"

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Javítjuk a data loading részt
    old_pattern = '''        print("📚 Múltbeli szezonok betöltése (tanítási adatok)...")
        historical_data = load_data(['pl2223.csv', 'pl2324.csv'])'''

    new_pattern = '''        print("📚 Múltbeli szezonok betöltése (tanítási adatok)...")
        # Adatok betöltése a data könyvtárból
        data_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'premier_league')
        historical_data = load_data([
            os.path.join(data_path, 'pl2223.csv'),
            os.path.join(data_path, 'pl2324.csv')
        ])'''

    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        print("✅ Daily assistant paths javítva")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    print("🔧 Projekt struktúra javítása...")
    fix_daily_assistant()
    print("✅ Javítás kész!")

if __name__ == "__main__":
    main()

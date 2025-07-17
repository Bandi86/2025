#!/usr/bin/env python3
"""
Simple Test with Real Finished Match
====================================

Egyszerű teszt egy VALÓS befejezett meccs linkkel.
Nem keresünk automatikusan, hanem egy konkrét linket használunk ami már befejeződött.
"""

import sys
import os
import json
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
scripts_dir = os.path.join(parent_dir, 'scripts')
sys.path.insert(0, parent_dir)
sys.path.insert(0, scripts_dir)

# Import our scraper
from sources.flashscore import FlashScoreScraper

def test_real_finished_match():
    """
    Tesztelünk egy konkrét befejezett meccs linket.
    """

    # VALÓS befejezett meccs linkek - ezeket manuálisan kell megkeresni a FlashScore-on
    # Például tegnapi vagy múlt heti meccsek
    test_matches = [
        {
            "name": "Test Match 1",
            "url": "https://www.flashscore.com/match/football/MaSHdxIF/#/match-summary",
            "note": "Ez valószínűleg még nem játszódott le - csak teszt"
        }
        # Itt kellene valós befejezett meccs linkeket felvenni!
    ]

    print("🚀 Testing with real finished match...")
    print("⚠️  FIGYELEM: Valós befejezett meccs linket kell használni!")
    print("📋 Jelenlegi teszt linkek:")

    for i, match in enumerate(test_matches):
        print(f"  {i+1}. {match['name']}: {match['url']}")
        print(f"     {match['note']}")

    print("\n❌ PROBLÉMA: Nincsenek valós befejezett meccs linkek!")
    print("🔧 MEGOLDÁS:")
    print("   1. Menj a FlashScore.com-ra")
    print("   2. Keress egy befejezett meccset (pl. tegnapi eredmények)")
    print("   3. Másold ki a meccs URL-jét")
    print("   4. Add hozzá a test_matches listához")
    print("   5. Futtasd újra a szkriptet")

    print("\n📖 Példa valós befejezett meccs URL:")
    print("   https://www.flashscore.com/match/football/XXXXXXXXX/#/match-summary")
    print("   (ahol XXXXXXXXX egy valós meccs ID)")

    return False

def main():
    """Main test function."""
    print("🧪 Simple Test with Real Finished Match")
    print("=" * 50)

    # Set up logging
    logging.basicConfig(level=logging.INFO)

    success = test_real_finished_match()

    if not success:
        print("\n❌ Test nem futott le - valós meccs link szükséges!")
        return

    print("\n✅ Test completed!")

if __name__ == "__main__":
    main()

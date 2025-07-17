#!/usr/bin/env python3
"""
Detailed debug for league table insertion
"""

import sqlite3
import sys
import traceback
from data_loader_pipeline import DatabaseLoader

def detailed_debug():
    """Részletes debug"""

    print("🔍 RÉSZLETES TABELLA DEBUG")
    print("=" * 40)

    # Create database loader with debugging
    db_loader = DatabaseLoader("data/football_database.db")

    # Simple test data exactly matching our processor output
    test_table = {
        'league': 'Premier Liga',
        'teams': [
            {
                'team_name': 'Arsenal',
                'position': 1,
                'matches_played': 16,
                'wins': 14,
                'draws': 1,
                'losses': 1,
                'goals_for': 40,
                'goals_against': 14,
                'goal_difference': 26,
                'points': 43
            }
        ],
        'date': '2025-01-15',
        'season': '2024/25',
        'matchday': 16
    }

    print(f"Teszt tabella adatok:")
    print(f"  Liga: {test_table['league']}")
    print(f"  Dátum: {test_table['date']}")
    print(f"  Szezon: {test_table['season']}")
    print(f"  Forduló: {test_table['matchday']}")
    print(f"  Csapatok: {len(test_table['teams'])}")

    if test_table['teams']:
        team = test_table['teams'][0]
        print(f"  Első csapat: {team['team_name']}")
        print(f"    Pozíció: {team['position']}")
        print(f"    Pontok: {team['points']}")

    print(f"\n🔄 Mentés kezdése...")

    try:
        # Check if database is accessible
        with sqlite3.connect("data/football_database.db") as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM league_tables")
            initial_count = cursor.fetchone()[0]
            print(f"  Kezdeti tabella bejegyzések: {initial_count}")

        # Try the insertion
        success = db_loader.load_league_table(
            table_data=test_table,
            source_pdf="detailed_debug.pdf",
            confidence=0.9
        )

        print(f"  Mentés eredménye: {'✅ Sikeres' if success else '❌ Sikertelen'}")

        # Check final count
        with sqlite3.connect("data/football_database.db") as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM league_tables")
            final_count = cursor.fetchone()[0]
            print(f"  Végső tabella bejegyzések: {final_count}")
            print(f"  Változás: +{final_count - initial_count}")

        if final_count > initial_count:
            print("✅ Sikeres mentés!")
        else:
            print("❌ Nincs új bejegyzés")

    except Exception as e:
        print(f"❌ Hiba történt:")
        print(f"   Típus: {type(e).__name__}")
        print(f"   Üzenet: {str(e)}")
        print(f"   Traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    detailed_debug()

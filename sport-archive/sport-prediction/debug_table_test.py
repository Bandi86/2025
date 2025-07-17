#!/usr/bin/env python3
"""
Tabella mentés debug teszt
"""

import sqlite3
from data_loader_pipeline import DatabaseLoader

def debug_table_insertion():
    """Tabella mentés debug"""

    db_loader = DatabaseLoader("data/football_database.db")

    # Simple test table data
    test_table = {
        'league': 'Test Liga',
        'date': '2025-01-15',
        'season': '2024/25',
        'matchday': 10,
        'teams': [
            {
                'team_name': 'Test Team A',
                'position': 1,
                'matches_played': 10,
                'wins': 8,
                'draws': 1,
                'losses': 1,
                'goals_for': 25,
                'goals_against': 8,
                'goal_difference': 17,
                'points': 25
            },
            {
                'team_name': 'Test Team B',
                'position': 2,
                'matches_played': 10,
                'wins': 6,
                'draws': 2,
                'losses': 2,
                'goals_for': 18,
                'goals_against': 12,
                'goal_difference': 6,
                'points': 20
            }
        ]
    }

    print("🧪 TABELLA MENTÉS DEBUG TESZT")
    print("=" * 40)
    print(f"Teszt tabella: {test_table['league']}")
    print(f"Csapatok száma: {len(test_table['teams'])}")

    try:
        success = db_loader.load_league_table(
            table_data=test_table,
            source_pdf="debug_test.pdf",
            confidence=0.9
        )

        if success:
            print("✅ Tabella mentése sikeres")

            # Ellenőrzés
            with sqlite3.connect("data/football_database.db") as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM league_tables WHERE league = ?", (test_table['league'],))
                count = cursor.fetchone()[0]
                print(f"✅ Adatbázisban {count} rekord található")
        else:
            print("❌ Tabella mentése sikertelen")

    except Exception as e:
        print(f"❌ Hiba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_table_insertion()

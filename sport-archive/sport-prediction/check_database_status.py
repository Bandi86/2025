#!/usr/bin/env python3
"""
Adatbázis állapot ellenőrző és statisztikai szkript
"""

import sqlite3
from pathlib import Path
from datetime import datetime

def check_database_status():
    """Adatbázis állapot részletes ellenőrzése"""

    db_path = Path(__file__).parent / 'data' / 'football_database.db'

    if not db_path.exists():
        print("❌ Adatbázis nem található!")
        return

    print("🔍 ADATBÁZIS ÁLLAPOT ELLENŐRZÉS")
    print("=" * 50)
    print(f"📁 Adatbázis: {db_path}")
    print(f"📏 Fájl méret: {db_path.stat().st_size / 1024:.1f} KB")
    print(f"🕒 Utolsó módosítás: {datetime.fromtimestamp(db_path.stat().st_mtime)}")
    print()

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row

    try:
        # Táblák és rekord számok
        print("📊 TÁBLÁK ÉS REKORDOK:")
        print("-" * 30)

        tables = [
            'teams', 'team_statistics', 'historical_matches', 'future_matches',
            'league_tables', 'betting_odds', 'extraction_logs',
            'manual_corrections', 'data_quality_metrics'
        ]

        for table in tables:
            try:
                cursor = conn.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"  {table:20}: {count:6} rekord")
            except Exception as e:
                print(f"  {table:20}: HIBA - {e}")

        print()

        # Csapatok részletes listázása
        print("👥 CSAPATOK:")
        print("-" * 30)
        cursor = conn.execute("""
            SELECT team_id, team_name, normalized_name, country, last_seen
            FROM teams
            ORDER BY team_id
        """)
        teams = cursor.fetchall()

        for team in teams:
            print(f"  ID: {team['team_id']:2} | {team['team_name']:20} | {team['normalized_name']:20} | {team['country']}")

        print()

        # Meccsek részletes listázása
        print("⚽ TÖRTÉNELMI MECCSEK:")
        print("-" * 30)
        cursor = conn.execute("""
            SELECT match_id, date, home_team, away_team, home_score, away_score,
                   league, source_pdf, extraction_confidence
            FROM historical_matches
            ORDER BY match_id
            LIMIT 10
        """)
        matches = cursor.fetchall()

        for match in matches:
            score = f"{match['home_score']}-{match['away_score']}" if match['home_score'] is not None else "N/A"
            print(f"  ID: {match['match_id']:2} | {match['date']} | {match['home_team']:15} vs {match['away_team']:15} | {score} | {match['league']}")
            print(f"       Forrás: {match['source_pdf']} | Bizonyosság: {match['extraction_confidence']:.2f}")

        if len(matches) == 10:
            cursor = conn.execute("SELECT COUNT(*) FROM historical_matches")
            total = cursor.fetchone()[0]
            print(f"  ... és még {total - 10} meccs")

        print()

        # Feldolgozási statisztikák
        print("📈 FELDOLGOZÁSI STATISZTIKÁK:")
        print("-" * 30)
        cursor = conn.execute("""
            SELECT status, COUNT(*) as count,
                   AVG(avg_confidence) as avg_conf,
                   SUM(matches_found) as total_matches
            FROM extraction_logs
            GROUP BY status
        """)
        stats = cursor.fetchall()

        for stat in stats:
            print(f"  {stat['status']:15}: {stat['count']:3} fájl | Átlag bizonyosság: {stat['avg_conf']:.2f} | Meccsek: {stat['total_matches']}")

        print()

        # Adatminőségi metrikák
        print("📏 ADATMINŐSÉGI METRIKÁK:")
        print("-" * 30)
        cursor = conn.execute("""
            SELECT metric_name, metric_value, metric_target, measurement_date
            FROM data_quality_metrics
            ORDER BY metric_name
        """)
        metrics = cursor.fetchall()

        for metric in metrics:
            status = "✅" if metric['metric_value'] >= metric['metric_target'] else "❌"
            print(f"  {status} {metric['metric_name']:25}: {metric['metric_value']:6.2f} / {metric['metric_target']:6.2f}")

        print()

        # Liga összesítés
        print("🏆 LIGA ÖSSZESÍTÉS:")
        print("-" * 30)
        cursor = conn.execute("""
            SELECT league, COUNT(*) as match_count,
                   COUNT(DISTINCT home_team) + COUNT(DISTINCT away_team) as team_count
            FROM historical_matches
            GROUP BY league
            ORDER BY match_count DESC
        """)
        leagues = cursor.fetchall()

        for league in leagues:
            print(f"  {league['league']:20}: {league['match_count']:3} meccs | ~{league['team_count']:2} csapat")

        print()
        print("✅ Adatbázis ellenőrzés befejezve!")

    except Exception as e:
        print(f"❌ Hiba az adatbázis ellenőrzésekor: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_database_status()

#!/home/bandi/Documents/code/2025/sp3/.venv/bin/python
"""
Quick database validation script to check data integrity after JSON import
"""
import subprocess
import json

def run_query(query):
    """Run a PostgreSQL query using docker exec"""
    cmd = [
        'docker', 'exec', 'sp3_postgres',
        'psql', '-U', 'sp3_user', '-d', 'sp3_db',
        '-c', query, '-t'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        return result.stdout.strip()
    else:
        print(f"Query error: {result.stderr}")
        return None

def main():
    print("🔍 ADATBÁZIS VALIDÁCIÓ")
    print("=" * 50)

    # Basic counts
    matches = run_query("SELECT COUNT(*) FROM matches;")
    teams = run_query("SELECT COUNT(*) FROM teams;")
    competitions = run_query("SELECT COUNT(*) FROM competitions;")
    markets = run_query("SELECT COUNT(*) FROM markets;")
    odds = run_query("SELECT COUNT(*) FROM odds;")

    print(f"📊 Alapvető statisztikák:")
    print(f"  - Meccsek: {matches}")
    print(f"  - Csapatok: {teams}")
    print(f"  - Bajnokságok: {competitions}")
    print(f"  - Piacok: {markets}")
    print(f"  - Esélyek: {odds}")
    print()

    # Sample data
    print("🔍 Minta adatok:")
    sample_matches = run_query("""
        SELECT m.id, ht.name as home_team, at.name as away_team, c.name as competition, m.date
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        JOIN competitions c ON m.competition_id = c.id
        LIMIT 5;
    """)
    print("Első 5 meccs:")
    print(sample_matches)
    print()

    # Data integrity checks
    print("🔍 Integritási ellenőrzések:")

    # Orphaned matches
    orphaned = run_query("""
        SELECT COUNT(*) FROM matches m
        WHERE NOT EXISTS (SELECT 1 FROM teams ht WHERE ht.id = m.home_team_id)
           OR NOT EXISTS (SELECT 1 FROM teams at WHERE at.id = m.away_team_id)
           OR NOT EXISTS (SELECT 1 FROM competitions c WHERE c.id = m.competition_id);
    """)
    print(f"  - Árva meccsek (hibás referenciák): {orphaned}")

    # Markets without matches
    orphaned_markets = run_query("""
        SELECT COUNT(*) FROM markets mk
        WHERE NOT EXISTS (SELECT 1 FROM matches m WHERE m.id = mk.match_id);
    """)
    print(f"  - Árva piacok: {orphaned_markets}")

    # Odds without markets
    orphaned_odds = run_query("""
        SELECT COUNT(*) FROM odds o
        WHERE NOT EXISTS (SELECT 1 FROM markets mk WHERE mk.id = o.market_id);
    """)
    print(f"  - Árva esélyek: {orphaned_odds}")

    print()
    print("✅ Validáció befejezve!")

if __name__ == "__main__":
    main()

"""
Test Enhanced Match Collector - Gyors tesztelés
"""

from src.agents.match_collector.team_database import TeamDatabase
from src.agents.match_collector.source_collectors import ESPNCollector
from src.agents.match_collector.match_validator import MatchValidator

def test_components():
    print("🧪 Komponensek tesztelése...")

    # Team Database teszt
    team_db = TeamDatabase()
    print(f"✅ Team Database: {len(team_db._all_teams)} csapat betöltve")

    # Csapat validáció teszt
    valid_pair = team_db.is_valid_team_pair("Arsenal", "Chelsea")
    print(f"✅ Arsenal vs Chelsea valid: {valid_pair}")

    # ESPN Collector teszt
    espn = ESPNCollector()
    print("✅ ESPN Collector inicializálva")

    # Validator teszt
    validator = MatchValidator(team_db)
    print("✅ Validator inicializálva")

    # Demo fixture teszt
    demo_fixture = {
        'id': 'test_match',
        'home_team': 'Arsenal',
        'away_team': 'Chelsea',
        'date': '2025-07-07',
        'time': '15:00',
        'competition': 'Premier League',
        'source': 'test'
    }

    validated = validator.validate_and_clean_fixtures([demo_fixture])
    print(f"✅ Demo fixture validáció: {len(validated)} eredmény")

    if validated:
        fixture = validated[0]
        print(f"   {fixture['home_team']} vs {fixture['away_team']}")
        print(f"   Competition: {fixture['competition']}")
        print(f"   Confidence: {fixture['confidence']}")

if __name__ == "__main__":
    test_components()

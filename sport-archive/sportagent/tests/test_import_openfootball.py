#!/usr/bin/env python3
"""
Openfootball JSON import teszt script a TeamDatabase-hez
"""
from src.agents.match_collector.team_database import TeamDatabase

if __name__ == "__main__":
    db = TeamDatabase()
    db.import_from_openfootball([
        "data/en.1.json",
        "data/en.2.json",
        "data/de.1.json",
        "data/fr.1.json",
        "data/es.1.json",
        "data/it.1.json",
        "data/nl.1.json",
        "data/pt.1.json",
        "data/at.1.json"
    ])
    print(f"Premier League csapatok: {db.leagues.get('English Premier League 2023/24', [])}")
    print(f"Bundesliga csapatok: {db.leagues.get('German Bundesliga 2023/24', [])}")
    print(f"La Liga csapatok: {db.leagues.get('Spanish Primera Division 2023/24', [])}")
    print(f"Serie A csapatok: {db.leagues.get('Italian Serie A 2023/24', [])}")
    print(f"Eredivisie csapatok: {db.leagues.get('Dutch Eredivisie 2023/24', [])}")
    print(f"Primeira Liga csapatok: {db.leagues.get('Portuguese Primeira Liga 2023/24', [])}")
    print(f"Bundesliga Austria csapatok: {db.leagues.get('Austrian Bundesliga 2023/24', [])}")

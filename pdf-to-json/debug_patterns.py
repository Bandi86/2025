#!/usr/bin/env python3
import sys
import json
import re

sys.path.insert(0, 'src')
from converter.football_extractor import FootballExtractor

extractor = FootballExtractor()

print("Time pattern:", repr(extractor.time_pattern))
print("Team pattern:", repr(extractor.team_pattern))
print("Odds patterns:", extractor.odds_patterns)

# Test lines
test_lines = [
    "Real Madrid - Barcelona",
    "2,50 3,20 2,80",
    "Kedd 20:00 Real Madrid - Barcelona 2,50 3,20 2,80",
    "Real Madrid - Barcelona 2,50 3,20 2,80"
]

for line in test_lines:
    print(f"\nTesting line: {repr(line)}")
    
    # Test time
    time_match = re.search(extractor.time_pattern, line)
    print(f"  Time match: {time_match.group(1) if time_match else None}")
    
    # Test teams
    team_match = re.search(extractor.team_pattern, line)
    if team_match:
        print(f"  Teams: {team_match.group(1)} vs {team_match.group(2)}")
    else:
        print(f"  Teams: None")
    
    # Test odds
    for i, pattern in enumerate(extractor.odds_patterns):
        odds_match = re.search(pattern, line)
        if odds_match:
            print(f"  Odds (pattern {i}): {odds_match.groups()}")
            break
    else:
        print(f"  Odds: None")
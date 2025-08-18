#!/usr/bin/env python3
import sys
import json
import re

sys.path.insert(0, 'src')
from converter.football_extractor import FootballExtractor

# Load test data
with open('test_football.json', 'r') as f:
    test_data = json.load(f)

print("Test data structure:")
print(json.dumps(test_data, indent=2))

# Test extraction
extractor = FootballExtractor()
print("\nFootball patterns:")
print(extractor.football_patterns)

# Test the full_text content
if 'content' in test_data and 'full_text' in test_data['content']:
    full_text = test_data['content']['full_text']
    print(f"\nFull text content:")
    print(repr(full_text))
    
    lines = full_text.split('\n')
    print(f"\nLines ({len(lines)}):")
    for i, line in enumerate(lines):
        print(f"{i}: {repr(line)}")
        
        # Test league extraction
        league_match = extractor._extract_league(line.strip())
        if league_match is not None:
            print(f"  -> League match: {repr(league_match)}")
        
        # Test team extraction
        match_data = extractor._extract_match_data(line.strip(), "Premier League", None)
        if match_data:
            print(f"  -> Match data: {match_data}")

# Run full extraction
matches = extractor.extract_football_data(test_data)
print(f"\nExtracted matches: {len(matches)}")
for match in matches:
    print(f"  {match}")
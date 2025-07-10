#!/usr/bin/env python3
"""
Test specific time format fixing logic.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from scripts.sources.flashscore import FlashScoreScraper
from datetime import datetime
import re

def test_time_format_fix():
    """Test the time format fixing logic directly."""

    # Test data that simulates what we get
    base_match_data = {
        'home_team': 'Wilstermann',
        'away_team': 'Guabira',
        'match_time': '08.07. 02:00',
        'league': 'División Profesional',
        'score': '1-1',
        'status': 'finished',
        'source': 'flashscore'
    }

    print("Testing time format fix logic:")
    print(f"Original time: '{base_match_data['match_time']}'")

    # Apply the same logic as in the scraper
    base_time = base_match_data['match_time']

    # Try pattern 1: time at end
    time_match = re.search(r'(\d{1,2}:\d{2})(?:\s*$)', base_time)
    if time_match:
        fixed_time = time_match.group(1)
        print(f"Pattern 1 result: '{fixed_time}'")
    else:
        print("Pattern 1: No match")
        # Try pattern 2: any time
        time_match = re.search(r'(\d{1,2}:\d{2})', base_time)
        if time_match:
            fixed_time = time_match.group(1)
            print(f"Pattern 2 result: '{fixed_time}'")
        else:
            print("Pattern 2: No match - keeping original")
            fixed_time = base_time

    print(f"Final time: '{fixed_time}'")

    # Test if it passes validation
    time_pattern = re.compile(r'^([01]?[0-9]|2[0-3])[:.]([0-5][0-9])$')
    is_valid = bool(time_pattern.match(fixed_time))
    print(f"Validation result: {is_valid}")

if __name__ == "__main__":
    test_time_format_fix()

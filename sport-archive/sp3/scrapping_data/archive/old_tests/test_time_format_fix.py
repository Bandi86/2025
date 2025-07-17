#!/usr/bin/env python3

"""
Test script to verify that the time format fix is applied correctly
in detailed match extraction.
"""

import re
from scripts.sources.flashscore import FlashScoreScraper

def test_time_format_fix():
    """Test the time format fix logic"""

    # Test cases
    test_cases = [
        ("07.07. 21:00", "21:00"),
        ("21:00", "21:00"),
        ("29.06. 21:00", "21:00"),
        ("15.06. 23:15", "23:15"),
        ("26.05. 01:30", "01:30"),
        ("27.04. 23:15", "23:15"),
        ("", ""),
        ("invalid", "")
    ]

    print("Testing time format fix logic...")

    for input_time, expected_output in test_cases:
        # Simulate the fix logic
        if input_time:
            time_match = re.search(r'(\d{1,2}:\d{2})(?:\s*$)', input_time)
            if time_match:
                fixed_time = time_match.group(1)
            else:
                time_match = re.search(r'(\d{1,2}:\d{2})', input_time)
                if time_match:
                    fixed_time = time_match.group(1)
                else:
                    fixed_time = ""
        else:
            fixed_time = ""

        status = "✓" if fixed_time == expected_output else "✗"
        print(f"{status} '{input_time}' -> '{fixed_time}' (expected: '{expected_output}')")

        if fixed_time != expected_output:
            print(f"   ERROR: Expected '{expected_output}', got '{fixed_time}'")

def test_with_real_match():
    """Test with a real match URL"""
    print("\nTesting with real match URL...")

    # Create scraper instance
    scraper = FlashScoreScraper()

    # Test with one of the scheduled matches
    test_url = "https://www.flashscore.com/match/football/hIwbiFUp/#/match-summary"
    base_match_data = {
        'home_team': 'Academia del Balompie',
        'away_team': 'Nacional Potosi',
        'match_time': '21:00',
        'league': 'División Profesional',
        'match_url': test_url,
        'score': '',
        'status': 'scheduled',
        'source': 'flashscore'
    }

    try:
        print(f"Testing with URL: {test_url}")
        print(f"Base match time: {base_match_data['match_time']}")

        # Get match details
        details = scraper.get_match_details(test_url, base_match_data)

        if details:
            extracted_time = details.get('match_time', '')
            print(f"Extracted match time: '{extracted_time}'")

            # Check if time format is valid (HH:MM only)
            is_valid = bool(re.match(r'^\d{1,2}:\d{2}$', extracted_time)) if extracted_time else False
            status = "✓" if is_valid else "✗"
            print(f"{status} Time format valid: {is_valid}")

            if not is_valid and extracted_time:
                print(f"   ERROR: Time format '{extracted_time}' is not in HH:MM format")
        else:
            print("✗ No details extracted")

    except Exception as e:
        print(f"✗ Error testing with real match: {e}")
    finally:
        # Clean up
        if hasattr(scraper, 'driver') and scraper.driver:
            scraper.driver.quit()

if __name__ == "__main__":
    test_time_format_fix()
    test_with_real_match()

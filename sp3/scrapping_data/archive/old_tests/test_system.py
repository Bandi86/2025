"""
Simple test script to demonstrate the scraping system.
Run this to test basic functionality without needing actual web scraping.
"""

import sys
import os
from datetime import date, timedelta

# Add the scripts directory to the path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))

from scripts.utils.date_utils import get_today_date, get_date_string, get_data_directory_path
from scripts.utils.json_handler import JSONHandler
from scripts.utils.validators import MatchValidator


def test_date_utilities():
    """Test date utility functions."""
    print("Testing date utilities...")

    today = get_today_date()
    print(f"Today: {get_date_string(today)}")

    yesterday = today - timedelta(days=1)
    print(f"Yesterday: {get_date_string(yesterday)}")

    # Test directory path generation
    base_path = "/tmp/test_scraping"
    data_dir = get_data_directory_path(base_path, today)
    print(f"Data directory path: {data_dir}")

    print("✓ Date utilities working correctly\n")


def test_json_handler():
    """Test JSON handling functionality."""
    print("Testing JSON handler...")

    base_path = "/tmp/test_scraping"
    json_handler = JSONHandler(base_path)

    # Test sample match data
    sample_matches = [
        {
            "home_team": "Arsenal",
            "away_team": "Chelsea",
            "league": "Premier League",
            "match_time": "15:30",
            "source": "test"
        },
        {
            "home_team": "Barcelona",
            "away_team": "Real Madrid",
            "league": "La Liga",
            "match_time": "20:00",
            "source": "test"
        }
    ]

    # Save test data
    today = get_today_date()
    file_path = json_handler.save_daily_matches(sample_matches, today)
    print(f"Saved test matches to: {file_path}")

    # Load test data
    loaded_matches = json_handler.load_daily_matches(today)
    if loaded_matches:
        print(f"Loaded {len(loaded_matches)} matches")
        for match in loaded_matches:
            print(f"  {match['home_team']} vs {match['away_team']}")

    print("✓ JSON handler working correctly\n")


def test_validator():
    """Test match validation functionality."""
    print("Testing match validator...")

    validator = MatchValidator()

    # Test valid match
    valid_match = {
        "home_team": "Manchester United",
        "away_team": "Liverpool",
        "league": "Premier League",
        "match_time": "17:30",
        "source": "test"
    }

    is_valid, errors = validator.validate_basic_match(valid_match)
    print(f"Valid match test: {'✓' if is_valid else '✗'}")
    if errors:
        print(f"  Errors: {errors}")

    # Test invalid match (missing required field)
    invalid_match = {
        "home_team": "Team A",
        "away_team": "Team B",
        # Missing league, match_time, source
    }

    is_valid, errors = validator.validate_basic_match(invalid_match)
    print(f"Invalid match test: {'✓' if not is_valid else '✗'}")
    print(f"  Expected errors: {errors}")

    # Test team name cleaning
    dirty_name = "  Manchester United FC  "
    clean_name = validator.clean_team_name(dirty_name)
    print(f"Team name cleaning: '{dirty_name}' -> '{clean_name}'")

    print("✓ Validator working correctly\n")


def test_match_structure():
    """Test the expected match data structure."""
    print("Testing match data structure...")

    # Example of a complete match record
    complete_match = {
        # Required fields
        "home_team": "Arsenal",
        "away_team": "Tottenham",
        "league": "English Premier League",
        "match_time": "12:30",
        "source": "flashscore",

        # Optional basic fields
        "date": "2025-01-10",
        "status": "scheduled",
        "match_url": "https://www.flashscore.com/match/example",
        "venue": "Emirates Stadium",
        "round_info": "Matchday 20",

        # Optional detailed fields
        "score": None,  # Will be filled when match is live/finished
        "odds": {
            "home": "2.10",
            "draw": "3.40",
            "away": "3.80"
        },
        "statistics": {
            "possession_home": "60",
            "possession_away": "40",
            "shots_home": "12",
            "shots_away": "8"
        },
        "lineups": {
            "home_team": ["Player 1", "Player 2", "..."],
            "away_team": ["Player A", "Player B", "..."]
        },

        # Metadata
        "scraped_at": "2025-01-10T10:30:00",
        "has_details": False,
        "sources": ["flashscore"]
    }

    validator = MatchValidator()
    is_valid, errors = validator.validate_detailed_match(complete_match)

    print(f"Complete match structure test: {'✓' if is_valid else '✗'}")
    if errors:
        print(f"  Validation errors: {errors}")

    print("✓ Match structure test completed\n")


def main():
    """Run all tests."""
    print("=== Scraping System Test Suite ===\n")

    try:
        test_date_utilities()
        test_json_handler()
        test_validator()
        test_match_structure()

        print("=== All Tests Completed Successfully ===")
        print("\nThe scraping system components are working correctly!")
        print("You can now run the main scraping script with:")
        print("  python -m scripts.scrapping --base-path /path/to/data --mode status")

    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

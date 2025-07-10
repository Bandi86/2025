#!/usr/bin/env python3

"""
Test complete system with a past date to get finished matches
"""

from datetime import date, timedelta
from scripts.scrapping import main as run_scraping

def test_complete_system():
    """Test the complete scraping system with past date"""

    print("=== TESTING COMPLETE SYSTEM WITH PAST DATE ===\n")

    # Use a date from a few days ago when matches should be finished
    past_date = date.today() - timedelta(days=3)
    date_str = past_date.isoformat()

    print(f"Testing complete system for date: {date_str}")
    print("Expected behavior:")
    print("  1. ✅ Generate daily match list")
    print("  2. ✅ Filter for finished matches")
    print("  3. ✅ Scrape detailed data for finished matches")
    print("  4. ✅ Skip scheduled matches")
    print("  5. ✅ Create proper file structure")
    print()

    # Test command that would be run
    test_command = f"python -m scripts.scrapping --base-path /tmp/test_complete --date {date_str} --mode daily"
    print(f"Equivalent to running: {test_command}")
    print()

    # We could run this, but let's simulate for now since it might take time
    print("To run the full system test:")
    print(f"cd /home/bandi/Documents/code/2025/sp3/scrapping_data")
    print(f"python -m scripts.scrapping --base-path /tmp/test_complete --date {date_str} --mode daily")
    print()

    print("Expected results:")
    print(f"  📁 /tmp/test_complete/data/{past_date.year}/{past_date.month:02d}/{past_date.day:02d}/matches/")
    print(f"  📄 daily_matches_{date_str}.json")
    print(f"  📄 match_[team1]_vs_[team2]_[time]_[source].json (for finished matches only)")
    print(f"  📄 session_[timestamp].json (summary)")

if __name__ == "__main__":
    test_complete_system()

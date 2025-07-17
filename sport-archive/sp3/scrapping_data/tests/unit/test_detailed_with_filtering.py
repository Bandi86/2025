#!/usr/bin/env python3

"""
Test the complete system with status filtering
"""

import json
from scripts.detailed_match_scraper import DetailedMatchScraper

def test_detailed_scraping_with_filtering():
    """Test detailed match scraping with status filtering"""

    print("=== TESTING DETAILED SCRAPING WITH STATUS FILTERING ===\n")

    # Create scraper
    scraper = DetailedMatchScraper("/tmp/test_detailed")

    # Run detailed scraping for today
    from datetime import date
    today = date.today()

    print(f"Running detailed scraping for {today}")
    print("This will:")
    print("  ✓ Scrape finished matches")
    print("  ✗ Skip scheduled/live matches")
    print("  ✗ Skip already scraped matches")
    print()

    result = scraper.scrape_daily_match_details(today, sources=['flashscore'])

    print("RESULTS:")
    print(f"  Total matches: {result['total_matches']}")
    print(f"  Matches with URLs: {result['matches_with_urls']}")
    print(f"  Matches to scrape: {result['matches_to_scrape']}")
    print(f"  Matches skipped: {result['matches_skipped']}")
    print(f"  Successfully scraped: {result['scraped_matches']}")
    print(f"  Failed: {result['failed_matches']}")
    print(f"  Success rate: {result['success_rate']:.1%}")
    print()

    # Show skip reasons
    if result['skipped']:
        print("SKIPPED MATCHES:")
        skip_reasons = {}
        for skipped in result['skipped']:
            reason = skipped['skip_reason']
            skip_reasons[reason] = skip_reasons.get(reason, 0) + 1

        for reason, count in skip_reasons.items():
            print(f"  {reason}: {count} matches")
        print()

    # Show successful matches
    if result['matches']:
        print("SUCCESSFULLY SCRAPED MATCHES:")
        for match in result['matches']:
            print(f"  ✓ {match.get('home_team')} vs {match.get('away_team')}")
            print(f"    Status: {match.get('status')}")
            print(f"    Score: {match.get('score', 'N/A')}")
        print()

    return result

if __name__ == "__main__":
    test_detailed_scraping_with_filtering()

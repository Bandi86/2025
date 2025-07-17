#!/usr/bin/env python3
"""
Comprehensive FlashScore analysis and optimization
================================================

1. Analyze different FlashScore pages to find ALL matches
2. Identify finished matches specifically
3. Test with a finished match for detailed scraping
"""
import sys
import os
import re
from datetime import datetime, date

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.join(current_dir, 'scripts')
sys.path.insert(0, current_dir)
sys.path.insert(0, scripts_dir)

from scripts.sources.flashscore import FlashScoreScraper

def comprehensive_flashscore_analysis():
    """Comprehensive analysis of FlashScore to find more matches"""
    print("=== Comprehensive FlashScore Analysis ===")

    scraper = FlashScoreScraper()

    # Try different approaches and URLs
    approaches = [
        {
            "name": "Main Football Page",
            "url": "https://www.flashscore.com/football/",
            "description": "Main football section"
        },
        {
            "name": "Live Scores",
            "url": "https://www.flashscore.com/football/live/",
            "description": "Live matches"
        },
        {
            "name": "Results Today",
            "url": "https://www.flashscore.com/football/results/",
            "description": "Today's results"
        },
        {
            "name": "All Results",
            "url": "https://www.flashscore.com/football/results/fixtures/",
            "description": "All fixtures and results"
        }
    ]

    all_matches_found = {}

    for approach in approaches:
        print(f"\n--- {approach['name']}: {approach['url']} ---")

        try:
            soup = scraper.get_page(approach['url'], force_selenium=True)

            if soup:
                # Count different types of elements
                analysis = {
                    "page_length": len(str(soup)),
                    "event_divs": len(soup.find_all("div", class_=re.compile(r"event"))),
                    "match_links": len(soup.find_all("a", href=re.compile(r"/match/"))),
                    "participant_spans": len(soup.find_all("span", class_=re.compile(r"participant"))),
                    "team_elements": len(soup.find_all(["span", "div"], class_=re.compile(r"team|home|away", re.I)))
                }

                print(f"Analysis: {analysis}")

                # Look for status indicators
                page_text = soup.get_text()
                status_indicators = {
                    "FT": page_text.count("FT"),
                    "Live": page_text.count("Live"),
                    "HT": page_text.count("HT"),
                    "Finished": page_text.lower().count("finished"),
                    "Scheduled": page_text.lower().count("scheduled"),
                    "Score_patterns": len(re.findall(r'\\d+\\s*-\\s*\\d+', page_text))
                }

                print(f"Status indicators: {status_indicators}")

                # Try to extract matches using enhanced parsing
                matches = scraper.get_daily_matches(date.today())
                print(f"Extracted {len(matches)} matches using current parser")

                if matches:
                    # Analyze match statuses
                    statuses = {}
                    for match in matches:
                        status = match.get('status', 'unknown')
                        statuses[status] = statuses.get(status, 0) + 1

                    print(f"Match statuses: {statuses}")

                    # Look for matches with scores (likely finished)
                    finished_matches = [m for m in matches if m.get('score') and '-' in str(m.get('score'))]
                    print(f"Matches with scores: {len(finished_matches)}")

                    # Store unique matches
                    for match in matches:
                        key = f"{match.get('home_team', '')} vs {match.get('away_team', '')}"
                        if key not in all_matches_found:
                            all_matches_found[key] = match

                # Try alternative parsing for missed matches
                print("Trying alternative parsing...")

                # Look for all elements containing team names
                potential_team_elements = soup.find_all(["span", "div"],
                    class_=re.compile(r"participant|team|home|away", re.I))

                team_pairs = []
                for i in range(0, len(potential_team_elements) - 1, 2):
                    team1_elem = potential_team_elements[i]
                    team2_elem = potential_team_elements[i + 1]

                    team1 = scraper._safe_extract_text(team1_elem)
                    team2 = scraper._safe_extract_text(team2_elem)

                    if (team1 and team2 and
                        len(team1) < 50 and len(team2) < 50 and
                        team1 != team2):
                        team_pairs.append((team1, team2))

                unique_pairs = list(set(team_pairs))
                print(f"Found {len(unique_pairs)} potential team pairs")

                if unique_pairs:
                    print("Sample team pairs:")
                    for i, (team1, team2) in enumerate(unique_pairs[:5]):
                        print(f"  {i+1}. {team1} vs {team2}")

        except Exception as e:
            print(f"Error analyzing {approach['name']}: {e}")

    print(f"\n=== Summary ===")
    print(f"Total unique matches found across all pages: {len(all_matches_found)}")

    # Look for finished matches specifically
    finished_matches = []
    for key, match in all_matches_found.items():
        if (match.get('score') and '-' in str(match.get('score'))) or \
           match.get('status', '').lower() in ['finished', 'ft', 'final']:
            finished_matches.append(match)

    print(f"Finished matches found: {len(finished_matches)}")

    if finished_matches:
        print("Sample finished matches:")
        for i, match in enumerate(finished_matches[:3]):
            print(f"  {i+1}. {match.get('home_team')} vs {match.get('away_team')} - {match.get('score', 'No score')} - {match.get('status', 'No status')}")

        # Test detailed scraping with a finished match
        test_match = finished_matches[0]
        print(f"\nTesting detailed scraping with: {test_match.get('home_team')} vs {test_match.get('away_team')}")

        if test_match.get('match_url'):
            detailed_data = scraper.get_match_details(test_match['match_url'], test_match)
            if detailed_data:
                print("✓ Successfully scraped detailed data")
                print(f"  Score: {detailed_data.get('score', 'No score')}")
                print(f"  Status: {detailed_data.get('status', 'No status')}")
                print(f"  League: {detailed_data.get('league', 'No league')}")
                return test_match, detailed_data
            else:
                print("✗ Failed to scrape detailed data")

    return None, None

if __name__ == "__main__":
    comprehensive_flashscore_analysis()

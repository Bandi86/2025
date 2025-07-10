#!/usr/bin/env python3
"""
Production FlashScore Daily Scraper
===================================

Optimized production script for daily FlashScore scraping with:
- Fast development mode using saved HTML
- Live scraping mode for production
- Status-based filtering for finished matches
- Detailed scraping for finished matches only
- Proper directory structure and data organization
"""
import sys
import os
import json
import argparse
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.join(current_dir, 'scripts')
sys.path.insert(0, current_dir)
sys.path.insert(0, scripts_dir)

from scripts.sources.flashscore import FlashScoreScraper
from scripts.detailed_match_scraper import DetailedMatchScraper
from scripts.utils.json_handler import JSONHandler

class ProductionFlashScoreScraper:
    """Production FlashScore scraper with optimized workflows."""

    def __init__(self, development_mode: bool = False, output_dir: Optional[str] = None):
        """
        Initialize the production scraper.

        Args:
            development_mode: If True, use saved HTML for faster testing
            output_dir: Base output directory (defaults to ../data)
        """
        self.development_mode = development_mode
        self.output_dir = output_dir or os.path.join(os.path.dirname(current_dir), 'data')

        # Initialize scrapers
        self.flashscore_scraper = None
        self.detailed_scraper = None

        # Statistics
        self.stats = {
            'total_matches': 0,
            'scheduled_matches': 0,
            'finished_matches': 0,
            'detailed_scraped': 0,
            'errors': 0,
            'processing_time': 0
        }

    def initialize_scrapers(self):
        """Initialize the scrapers lazily."""
        if not self.flashscore_scraper:
            self.flashscore_scraper = FlashScoreScraper(headless=True, use_selenium=True)

        if not self.detailed_scraper:
            self.detailed_scraper = DetailedMatchScraper(self.output_dir)

    def get_matches_from_saved_data(self) -> List[Dict[str, Any]]:\n        \"\"\"\n        Load matches from saved flashscoreindex.json for development.\n        \"\"\"\n        print(\"🏗️  Development mode: Loading from saved HTML...\")\n        \n        # Load fast parser results if available\n        fast_results_file = os.path.join(current_dir, 'fast_parser_results.json')\n        if os.path.exists(fast_results_file):\n            with open(fast_results_file, 'r', encoding='utf-8') as f:\n                data = json.load(f)\n            \n            matches = data.get('matches', [])\n            print(f\"📊 Loaded {len(matches)} matches from fast parser results\")\n            return matches\n        \n        # Fallback to running fast parser\n        print(\"📊 No cached results found, running fast parser...\")\n        \n        import test_fast_flashscore_parser\n        dump_file = os.path.join(current_dir, 'example', 'flashscoreindex.json')\n        \n        if os.path.exists(dump_file):\n            matches = test_fast_flashscore_parser.parse_flashscore_dump(dump_file)\n            print(f\"📊 Parsed {len(matches)} matches from dump file\")\n            return matches\n        \n        print(\"❌ No saved data available for development mode\")\n        return []\n    \n    def get_matches_live(self, target_date: date) -> List[Dict[str, Any]]:\n        \"\"\"\n        Get matches using live FlashScore scraping.\n        \"\"\"\n        print(\"🌐 Production mode: Live FlashScore scraping...\")\n        \n        self.initialize_scrapers()\n        \n        try:\n            matches = self.flashscore_scraper.get_daily_matches(target_date)\n            print(f\"📊 Live scraping found {len(matches)} matches\")\n            return matches\n        except Exception as e:\n            print(f\"❌ Live scraping failed: {e}\")\n            self.stats['errors'] += 1\n            return []\n    \n    def filter_matches_by_status(self, matches: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:\n        \"\"\"\n        Filter matches by status for processing.\n        \"\"\"\n        filtered = {\n            'scheduled': [],\n            'finished': [],\n            'live': [],\n            'other': []\n        }\n        \n        for match in matches:\n            status = match.get('status', 'unknown').lower()\n            \n            if status == 'scheduled':\n                filtered['scheduled'].append(match)\n            elif status == 'finished':\n                filtered['finished'].append(match)\n            elif status in ['live', 'half_time']:\n                filtered['live'].append(match)\n            else:\n                filtered['other'].append(match)\n        \n        # Update stats\n        self.stats['scheduled_matches'] = len(filtered['scheduled'])\n        self.stats['finished_matches'] = len(filtered['finished'])\n        \n        print(f\"📈 Match status distribution:\")\n        for status, match_list in filtered.items():\n            if match_list:\n                print(f\"  {status}: {len(match_list)}\")\n        \n        return filtered\n    \n    def save_daily_matches(self, matches: List[Dict[str, Any]], target_date: date) -> str:\n        \"\"\"\n        Save daily matches to the standard directory structure.\n        \"\"\"\n        date_dir = get_date_directory(target_date, self.output_dir)\n        daily_file = os.path.join(date_dir, 'daily_matches.json')\n        \n        # Ensure directory exists\n        os.makedirs(date_dir, exist_ok=True)\n        \n        # Save matches\n        JSONHandler.save_data(matches, daily_file)\n        \n        print(f\"💾 Saved {len(matches)} daily matches to: {daily_file}\")\n        return daily_file\n    \n    def process_finished_matches(self, finished_matches: List[Dict[str, Any]], target_date: date) -> List[Dict[str, Any]]:\n        \"\"\"\n        Process finished matches for detailed scraping.\n        \"\"\"\n        if not finished_matches:\n            print(\"ℹ️  No finished matches to process\")\n            return []\n        \n        print(f\"🔍 Processing {len(finished_matches)} finished matches for detailed scraping...\")\n        \n        self.initialize_scrapers()\n        detailed_matches = []\n        \n        for i, match in enumerate(finished_matches[:10]):  # Limit to 10 for now\n            print(f\"\\n--- Processing match {i+1}/{len(finished_matches[:10])} ---\")\n            print(f\"🏆 {match['home_team']} vs {match['away_team']} ({match.get('score', 'N/A')})\")\n            \n            try:\n                # Attempt detailed scraping (would need real match URL)\n                if match.get('match_url'):\n                    detailed_match = self.detailed_scraper.scrape_match(\n                        match['match_url'], \n                        match,\n                        target_date\n                    )\n                    \n                    if detailed_match:\n                        detailed_matches.append(detailed_match)\n                        self.stats['detailed_scraped'] += 1\n                        print(f\"✅ Detailed scraping successful\")\n                    else:\n                        print(f\"⚠️  Detailed scraping failed\")\n                        self.stats['errors'] += 1\n                else:\n                    print(f\"⚠️  No match URL available, skipping detailed scraping\")\n                    \n            except Exception as e:\n                print(f\"❌ Error processing match: {e}\")\n                self.stats['errors'] += 1\n        \n        return detailed_matches\n    \n    def run_daily_scraping(self, target_date: Optional[date] = None) -> Dict[str, Any]:\n        \"\"\"\n        Run the complete daily scraping workflow.\n        \"\"\"\n        start_time = datetime.now()\n        target_date = target_date or date.today()\n        \n        print(f\"🚀 Starting daily FlashScore scraping for {target_date}\")\n        print(f\"📍 Mode: {'Development' if self.development_mode else 'Production'}\")\n        print(\"=\" * 60)\n        \n        # Step 1: Get all matches\n        if self.development_mode:\n            all_matches = self.get_matches_from_saved_data()\n        else:\n            all_matches = self.get_matches_live(target_date)\n        \n        if not all_matches:\n            print(\"❌ No matches found\")\n            return {'success': False, 'error': 'No matches found'}\n        \n        self.stats['total_matches'] = len(all_matches)\n        \n        # Step 2: Filter matches by status\n        filtered_matches = self.filter_matches_by_status(all_matches)\n        \n        # Step 3: Save daily matches\n        daily_file = self.save_daily_matches(all_matches, target_date)\n        \n        # Step 4: Process finished matches for detailed scraping\n        detailed_matches = self.process_finished_matches(\n            filtered_matches['finished'], \n            target_date\n        )\n        \n        # Calculate processing time\n        end_time = datetime.now()\n        self.stats['processing_time'] = (end_time - start_time).total_seconds()\n        \n        # Generate summary\n        summary = {\n            'success': True,\n            'date': target_date.isoformat(),\n            'mode': 'development' if self.development_mode else 'production',\n            'stats': self.stats,\n            'files': {\n                'daily_matches': daily_file,\n                'detailed_matches_count': len(detailed_matches)\n            },\n            'timestamp': end_time.isoformat()\n        }\n        \n        # Print summary\n        print(\"\\n\" + \"=\" * 60)\n        print(\"📊 Daily Scraping Summary\")\n        print(\"=\" * 60)\n        print(f\"✅ Total matches: {self.stats['total_matches']}\")\n        print(f\"🕐 Scheduled matches: {self.stats['scheduled_matches']}\")\n        print(f\"🏆 Finished matches: {self.stats['finished_matches']}\")\n        print(f\"🔍 Detailed scraped: {self.stats['detailed_scraped']}\")\n        print(f\"❌ Errors: {self.stats['errors']}\")\n        print(f\"⏱️  Processing time: {self.stats['processing_time']:.2f} seconds\")\n        print(f\"📁 Output directory: {self.output_dir}\")\n        \n        return summary\n\ndef main():\n    \"\"\"Main function with command line argument parsing.\"\"\"\n    parser = argparse.ArgumentParser(description='Production FlashScore Daily Scraper')\n    parser.add_argument('--dev', action='store_true', help='Run in development mode (use saved HTML)')\n    parser.add_argument('--date', type=str, help='Target date (YYYY-MM-DD format, defaults to today)')\n    parser.add_argument('--output', type=str, help='Output directory (defaults to ../data)')\n    \n    args = parser.parse_args()\n    \n    # Parse target date\n    target_date = date.today()\n    if args.date:\n        try:\n            target_date = datetime.strptime(args.date, '%Y-%m-%d').date()\n        except ValueError:\n            print(f\"❌ Invalid date format: {args.date}. Use YYYY-MM-DD format.\")\n            return\n    \n    # Initialize scraper\n    scraper = ProductionFlashScoreScraper(\n        development_mode=args.dev,\n        output_dir=args.output\n    )\n    \n    # Run scraping\n    try:\n        result = scraper.run_daily_scraping(target_date)\n        \n        if result['success']:\n            print(\"\\n🎯 Daily scraping completed successfully!\")\n        else:\n            print(f\"\\n❌ Daily scraping failed: {result.get('error', 'Unknown error')}\")\n            \n    except KeyboardInterrupt:\n        print(\"\\n⚠️  Scraping interrupted by user\")\n    except Exception as e:\n        print(f\"\\n❌ Unexpected error: {e}\")\n\nif __name__ == \"__main__\":\n    main()

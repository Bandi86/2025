#!/usr/bin/env python3
"""
Részletes meccs adatok scraper
=============================

Ez a modul felelős az egyes meccsek részletes adatainak gyűjtéséért.
A napi meccslistából veszi a linkeket és részletes JSON-okat készít.

Kimenet: data/YYYY/MM/DD/matches/YYYYMMDD_team1_vs_team2.json
"""

import json
import logging
from datetime import date, datetime
from typing import List, Dict, Any, Optional
import concurrent.futures
import time

from .sources.flashscore import FlashScoreScraper
from .sources.eredmenyek import EredmenyekScraper
from .utils.json_handler import JSONHandler
from .utils.date_utils import get_today_date, get_date_string
from .utils.validators import MatchValidator

class DetailedMatchScraper:
    """Scrape detailed match information from multiple sources."""

    def __init__(self, base_path: str):
        """
        Initialize detailed match scraper.

        Args:
            base_path: Base directory path for data storage
        """
        self.base_path = base_path
        self.json_handler = JSONHandler(base_path)
        self.validator = MatchValidator()
        self.logger = logging.getLogger(__name__)

        # Initialize scrapers
        self.scrapers = {
            'flashscore': FlashScoreScraper(),
            'eredmenyek': EredmenyekScraper()
        }

        # Configuration
        self.max_workers = 2  # Number of concurrent scrapers
        self.timeout_per_match = 30  # Seconds per match
        self.delay_between_matches = 1  # Seconds between matches

    def scrape_match_details(self, match_url: str, source: str, base_match_data: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Scrape detailed information for a single match.

        Args:
            match_url: URL of the match page
            source: Source name (flashscore, eredmenyek)
            base_match_data: Optional base match data from daily matches list

        Returns:
            Detailed match dictionary or None if error
        """
        if source not in self.scrapers:
            self.logger.error(f"Unknown source: {source}")
            return None

        scraper = self.scrapers[source]

        try:
            self.logger.info(f"Scraping match details from {source}: {match_url}")

            start_time = time.time()
            # Pass base match data to get_match_details if scraper supports it
            if hasattr(scraper, 'get_match_details'):
                try:
                    # Try calling with base_match_data parameter
                    match_details = scraper.get_match_details(match_url, base_match_data)
                except TypeError:
                    # Fallback to old signature if method doesn't support base_match_data
                    match_details = scraper.get_match_details(match_url)
            else:
                match_details = None

            end_time = time.time()

            if match_details:
                # Validate detailed match data
                is_valid, errors = self.validator.validate_detailed_match(match_details)

                if is_valid:
                    match_details['scraping_time'] = end_time - start_time
                    match_details['scraped_at'] = datetime.now().isoformat()

                    self.logger.info(f"Successfully scraped match details in {end_time - start_time:.2f}s")
                    return match_details
                else:
                    self.logger.warning(f"Invalid match details: {errors}")
                    return None
            else:
                self.logger.warning(f"No match details found for {match_url}")
                return None

        except Exception as e:
            self.logger.error(f"Error scraping match details from {source}: {e}")
            return None

    def scrape_daily_match_details(self, target_date: Optional[date] = None,
                                  sources: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Scrape detailed information for all matches on a specific date.

        Args:
            target_date: Date to scrape details for (defaults to today)
            sources: List of sources to use (defaults to all)

        Returns:
            Dictionary with scraping results and statistics
        """
        if target_date is None:
            target_date = get_today_date()

        if sources is None:
            sources = list(self.scrapers.keys())

        self.logger.info(f"Scraping detailed match data for {get_date_string(target_date)}")

        # Load daily matches list
        daily_matches = self.json_handler.load_daily_matches(target_date)
        if not daily_matches:
            self.logger.error(f"No daily matches found for {get_date_string(target_date)}")
            return {
                'date': get_date_string(target_date),
                'status': 'no_matches',
                'total_matches': 0,
                'scraped_matches': 0,
                'failed_matches': 0,
                'matches': []
            }

        # Filter matches that should be scraped
        matches_to_scrape = []
        matches_to_skip = []

        for match in daily_matches:
            if not (match.get('match_url') and
                   match.get('source') in sources and
                   match.get('source') in self.scrapers):
                continue

            # Check if match should be scraped based on status
            should_scrape, reason = self._should_scrape_match(match, target_date)

            if should_scrape:
                matches_to_scrape.append(match)
            else:
                matches_to_skip.append({
                    'match': match,
                    'skip_reason': reason
                })
                self.logger.info(f"Skipping match {match.get('home_team')} vs {match.get('away_team')}: {reason}")

        self.logger.info(f"Found {len(matches_to_scrape)} matches to scrape, {len(matches_to_skip)} to skip")

        # Scrape details for each match
        detailed_matches = []
        failed_matches = []

        for i, match in enumerate(matches_to_scrape):
            self.logger.info(f"Scraping match {i+1}/{len(matches_to_scrape)}")

            match_details = self.scrape_match_details(match['match_url'], match['source'], match)

            if match_details:
                # Merge with original match data
                merged_match = self._merge_match_data(match, match_details)
                detailed_matches.append(merged_match)

                # Save individual match file
                match_id = self._generate_match_id(merged_match)
                self.json_handler.save_detailed_match(merged_match, target_date, match_id)

            else:
                failed_matches.append(match)

            # Add delay between matches
            if i < len(matches_to_scrape) - 1:
                time.sleep(self.delay_between_matches)

        # Create result summary
        result = {
            'date': get_date_string(target_date),
            'scraped_at': datetime.now().isoformat(),
            'total_matches': len(daily_matches),
            'matches_with_urls': len(matches_to_scrape) + len(matches_to_skip),
            'matches_to_scrape': len(matches_to_scrape),
            'matches_skipped': len(matches_to_skip),
            'scraped_matches': len(detailed_matches),
            'failed_matches': len(failed_matches),
            'success_rate': len(detailed_matches) / len(matches_to_scrape) if matches_to_scrape else 0,
            'matches': detailed_matches,
            'failed': failed_matches,
            'skipped': matches_to_skip
        }

        self.logger.info(f"Scraping completed: {len(detailed_matches)}/{len(matches_to_scrape)} successful")

        return result

    def scrape_match_by_teams(self, home_team: str, away_team: str,
                             target_date: Optional[date] = None,
                             sources: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
        """
        Scrape detailed information for a specific match by team names.

        Args:
            home_team: Home team name
            away_team: Away team name
            target_date: Date of the match (defaults to today)
            sources: List of sources to search (defaults to all)

        Returns:
            Detailed match dictionary or None if not found
        """
        if target_date is None:
            target_date = get_today_date()

        if sources is None:
            sources = list(self.scrapers.keys())

        # Load daily matches
        daily_matches = self.json_handler.load_daily_matches(target_date)
        if not daily_matches:
            self.logger.error(f"No daily matches found for {get_date_string(target_date)}")
            return None

        # Find matching match
        target_match = None
        for match in daily_matches:
            if (self._teams_match(match.get('home_team', ''), home_team) and
                self._teams_match(match.get('away_team', ''), away_team) and
                match.get('source') in sources):
                target_match = match
                break

        if not target_match:
            self.logger.error(f"Match not found: {home_team} vs {away_team}")
            return None

        if not target_match.get('match_url'):
            self.logger.error(f"No URL available for match: {home_team} vs {away_team}")
            return None

        # Scrape detailed information
        match_details = self.scrape_match_details(target_match['match_url'], target_match['source'])

        if match_details:
            merged_match = self._merge_match_data(target_match, match_details)

            # Save individual match file
            match_id = self._generate_match_id(merged_match)
            self.json_handler.save_detailed_match(merged_match, target_date, match_id)

            return merged_match

        return None

    def _merge_match_data(self, basic_match: Dict[str, Any],
                         detailed_match: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge basic match data with detailed information.

        Args:
            basic_match: Basic match data from daily list
            detailed_match: Detailed match data from scraper

        Returns:
            Merged match dictionary
        """
        merged = basic_match.copy()

        # Update with detailed information
        for key, value in detailed_match.items():
            if value is not None and (key not in merged or not merged[key]):
                merged[key] = value

        # Ensure we have both sources tracked
        if 'sources' not in merged:
            merged['sources'] = [basic_match.get('source', 'unknown')]

        # Mark as detailed
        merged['has_details'] = True
        merged['details_scraped_at'] = datetime.now().isoformat()

        return merged

    def _generate_match_id(self, match: Dict[str, Any]) -> str:
        """
        Generate unique match ID.

        Args:
            match: Match dictionary

        Returns:
            Unique match ID string
        """
        home_team = match.get('home_team', '').replace(' ', '_').lower()
        away_team = match.get('away_team', '').replace(' ', '_').lower()
        match_time = match.get('match_time', '').replace(':', '')
        source = match.get('source', 'unknown')

        return f"{home_team}_vs_{away_team}_{match_time}_{source}"

    def _teams_match(self, team1: str, team2: str) -> bool:
        """
        Check if two team names match (fuzzy matching).

        Args:
            team1: First team name
            team2: Second team name

        Returns:
            True if teams match, False otherwise
        """
        if not team1 or not team2:
            return False

        # Normalize team names
        team1_clean = self.validator.clean_team_name(team1.lower())
        team2_clean = self.validator.clean_team_name(team2.lower())

        # Exact match
        if team1_clean == team2_clean:
            return True

        # Check if one contains the other
        if team1_clean in team2_clean or team2_clean in team1_clean:
            return True

        # Check with different normalization
        team1_words = set(team1_clean.split())
        team2_words = set(team2_clean.split())

        # If significant word overlap
        common_words = team1_words & team2_words
        min_words = min(len(team1_words), len(team2_words))

        if min_words > 0 and len(common_words) / min_words >= 0.7:
            return True

        return False

    def get_scraping_statistics(self, target_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Get statistics about scraped matches for a date.

        Args:
            target_date: Date to get statistics for (defaults to today)

        Returns:
            Dictionary with scraping statistics
        """
        if target_date is None:
            target_date = get_today_date()

        # Get daily matches
        daily_matches = self.json_handler.load_daily_matches(target_date)
        if not daily_matches:
            return {
                'date': get_date_string(target_date),
                'total_matches': 0,
                'matches_with_details': 0,
                'coverage_percentage': 0
            }

        # Get existing detailed match files
        detailed_files = self.json_handler.get_existing_match_files(target_date)

        # Count matches with details
        matches_with_details = 0
        for match in daily_matches:
            match_id = self._generate_match_id(match)
            expected_file = f"match_{match_id}.json"

            if any(expected_file in file_path for file_path in detailed_files):
                matches_with_details += 1

        total_matches = len(daily_matches)
        coverage_percentage = (matches_with_details / total_matches * 100) if total_matches > 0 else 0

        return {
            'date': get_date_string(target_date),
            'total_matches': total_matches,
            'matches_with_details': matches_with_details,
            'coverage_percentage': coverage_percentage,
            'detailed_files_count': len(detailed_files)
        }

    def bulk_scrape_missing_details(self, target_date: Optional[date] = None,
                                   sources: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Scrape details for matches that don't have detailed information yet.

        Args:
            target_date: Date to scrape for (defaults to today)
            sources: List of sources to use (defaults to all)

        Returns:
            Dictionary with scraping results
        """
        if target_date is None:
            target_date = get_today_date()

        if sources is None:
            sources = list(self.scrapers.keys())

        # Get current statistics
        stats = self.get_scraping_statistics(target_date)

        if stats['coverage_percentage'] >= 95:
            self.logger.info(f"High coverage already achieved: {stats['coverage_percentage']:.1f}%")
            return {
                'date': get_date_string(target_date),
                'status': 'high_coverage',
                'scraped_new': 0,
                'stats': stats
            }

        # Load daily matches
        daily_matches = self.json_handler.load_daily_matches(target_date)
        if not daily_matches:
            return {
                'date': get_date_string(target_date),
                'status': 'no_matches',
                'scraped_new': 0
            }

        # Find matches without details
        detailed_files = self.json_handler.get_existing_match_files(target_date)
        existing_ids = set()
        for file_path in detailed_files:
            filename = file_path.split('/')[-1]
            if filename.startswith('match_') and filename.endswith('.json'):
                match_id = filename[6:-5]  # Remove 'match_' and '.json'
                existing_ids.add(match_id)

        # Find missing matches
        missing_matches = []
        for match in daily_matches:
            if (match.get('match_url') and
                match.get('source') in sources and
                self._generate_match_id(match) not in existing_ids):
                missing_matches.append(match)

        self.logger.info(f"Found {len(missing_matches)} matches missing detailed information")

        # Scrape missing details
        scraped_count = 0
        for match in missing_matches:
            match_details = self.scrape_match_details(match['match_url'], match['source'])

            if match_details:
                merged_match = self._merge_match_data(match, match_details)
                match_id = self._generate_match_id(merged_match)
                self.json_handler.save_detailed_match(merged_match, target_date, match_id)
                scraped_count += 1

            # Add delay
            time.sleep(self.delay_between_matches)

        # Get updated statistics
        updated_stats = self.get_scraping_statistics(target_date)

        return {
            'date': get_date_string(target_date),
            'status': 'completed',
            'missing_matches': len(missing_matches),
            'scraped_new': scraped_count,
            'before_stats': stats,
            'after_stats': updated_stats
        }

    def _should_scrape_match(self, match: Dict[str, Any], target_date: date) -> tuple[bool, str]:
        """
        Determine if a match should be scraped based on its status and time.

        Args:
            match: Match data dictionary
            target_date: Target date for scraping

        Returns:
            Tuple of (should_scrape: bool, reason: str)
        """
        # Check if match is already scraped (has detailed data file)
        match_id = self._generate_match_id(match)
        if self.json_handler.detailed_match_exists(target_date, match_id):
            return False, "already_scraped"

        # Check match status
        status = match.get('status', '').lower()

        # Always scrape finished matches
        if status in ['finished', 'ft', 'full-time', 'completed']:
            return True, "finished_match"

        # Skip scheduled/live matches for future dates or today
        if status in ['scheduled', 'live', 'upcoming', '']:
            # For past dates, try to scrape anyway (might be finished now)
            current_date = datetime.now().date()
            if target_date < current_date:
                return True, "past_date_recheck"
            else:
                return False, "not_finished_yet"

        # Skip postponed/cancelled matches
        if status in ['postponed', 'cancelled', 'canceled', 'suspended']:
            return False, f"match_{status}"

        # Default: try to scrape
        return True, "unknown_status"

def process_daily_matches(date_str: str):
    """
    Adott nap összes meccsének feldolgozása

    Args:
        date_str (str): Dátum YYYY-MM-DD formátumban
    """
    # TODO: Implementálás
    pass

def save_match_details(match_data: Dict, filename: str):
    """
    Meccs adatok mentése JSON fájlba

    Args:
        match_data (Dict): Meccs adatok
        filename (str): Fájlnév
    """
    # TODO: Implementálás
    pass

def main():
    """Részletes meccs adatok gyűjtése"""
    print("⚽ Részletes meccs adatok gyűjtése...")

    # TODO: Implementálás
    pass

if __name__ == "__main__":
    main()

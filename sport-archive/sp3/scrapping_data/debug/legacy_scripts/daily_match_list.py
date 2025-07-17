#!/usr/bin/env python3
"""
Napi meccslista generáló
=======================

Ez a modul felelős az adott nap meccslistájának létrehozásáért.
Különböző forrásokból gyűjti össze a napi meccseket és JSON-ba menti.

Kimenet: data/YYYY/MM/DD/YYYYMMDD.json
"""

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

class DailyMatchListGenerator:
    """Generate daily match lists from multiple sources."""

    def __init__(self, base_path: str):
        """
        Initialize daily match list generator.

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
        self.timeout_per_scraper = 60  # Seconds

    def generate_daily_list(self, target_date: Optional[date] = None,
                           sources: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Generate daily match list for specified date.

        Args:
            target_date: Date to generate list for (defaults to today)
            sources: List of source names to use (defaults to all)

        Returns:
            Dictionary with results and metadata
        """
        if target_date is None:
            target_date = get_today_date()

        if sources is None:
            sources = list(self.scrapers.keys())

        self.logger.info(f"Generating daily match list for {get_date_string(target_date)}")
        self.logger.info(f"Using sources: {', '.join(sources)}")

        # Collect matches from all sources
        all_matches = []
        source_results = {}

        # Use concurrent execution for faster scraping
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit scraping tasks
            future_to_source = {}
            for source_name in sources:
                if source_name in self.scrapers:
                    scraper = self.scrapers[source_name]
                    future = executor.submit(self._scrape_source, scraper, target_date)
                    future_to_source[future] = source_name

            # Collect results
            for future in concurrent.futures.as_completed(future_to_source, timeout=self.timeout_per_scraper):
                source_name = future_to_source[future]
                try:
                    matches = future.result()
                    source_results[source_name] = {
                        'matches': matches,
                        'count': len(matches),
                        'status': 'success'
                    }
                    all_matches.extend(matches)
                    self.logger.info(f"Source {source_name}: {len(matches)} matches")

                except Exception as e:
                    source_results[source_name] = {
                        'matches': [],
                        'count': 0,
                        'status': 'failed',
                        'error': str(e)
                    }
                    self.logger.error(f"Source {source_name} failed: {e}")

        # Validate and clean matches
        validated_matches = self._validate_and_clean_matches(all_matches)

        # Remove duplicates
        unique_matches = self._remove_duplicates(validated_matches)

        # Create result summary
        result = {
            'date': get_date_string(target_date),
            'generated_at': datetime.now().isoformat(),
            'sources': source_results,
            'total_raw_matches': len(all_matches),
            'total_validated_matches': len(validated_matches),
            'total_unique_matches': len(unique_matches),
            'matches': unique_matches
        }

        # Save to file
        file_path = self.json_handler.save_daily_matches(unique_matches, target_date)
        result['file_path'] = file_path

        self.logger.info(f"Generated daily list: {len(unique_matches)} unique matches from {len(all_matches)} total")

        return result

    def _scrape_source(self, scraper, target_date: date) -> List[Dict[str, Any]]:
        """
        Scrape matches from a single source.

        Args:
            scraper: Scraper instance
            target_date: Date to scrape for

        Returns:
            List of matches from the source
        """
        try:
            start_time = time.time()
            matches = scraper.get_daily_matches(target_date)
            end_time = time.time()

            self.logger.debug(f"Scraped {scraper.source_name} in {end_time - start_time:.2f}s")
            return matches

        except Exception as e:
            self.logger.error(f"Error scraping {scraper.source_name}: {e}")
            return []

    def _validate_and_clean_matches(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Validate and clean match data.

        Args:
            matches: List of raw matches

        Returns:
            List of validated matches
        """
        validated_matches = []

        for match in matches:
            is_valid, errors = self.validator.validate_basic_match(match)

            if is_valid:
                # Clean team names
                match['home_team'] = self.validator.clean_team_name(match['home_team'])
                match['away_team'] = self.validator.clean_team_name(match['away_team'])
                match['league'] = self.validator.normalize_league_name(match['league'])

                validated_matches.append(match)
            else:
                self.logger.warning(f"Invalid match filtered out: {errors}")

        return validated_matches

    def _remove_duplicates(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Remove duplicate matches based on team names and time.

        Args:
            matches: List of validated matches

        Returns:
            List of unique matches
        """
        seen_signatures = set()
        unique_matches = []

        for match in matches:
            # Create signature for duplicate detection
            signature = self._create_match_signature(match)

            if signature not in seen_signatures:
                seen_signatures.add(signature)
                unique_matches.append(match)
            else:
                # If duplicate found, try to merge information
                existing_match = self._find_match_by_signature(unique_matches, signature)
                if existing_match:
                    merged_match = self._merge_matches(existing_match, match)
                    # Replace existing with merged
                    index = unique_matches.index(existing_match)
                    unique_matches[index] = merged_match

        return unique_matches

    def _create_match_signature(self, match: Dict[str, Any]) -> str:
        """Create unique signature for match."""
        home_team = match.get('home_team', '').lower().strip()
        away_team = match.get('away_team', '').lower().strip()
        match_time = match.get('match_time', '').strip()

        # Normalize team names for comparison
        home_team = self.validator.clean_team_name(home_team)
        away_team = self.validator.clean_team_name(away_team)

        return f"{home_team}_{away_team}_{match_time}"

    def _find_match_by_signature(self, matches: List[Dict[str, Any]], signature: str) -> Optional[Dict[str, Any]]:
        """Find match in list by signature."""
        for match in matches:
            if self._create_match_signature(match) == signature:
                return match
        return None

    def _merge_matches(self, match1: Dict[str, Any], match2: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge two similar matches from different sources.

        Args:
            match1: First match (existing)
            match2: Second match (new)

        Returns:
            Merged match dictionary
        """
        merged = match1.copy()

        # Combine sources
        sources = [match1.get('source', 'unknown')]
        if match2.get('source') and match2['source'] not in sources:
            sources.append(match2['source'])
        merged['sources'] = sources
        merged['source'] = 'merged'

        # Prefer non-empty values from either source
        merge_fields = ['match_url', 'venue', 'round_info', 'status']
        for field in merge_fields:
            if not merged.get(field) and match2.get(field):
                merged[field] = match2[field]

        # Merge odds if available
        if match2.get('odds') and not merged.get('odds'):
            merged['odds'] = match2['odds']
        elif match2.get('odds') and merged.get('odds'):
            # Combine odds from different sources
            merged['odds'].update(match2['odds'])

        # Keep track of merge
        merged['merged_at'] = datetime.now().isoformat()

        return merged

    def get_available_sources(self) -> Dict[str, Dict[str, Any]]:
        """
        Get information about available scrapers.

        Returns:
            Dictionary with source information
        """
        sources_info = {}

        for name, scraper in self.scrapers.items():
            sources_info[name] = scraper.get_source_info()

        return sources_info

    def test_sources(self) -> Dict[str, bool]:
        """
        Test connectivity to all sources.

        Returns:
            Dictionary with source availability status
        """
        results = {}

        for name, scraper in self.scrapers.items():
            try:
                results[name] = scraper.is_available()
                self.logger.info(f"Source {name}: {'available' if results[name] else 'unavailable'}")
            except Exception as e:
                results[name] = False
                self.logger.error(f"Source {name} test failed: {e}")

        return results

    def generate_multiple_days(self, start_date: date, end_date: date,
                              sources: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Generate daily match lists for multiple days.

        Args:
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            sources: List of sources to use

        Returns:
            List of daily results
        """
        from .utils.date_utils import get_date_range

        results = []
        dates = get_date_range(start_date, end_date)

        self.logger.info(f"Generating match lists for {len(dates)} days")

        for target_date in dates:
            result = self.generate_daily_list(target_date, sources)
            results.append(result)

            # Add delay between days to be respectful
            time.sleep(1)

        return results

def get_daily_matches(date_str=None):
    """
    Adott nap meccslistájának lekérése

    Args:
        date_str (str): Dátum YYYY-MM-DD formátumban

    Returns:
        list: Meccsek listája
    """
    # TODO: Implementálás
    pass

def save_daily_matches(matches, date_str):
    """
    Meccslista mentése JSON fájlba

    Args:
        matches (list): Meccsek listája
        date_str (str): Dátum YYYY-MM-DD formátumban
    """
    # TODO: Implementálás
    pass

def main():
    """Napi meccslista generálás"""
    print("📅 Napi meccslista generálása...")

    # TODO: Implementálás
    pass

if __name__ == "__main__":
    main()

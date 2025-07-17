#!/usr/bin/env python3
"""
Főkoordináló szkript a teljes scrapping folyamathoz
================================================

Ez a szkript koordinálja a teljes adatgyűjtési folyamatot:
1. Napi meccslista létrehozása
2. Részletes meccs adatok gyűjtése
3. Adatok validálása és mentése
4. Jelentések generálása

Használat:
    python scrapping.py [dátum]

Ha nincs dátum megadva, akkor a mai napot használja.
"""

import logging
import argparse
import sys
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
import json
import os

from .daily_match_list import DailyMatchListGenerator
from .detailed_match_scraper import DetailedMatchScraper
from .utils.date_utils import get_today_date, parse_date_string, get_date_string
from .utils.json_handler import JSONHandler


class ScrapingCoordinator:
    """Main coordinator for the scraping process."""

    def __init__(self, base_path: str, log_level: str = "INFO"):
        """
        Initialize scraping coordinator.

        Args:
            base_path: Base directory path for data storage
            log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
        """
        self.base_path = base_path

        # Create logs directory first
        self.logs_dir = os.path.join(base_path, "logs")
        os.makedirs(self.logs_dir, exist_ok=True)

        self.setup_logging(log_level)
        self.logger = logging.getLogger(__name__)

        # Initialize components
        self.daily_generator = DailyMatchListGenerator(base_path)
        self.detailed_scraper = DetailedMatchScraper(base_path)
        self.json_handler = JSONHandler(base_path)

    def setup_logging(self, log_level: str):
        """Setup logging configuration."""
        log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        logging.basicConfig(
            level=getattr(logging, log_level.upper()),
            format=log_format,
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler(
                    os.path.join(self.logs_dir, f"scraping_{datetime.now().strftime('%Y%m%d')}.log")
                )
            ]
        )

    def run_daily_scraping(self, target_date: Optional[date] = None,
                          sources: Optional[List[str]] = None,
                          include_details: bool = True) -> Dict[str, Any]:
        """
        Run complete daily scraping process.

        Args:
            target_date: Date to scrape (defaults to today)
            sources: List of sources to use (defaults to all)
            include_details: Whether to scrape detailed match information

        Returns:
            Dictionary with complete scraping results
        """
        if target_date is None:
            target_date = get_today_date()

        self.logger.info(f"Starting daily scraping for {get_date_string(target_date)}")

        session_results = {
            'date': get_date_string(target_date),
            'started_at': datetime.now().isoformat(),
            'sources': sources or ['all'],
            'include_details': include_details,
            'phase_results': {}
        }

        try:
            # Phase 1: Generate daily match list
            self.logger.info("Phase 1: Generating daily match list")
            daily_results = self.daily_generator.generate_daily_list(target_date, sources)
            session_results['phase_results']['daily_list'] = daily_results

            if daily_results['total_unique_matches'] == 0:
                self.logger.warning("No matches found for the date")
                session_results['status'] = 'no_matches'
                session_results['completed_at'] = datetime.now().isoformat()
                return session_results

            # Phase 2: Scrape detailed match information (if requested)
            if include_details:
                self.logger.info("Phase 2: Scraping detailed match information")
                detailed_results = self.detailed_scraper.scrape_daily_match_details(target_date, sources)
                session_results['phase_results']['detailed_scraping'] = detailed_results

            # Phase 3: Generate summary report
            self.logger.info("Phase 3: Generating summary report")
            summary = self.generate_daily_summary(target_date)
            session_results['summary'] = summary

            session_results['status'] = 'completed'
            session_results['completed_at'] = datetime.now().isoformat()

            # Save session log
            self._save_session_log(session_results)

            self.logger.info(f"Daily scraping completed successfully")

        except Exception as e:
            self.logger.error(f"Error during daily scraping: {e}")
            session_results['status'] = 'failed'
            session_results['error'] = str(e)
            session_results['completed_at'] = datetime.now().isoformat()

        return session_results

    def run_bulk_scraping(self, start_date: date, end_date: date,
                         sources: Optional[List[str]] = None,
                         include_details: bool = True) -> List[Dict[str, Any]]:
        """
        Run scraping for multiple dates.

        Args:
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            sources: List of sources to use
            include_details: Whether to scrape detailed information

        Returns:
            List of daily scraping results
        """
        from .utils.date_utils import get_date_range

        dates = get_date_range(start_date, end_date)
        self.logger.info(f"Starting bulk scraping for {len(dates)} days")

        bulk_results = []

        for i, target_date in enumerate(dates):
            self.logger.info(f"Processing day {i+1}/{len(dates)}: {get_date_string(target_date)}")

            daily_result = self.run_daily_scraping(target_date, sources, include_details)
            bulk_results.append(daily_result)

            # Add delay between days
            if i < len(dates) - 1:
                import time
                time.sleep(2)

        # Generate bulk summary
        bulk_summary = self._generate_bulk_summary(bulk_results)

        self.logger.info(f"Bulk scraping completed for {len(dates)} days")

        return bulk_results

    def update_missing_details(self, target_date: Optional[date] = None,
                              sources: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Update missing detailed information for existing matches.

        Args:
            target_date: Date to update (defaults to today)
            sources: List of sources to use

        Returns:
            Update results
        """
        if target_date is None:
            target_date = get_today_date()

        self.logger.info(f"Updating missing details for {get_date_string(target_date)}")

        result = self.detailed_scraper.bulk_scrape_missing_details(target_date, sources)

        self.logger.info(f"Updated {result.get('scraped_new', 0)} missing match details")

        return result

    def generate_daily_summary(self, target_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Generate comprehensive summary for a day's scraping.

        Args:
            target_date: Date to summarize (defaults to today)

        Returns:
            Summary dictionary
        """
        if target_date is None:
            target_date = get_today_date()

        # Get daily matches
        daily_matches = self.json_handler.load_daily_matches(target_date)

        # Get detailed scraping statistics
        scraping_stats = self.detailed_scraper.get_scraping_statistics(target_date)

        # Get source information
        sources_info = self.daily_generator.get_available_sources()

        # Count matches by league
        league_counts = {}
        if daily_matches:
            for match in daily_matches:
                league = match.get('league', 'Unknown')
                league_counts[league] = league_counts.get(league, 0) + 1

        # Count matches by source
        source_counts = {}
        if daily_matches:
            for match in daily_matches:
                source = match.get('source', 'Unknown')
                source_counts[source] = source_counts.get(source, 0) + 1

        summary = {
            'date': get_date_string(target_date),
            'generated_at': datetime.now().isoformat(),
            'total_matches': len(daily_matches) if daily_matches else 0,
            'matches_with_details': scraping_stats.get('matches_with_details', 0),
            'coverage_percentage': scraping_stats.get('coverage_percentage', 0),
            'league_breakdown': league_counts,
            'source_breakdown': source_counts,
            'sources_available': {name: info['available'] for name, info in sources_info.items()},
            'data_quality': self._assess_data_quality(daily_matches)
        }

        return summary

    def _assess_data_quality(self, matches: Optional[List[Dict[str, Any]]]) -> Dict[str, Any]:
        """Assess data quality of scraped matches."""
        if not matches:
            return {'score': 0, 'issues': ['No matches found']}

        quality_score = 100
        issues = []

        # Check for missing essential fields
        missing_times = sum(1 for m in matches if not m.get('match_time'))
        missing_leagues = sum(1 for m in matches if not m.get('league'))
        missing_urls = sum(1 for m in matches if not m.get('match_url'))

        if missing_times > 0:
            quality_score -= 20
            issues.append(f"{missing_times} matches missing time information")

        if missing_leagues > 0:
            quality_score -= 10
            issues.append(f"{missing_leagues} matches missing league information")

        if missing_urls > 0:
            quality_score -= 15
            issues.append(f"{missing_urls} matches missing URLs for details")

        # Check for duplicate teams
        team_names = []
        for match in matches:
            team_names.extend([match.get('home_team', ''), match.get('away_team', '')])

        duplicate_teams = len(team_names) - len(set(team_names))
        if duplicate_teams > len(matches) * 0.1:  # More than 10% duplicates
            quality_score -= 15
            issues.append("High number of duplicate team names detected")

        return {
            'score': max(0, quality_score),
            'issues': issues,
            'total_matches': len(matches),
            'missing_times': missing_times,
            'missing_leagues': missing_leagues,
            'missing_urls': missing_urls
        }

    def _save_session_log(self, session_results: Dict[str, Any]):
        """Save session results to log file."""
        session_date = session_results['date']
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"session_{session_date}_{timestamp}.json"
        filepath = os.path.join(self.logs_dir, filename)

        self.json_handler.save_json(session_results, filepath)
        self.logger.info(f"Session log saved to {filepath}")

    def _generate_bulk_summary(self, bulk_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary for bulk scraping operation."""
        total_days = len(bulk_results)
        successful_days = sum(1 for r in bulk_results if r.get('status') == 'completed')
        total_matches = sum(r.get('summary', {}).get('total_matches', 0) for r in bulk_results)

        return {
            'total_days': total_days,
            'successful_days': successful_days,
            'failed_days': total_days - successful_days,
            'success_rate': successful_days / total_days if total_days > 0 else 0,
            'total_matches_scraped': total_matches,
            'average_matches_per_day': total_matches / total_days if total_days > 0 else 0
        }

    def get_status_report(self, target_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Get current status report for scraping.

        Args:
            target_date: Date to check status for (defaults to today)

        Returns:
            Status report dictionary
        """
        if target_date is None:
            target_date = get_today_date()

        # Test source availability
        source_status = self.daily_generator.test_sources()

        # Get current data status
        daily_matches = self.json_handler.load_daily_matches(target_date)
        scraping_stats = self.detailed_scraper.get_scraping_statistics(target_date)

        # Check recent session logs
        recent_sessions = self._get_recent_session_logs(3)

        status_report = {
            'date': get_date_string(target_date),
            'checked_at': datetime.now().isoformat(),
            'sources_status': source_status,
            'data_status': {
                'has_daily_matches': daily_matches is not None,
                'total_matches': len(daily_matches) if daily_matches else 0,
                'matches_with_details': scraping_stats.get('matches_with_details', 0),
                'coverage_percentage': scraping_stats.get('coverage_percentage', 0)
            },
            'recent_sessions': recent_sessions,
            'recommendations': self._generate_recommendations(daily_matches, scraping_stats, source_status)
        }

        return status_report

    def _get_recent_session_logs(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent session logs."""
        log_files = []

        if os.path.exists(self.logs_dir):
            for filename in os.listdir(self.logs_dir):
                if filename.startswith('session_') and filename.endswith('.json'):
                    filepath = os.path.join(self.logs_dir, filename)
                    log_files.append((filepath, os.path.getmtime(filepath)))

        # Sort by modification time (newest first)
        log_files.sort(key=lambda x: x[1], reverse=True)

        recent_logs = []
        for filepath, _ in log_files[:limit]:
            log_data = self.json_handler.load_json(filepath)
            if log_data and isinstance(log_data, dict):
                recent_logs.append({
                    'date': log_data.get('date'),
                    'status': log_data.get('status'),
                    'total_matches': log_data.get('summary', {}).get('total_matches', 0),
                    'started_at': log_data.get('started_at')
                })

        return recent_logs

    def _generate_recommendations(self, daily_matches: Optional[List[Dict[str, Any]]],
                                 scraping_stats: Dict[str, Any],
                                 source_status: Dict[str, bool]) -> List[str]:
        """Generate recommendations based on current status."""
        recommendations = []

        # Check source availability
        unavailable_sources = [name for name, available in source_status.items() if not available]
        if unavailable_sources:
            recommendations.append(f"Sources unavailable: {', '.join(unavailable_sources)}")

        # Check data completeness
        if not daily_matches:
            recommendations.append("No daily matches found - run daily list generation")
        elif scraping_stats.get('coverage_percentage', 0) < 50:
            recommendations.append("Low detailed match coverage - run detailed scraping")

        # Check data freshness
        if daily_matches:
            # Simple check - could be enhanced with actual timestamp comparison
            recommendations.append("Consider refreshing data if more than 6 hours old")

        return recommendations


def main():
    """Main entry point for command line usage."""
    parser = argparse.ArgumentParser(description="Football Match Scraping System")
    parser.add_argument('--base-path', required=True, help='Base directory for data storage')
    parser.add_argument('--date', help='Target date (YYYY-MM-DD format)', default=None)
    parser.add_argument('--sources', nargs='+', help='Sources to use (flashscore, eredmenyek)', default=None)
    parser.add_argument('--mode', choices=['daily', 'details', 'update', 'status'],
                       default='daily', help='Operation mode')
    parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                       default='INFO', help='Logging level')
    parser.add_argument('--no-details', action='store_true', help='Skip detailed scraping')

    args = parser.parse_args()

    # Parse date if provided
    target_date = None
    if args.date:
        try:
            target_date = parse_date_string(args.date)
        except ValueError:
            print(f"Invalid date format: {args.date}. Use YYYY-MM-DD format.")
            sys.exit(1)

    # Initialize coordinator
    coordinator = ScrapingCoordinator(args.base_path, args.log_level)

    try:
        if args.mode == 'daily':
            # Run daily scraping
            result = coordinator.run_daily_scraping(
                target_date=target_date,
                sources=args.sources,
                include_details=not args.no_details
            )
            print(f"Daily scraping result: {result['status']}")
            if 'summary' in result:
                print(f"Total matches: {result['summary']['total_matches']}")
                print(f"Coverage: {result['summary']['coverage_percentage']:.1f}%")

        elif args.mode == 'details':
            # Run detailed scraping only
            result = coordinator.detailed_scraper.scrape_daily_match_details(target_date, args.sources)
            print(f"Detailed scraping: {result['scraped_matches']}/{result['matches_with_urls']} successful")

        elif args.mode == 'update':
            # Update missing details
            result = coordinator.update_missing_details(target_date, args.sources)
            print(f"Updated {result.get('scraped_new', 0)} missing match details")

        elif args.mode == 'status':
            # Show status report
            status = coordinator.get_status_report(target_date)
            print(f"Status for {status['date']}:")
            print(f"Daily matches: {status['data_status']['total_matches']}")
            print(f"Coverage: {status['data_status']['coverage_percentage']:.1f}%")
            print(f"Sources available: {sum(status['sources_status'].values())}/{len(status['sources_status'])}")

    except KeyboardInterrupt:
        print("Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

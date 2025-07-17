#!/usr/bin/env python3
"""
Automated FlashScore Data Collection System
==========================================

Automated system for regular collection of Bolivian football match data.
Features:
- Scheduled data collection
- Data validation and deduplication
- Error recovery and retry mechanisms
- Progress monitoring and reporting
- Integration with existing database

Developed by: AI Assistant
Version: 1.0
Date: 2025-01-09
"""

import schedule
import time
import json
import logging
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import subprocess
import sys
import os
from dataclasses import dataclass
from typing import List, Dict, Optional
import threading
import signal

# Import our enhanced scraper
sys.path.append('/home/bandi/Documents/code/2025/sp3/scrapping_data')
from enhanced_flashscore_v8 import EnhancedFlashScoreScraper

# Setup logging
LOG_DIR = Path('/home/bandi/Documents/code/2025/sp3/scrapping_data/logs')
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / f'automated_scraper_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ScrapingStats:
    """Scraping statistics"""
    total_runs: int = 0
    successful_runs: int = 0
    failed_runs: int = 0
    total_matches_scraped: int = 0
    total_events_collected: int = 0
    last_successful_run: Optional[str] = None
    last_failed_run: Optional[str] = None

class AutomatedDataCollector:
    """Automated data collection system"""

    def __init__(self):
        self.db_path = "/home/bandi/Documents/code/2025/sp3/scrapping_data/flashscore_matches.db"
        self.output_dir = Path("/home/bandi/Documents/code/2025/sp3/scrapping_data/automated_data")
        self.output_dir.mkdir(exist_ok=True)

        self.stats = ScrapingStats()
        self.is_running = True
        self.current_scraper = None

        # Load existing stats
        self.load_stats()

        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

    def signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.is_running = False
        if self.current_scraper:
            self.current_scraper.close_driver()
        self.save_stats()
        sys.exit(0)

    def load_stats(self):
        """Load statistics from file"""
        stats_file = self.output_dir / "scraping_stats.json"
        try:
            if stats_file.exists():
                with open(stats_file, 'r') as f:
                    data = json.load(f)
                    self.stats = ScrapingStats(**data)
                logger.info(f"Loaded stats: {self.stats.total_runs} total runs")
        except Exception as e:
            logger.warning(f"Could not load stats: {e}")

    def save_stats(self):
        """Save statistics to file"""
        stats_file = self.output_dir / "scraping_stats.json"
        try:
            with open(stats_file, 'w') as f:
                json.dump(self.stats.__dict__, f, indent=2)
            logger.info("Stats saved successfully")
        except Exception as e:
            logger.error(f"Could not save stats: {e}")

    def check_recent_data(self, hours=6):
        """Check if we have recent data in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Check for matches updated in the last N hours
            cutoff_time = datetime.now() - timedelta(hours=hours)
            cursor.execute(
                "SELECT COUNT(*) FROM matches WHERE updated_at > ?",
                (cutoff_time.isoformat(),)
            )
            recent_count = cursor.fetchone()[0]

            conn.close()

            logger.info(f"Found {recent_count} matches updated in last {hours} hours")
            return recent_count > 0

        except Exception as e:
            logger.error(f"Error checking recent data: {e}")
            return False

    def get_database_summary(self):
        """Get current database statistics"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Total matches
            cursor.execute("SELECT COUNT(*) FROM matches")
            total_matches = cursor.fetchone()[0]

            # Total events
            cursor.execute("SELECT COUNT(*) FROM match_events")
            total_events = cursor.fetchone()[0]

            # Latest match
            cursor.execute("SELECT home_team, away_team, updated_at FROM matches ORDER BY updated_at DESC LIMIT 1")
            latest_match = cursor.fetchone()

            conn.close()

            return {
                'total_matches': total_matches,
                'total_events': total_events,
                'latest_match': latest_match
            }

        except Exception as e:
            logger.error(f"Error getting database summary: {e}")
            return None

    def validate_scraped_data(self, results):
        """Validate scraped data quality"""
        try:
            issues = []

            if not results.get('detailed_matches'):
                issues.append("No matches found")
                return False, issues

            for i, match in enumerate(results['detailed_matches']):
                # Check required fields
                required_fields = ['match_id', 'url', 'home_team', 'away_team']
                for field in required_fields:
                    if not match.get(field):
                        issues.append(f"Match {i}: Missing {field}")

                # Check team names are reasonable
                home_team = match.get('home_team', '')
                away_team = match.get('away_team', '')

                if len(home_team) < 2 or len(away_team) < 2:
                    issues.append(f"Match {i}: Invalid team names")

                # Check events
                events = match.get('events', [])
                if len(events) == 0:
                    issues.append(f"Match {i}: No events found")

            # Check overall quality
            total_events = sum(len(match.get('events', [])) for match in results['detailed_matches'])
            if total_events < 5:  # Expect at least some events
                issues.append("Very few events extracted overall")

            is_valid = len(issues) == 0
            if not is_valid:
                logger.warning(f"Data validation failed: {issues}")
            else:
                logger.info("Data validation passed")

            return is_valid, issues

        except Exception as e:
            logger.error(f"Data validation error: {e}")
            return False, [str(e)]

    def run_scraping_job(self, max_matches=5, retry_count=3):
        """Run a single scraping job with retry logic"""

        for attempt in range(retry_count):
            try:
                logger.info(f"🚀 Starting scraping job (attempt {attempt + 1}/{retry_count})")

                # Check if we need fresh data
                if attempt == 0 and self.check_recent_data(hours=3):
                    logger.info("Recent data found, skipping this run")
                    return True

                # Initialize scraper
                self.current_scraper = EnhancedFlashScoreScraper(
                    headless=True,
                    debug=False,
                    use_database=True
                )

                # Run comprehensive scraping
                results = self.current_scraper.comprehensive_scrape(max_matches=max_matches)

                # Validate results
                is_valid, issues = self.validate_scraped_data(results)

                if not is_valid:
                    logger.warning(f"Data validation failed on attempt {attempt + 1}: {issues}")
                    if attempt < retry_count - 1:
                        self.current_scraper.close_driver()
                        time.sleep(30)  # Wait before retry
                        continue
                    else:
                        raise Exception(f"Data validation failed after all retries: {issues}")

                # Save results
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_file = self.output_dir / f"scraping_results_{timestamp}.json"

                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(results, f, ensure_ascii=False, indent=2)

                # Update statistics
                self.stats.total_runs += 1
                self.stats.successful_runs += 1
                self.stats.total_matches_scraped += len(results.get('detailed_matches', []))
                self.stats.total_events_collected += results.get('scraping_summary', {}).get('total_events_extracted', 0)
                self.stats.last_successful_run = datetime.now().isoformat()

                # Close scraper
                self.current_scraper.close_driver()
                self.current_scraper = None

                logger.info(f"✅ Scraping job completed successfully")
                logger.info(f"📊 Scraped {len(results.get('detailed_matches', []))} matches")
                logger.info(f"📁 Results saved to: {output_file}")

                return True

            except Exception as e:
                logger.error(f"❌ Scraping job failed on attempt {attempt + 1}: {e}")

                if self.current_scraper:
                    self.current_scraper.close_driver()
                    self.current_scraper = None

                if attempt == retry_count - 1:
                    # Final failure
                    self.stats.total_runs += 1
                    self.stats.failed_runs += 1
                    self.stats.last_failed_run = datetime.now().isoformat()
                    return False
                else:
                    # Wait before retry
                    time.sleep(60)

        return False

    def daily_data_collection(self):
        """Daily comprehensive data collection"""
        logger.info("🌅 Starting daily data collection")

        try:
            # Get database summary before
            db_summary_before = self.get_database_summary()
            logger.info(f"Database before: {db_summary_before}")

            # Run scraping with more matches for daily collection
            success = self.run_scraping_job(max_matches=10, retry_count=2)

            if success:
                # Get database summary after
                db_summary_after = self.get_database_summary()
                logger.info(f"Database after: {db_summary_after}")

                # Generate daily report
                self.generate_daily_report(db_summary_before, db_summary_after)

            # Save stats
            self.save_stats()

        except Exception as e:
            logger.error(f"Daily data collection failed: {e}")

    def hourly_data_collection(self):
        """Hourly quick data collection"""
        logger.info("⏰ Starting hourly data collection")

        try:
            # Quick check - only 3 matches
            success = self.run_scraping_job(max_matches=3, retry_count=1)

            if success:
                logger.info("✅ Hourly collection completed")
            else:
                logger.warning("⚠️ Hourly collection failed")

            # Save stats
            self.save_stats()

        except Exception as e:
            logger.error(f"Hourly data collection failed: {e}")

    def generate_daily_report(self, before, after):
        """Generate daily collection report"""
        try:
            timestamp = datetime.now().strftime("%Y-%m-%d")
            report = {
                'date': timestamp,
                'database_summary': {
                    'before': before,
                    'after': after,
                    'new_matches': after['total_matches'] - before['total_matches'] if before and after else 0,
                    'new_events': after['total_events'] - before['total_events'] if before and after else 0
                },
                'scraping_stats': self.stats.__dict__,
                'generated_at': datetime.now().isoformat()
            }

            report_file = self.output_dir / f"daily_report_{timestamp}.json"
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)

            logger.info(f"📄 Daily report generated: {report_file}")

        except Exception as e:
            logger.error(f"Report generation failed: {e}")

    def setup_schedule(self):
        """Setup automated scheduling"""

        # Daily comprehensive collection at 6 AM
        schedule.every().day.at("06:00").do(self.daily_data_collection)

        # Hourly quick updates during active hours
        for hour in [9, 12, 15, 18, 21]:
            schedule.every().day.at(f"{hour:02d}:00").do(self.hourly_data_collection)

        logger.info("📅 Automated schedule configured:")
        logger.info("  - Daily comprehensive collection: 06:00")
        logger.info("  - Hourly quick updates: 09:00, 12:00, 15:00, 18:00, 21:00")

    def run_scheduler(self):
        """Run the automated scheduler"""
        logger.info("🤖 Starting automated data collector")
        logger.info(f"💾 Database: {self.db_path}")
        logger.info(f"📁 Output directory: {self.output_dir}")

        # Initial database summary
        db_summary = self.get_database_summary()
        logger.info(f"📊 Current database: {db_summary}")

        self.setup_schedule()

        # Main scheduler loop
        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute

            except KeyboardInterrupt:
                logger.info("Received keyboard interrupt, shutting down...")
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(300)  # Wait 5 minutes on error

        logger.info("🛑 Automated data collector stopped")

def run_manual_collection():
    """Run manual data collection"""
    print("=" * 70)
    print("🔧 MANUAL DATA COLLECTION")
    print("=" * 70)

    collector = AutomatedDataCollector()

    try:
        # Run immediate collection
        success = collector.run_scraping_job(max_matches=5, retry_count=2)

        if success:
            print("✅ Manual collection completed successfully")

            # Show current database stats
            db_summary = collector.get_database_summary()
            if db_summary:
                print(f"\n📊 Current Database Summary:")
                print(f"  Total matches: {db_summary['total_matches']}")
                print(f"  Total events: {db_summary['total_events']}")
                if db_summary['latest_match']:
                    print(f"  Latest match: {db_summary['latest_match'][0]} vs {db_summary['latest_match'][1]}")
                    print(f"  Last updated: {db_summary['latest_match'][2]}")
            else:
                print("📊 Database summary not available")

            # Show scraping stats
            print(f"\n📈 Scraping Statistics:")
            print(f"  Total runs: {collector.stats.total_runs}")
            print(f"  Successful runs: {collector.stats.successful_runs}")
            print(f"  Failed runs: {collector.stats.failed_runs}")
            print(f"  Total matches scraped: {collector.stats.total_matches_scraped}")
            print(f"  Total events collected: {collector.stats.total_events_collected}")

        else:
            print("❌ Manual collection failed")

        collector.save_stats()

    except Exception as e:
        print(f"❌ Manual collection error: {e}")

    print("=" * 70)

def run_automated_collection():
    """Run automated data collection"""
    collector = AutomatedDataCollector()
    collector.run_scheduler()

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "auto":
        # Automated mode
        run_automated_collection()
    else:
        # Manual mode
        run_manual_collection()

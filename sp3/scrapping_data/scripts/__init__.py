"""
Football Match Scraping System

A comprehensive system for scraping daily match lists and detailed match information
from multiple football data sources.

Main Components:
- ScrapingCoordinator: Main orchestrator for the entire scraping process
- DailyMatchListGenerator: Generates daily match lists from multiple sources
- DetailedMatchScraper: Scrapes detailed match information
- BaseScraper: Base class for source-specific scrapers
- FlashScoreScraper: Scraper for FlashScore data
- EredmenyekScraper: Scraper for Eredmenyek.com data

Usage:
    from scripts.scrapping import ScrapingCoordinator

    coordinator = ScrapingCoordinator("/path/to/data")
    results = coordinator.run_daily_scraping()
"""

__version__ = "1.0.0"
__author__ = "Football Data Scraping Team"

# Import main classes for easy access - only existing modules
# from .scrapping import ScrapingCoordinator  # REMOVED - not exists
# from .daily_match_list import DailyMatchListGenerator  # REMOVED - not exists
# from .detailed_match_scraper import DetailedMatchScraper  # REMOVED - not exists

# Import utility classes
from .utils.json_handler import JSONHandler
from .utils.validators import MatchValidator
from .utils.date_utils import get_today_date, get_date_string, parse_date_string

# Import scrapers
from .sources.base_scraper import BaseScraper
from .sources.flashscore import FlashScoreScraper
from .sources.eredmenyek import EredmenyekScraper

__all__ = [
    # 'ScrapingCoordinator',       # REMOVED - not exists
    # 'DailyMatchListGenerator',   # REMOVED - not exists
    # 'DetailedMatchScraper',      # REMOVED - not exists
    'JSONHandler',
    'MatchValidator',
    'BaseScraper',
    'FlashScoreScraper',
    'EredmenyekScraper',
    'get_today_date',
    'get_date_string',
    'parse_date_string'
]

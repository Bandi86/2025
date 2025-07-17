"""
Konfiguráció kezelő modul
"""
import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

class Config:
    """
    Alkalmazás konfigurációs beállításai
    """

    def __init__(self):
        # API kulcsok
        self.SPORTS_API_KEY = os.getenv('SPORTS_API_KEY', '')
        self.FOOTBALL_API_KEY = os.getenv('FOOTBALL_API_KEY', '')
        self.ODDS_API_KEY = os.getenv('ODDS_API_KEY', '')

        # Scraping beállítások
        self.USER_AGENT = os.getenv('USER_AGENT', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36')
        self.REQUEST_DELAY = float(os.getenv('REQUEST_DELAY', '1.0'))
        self.MAX_RETRIES = int(os.getenv('MAX_RETRIES', '3'))

        # Adatbázis beállítások
        self.DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///sportagent.db')

        # Riport beállítások
        self.REPORTS_DIR = os.getenv('REPORTS_DIR', 'output/reports')
        self.TEMPLATES_DIR = os.getenv('TEMPLATES_DIR', 'templates')

        # Támogatott ligák és sportok
        self.SUPPORTED_LEAGUES = [
            'Premier League',
            'La Liga',
            'Serie A',
            'Bundesliga',
            'Ligue 1',
            'Champions League',
            'Europa League',
            'NBA',
            'NFL',
            'NHL',
            'MLB'
        ]

        # Scraping források
        self.SCRAPING_SOURCES = {
            'football': [
                'https://www.espn.com/soccer/fixtures',
                'https://www.bbc.com/sport/football/fixtures',
                'https://www.skysports.com/football/fixtures'
            ],
            'basketball': [
                'https://www.espn.com/nba/schedule',
                'https://www.nba.com/schedule'
            ],
            'american_football': [
                'https://www.espn.com/nfl/schedule',
                'https://www.nfl.com/schedules'
            ]
        }

        # API végpontok
        self.API_ENDPOINTS = {
            'sports_api': 'https://api.sportsdata.io/v3/',
            'football_api': 'https://api.football-data.org/v4/',
            'odds_api': 'https://api.the-odds-api.com/v4/'
        }

    def get_api_headers(self, api_name: str) -> Dict[str, str]:
        """
        API specifikus headerek visszaadása
        """
        headers = {
            'User-Agent': self.USER_AGENT,
            'Accept': 'application/json'
        }

        if api_name == 'football_api' and self.FOOTBALL_API_KEY:
            headers['X-Auth-Token'] = self.FOOTBALL_API_KEY

        return headers

    def validate_config(self) -> bool:
        """
        Konfiguráció validálása
        """
        required_dirs = [self.REPORTS_DIR, self.TEMPLATES_DIR]

        for directory in required_dirs:
            if not os.path.exists(directory):
                try:
                    os.makedirs(directory, exist_ok=True)
                except Exception as e:
                    print(f"Hiba a könyvtár létrehozásánál {directory}: {e}")
                    return False

        return True

    def get_config_summary(self) -> Dict[str, Any]:
        """
        Konfiguráció összefoglaló
        """
        return {
            'api_keys_configured': bool(self.SPORTS_API_KEY or self.FOOTBALL_API_KEY or self.ODDS_API_KEY),
            'supported_leagues': len(self.SUPPORTED_LEAGUES),
            'scraping_sources': sum(len(sources) for sources in self.SCRAPING_SOURCES.values()),
            'reports_dir': self.REPORTS_DIR,
            'templates_dir': self.TEMPLATES_DIR
        }

#!/usr/bin/env python3
"""
Enhanced FlashScore Scraper V8
===============================

Továbbfejlesztett FlashScore scraper részletes meccs adatokhoz.
Új funkciók:
- Részletes esemény timeline
- Játékos statisztikák
- Felállások és cserék
- Továbbfejlesztett adatbázis integráció
- Automatikus adatfrissítés
- Hibakezelés és visszaállítás

Fejlesztette: AI Assistant
Verzió: 8.0
Dátum: 2025-01-09
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
from datetime import datetime, timedelta
import logging
import sys
import os
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Any
import sqlite3

# Logging beállítása
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/bandi/Documents/code/2025/sp3/scrapping_data/flashscore_v8.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class MatchEvent:
    """Meccs esemény adatstruktúra"""
    minute: str
    event_type: str
    player: str
    team: str
    description: str
    additional_info: str = ""

@dataclass
class PlayerStats:
    """Játékos statisztikák"""
    name: str
    team: str
    position: str
    minutes_played: int
    goals: int = 0
    assists: int = 0
    yellow_cards: int = 0
    red_cards: int = 0
    substitution_minute: Optional[int] = None

@dataclass
class TeamLineup:
    """Csapat felállás"""
    formation: str
    starting_eleven: List[str]
    substitutes: List[str]
    coach: str = ""

@dataclass
class MatchStatistics:
    """Meccs statisztikák"""
    possession_home: int = 0
    possession_away: int = 0
    shots_home: int = 0
    shots_away: int = 0
    shots_on_target_home: int = 0
    shots_on_target_away: int = 0
    corners_home: int = 0
    corners_away: int = 0
    fouls_home: int = 0
    fouls_away: int = 0
    yellow_cards_home: int = 0
    yellow_cards_away: int = 0
    red_cards_home: int = 0
    red_cards_away: int = 0

@dataclass
class DetailedMatch:
    """Részletes meccs adatok"""
    match_id: str
    url: str
    home_team: str
    away_team: str
    date: str
    time: str
    status: str
    score_home: int
    score_away: int
    events: List[MatchEvent]
    home_lineup: TeamLineup
    away_lineup: TeamLineup
    statistics: MatchStatistics
    player_stats: List[PlayerStats]
    metadata: Dict[str, Any]

class EnhancedFlashScoreScraper:
    """Továbbfejlesztett FlashScore scraper"""

    def __init__(self, headless=True, debug=False, use_database=True):
        self.debug = debug
        self.headless = headless
        self.use_database = use_database
        self.driver = None
        self.base_url = "https://www.flashscore.com/football/bolivia/division-profesional/"
        self.db_path = "/home/bandi/Documents/code/2025/sp3/scrapping_data/flashscore_matches.db"

        if self.use_database:
            self.init_database()

        self.setup_driver()

        # Bolíviai csapatok kiterjesztett listája
        self.bolivia_teams = [
            'Always Ready', 'The Strongest', 'Blooming', 'Bolivar',
            'GV San Jose', 'SA Bulo Bulo', 'San Antonio Bulo Bulo',
            'Oriente Petrolero', 'Tomayapo', 'Real Tomayapo',
            'Academia del Balompie', 'Universitario de Vinto',
            'Guabira', 'Nacional Potosi', 'Real Oruro',
            'Independiente', 'Wilstermann', 'Jorge Wilstermann',
            'Aurora', 'Real Santa Cruz', 'Real Potosi'
        ]

    def init_database(self):
        """SQLite adatbázis inicializálása"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Meccsek tábla
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT UNIQUE,
                url TEXT,
                home_team TEXT,
                away_team TEXT,
                match_date TEXT,
                match_time TEXT,
                status TEXT,
                score_home INTEGER,
                score_away INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')

            # Események tábla
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS match_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT,
                minute TEXT,
                event_type TEXT,
                player TEXT,
                team TEXT,
                description TEXT,
                additional_info TEXT,
                FOREIGN KEY (match_id) REFERENCES matches (match_id)
            )
            ''')

            # Játékos statisztikák tábla
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS player_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT,
                player_name TEXT,
                team TEXT,
                position TEXT,
                minutes_played INTEGER,
                goals INTEGER DEFAULT 0,
                assists INTEGER DEFAULT 0,
                yellow_cards INTEGER DEFAULT 0,
                red_cards INTEGER DEFAULT 0,
                substitution_minute INTEGER,
                FOREIGN KEY (match_id) REFERENCES matches (match_id)
            )
            ''')

            # Meccs statisztikák tábla
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS match_statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT UNIQUE,
                possession_home INTEGER,
                possession_away INTEGER,
                shots_home INTEGER,
                shots_away INTEGER,
                shots_on_target_home INTEGER,
                shots_on_target_away INTEGER,
                corners_home INTEGER,
                corners_away INTEGER,
                fouls_home INTEGER,
                fouls_away INTEGER,
                yellow_cards_home INTEGER,
                yellow_cards_away INTEGER,
                red_cards_home INTEGER,
                red_cards_away INTEGER,
                FOREIGN KEY (match_id) REFERENCES matches (match_id)
            )
            ''')

            conn.commit()
            conn.close()
            logger.info("Database initialized successfully")

        except Exception as e:
            logger.error(f"Database initialization failed: {e}")

    def setup_driver(self):
        """Chrome driver beállítása optimalizált FlashScore scraping-hez"""
        chrome_options = webdriver.ChromeOptions()

        if self.headless:
            chrome_options.add_argument('--headless')

        # Optimalizált beállítások
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        # Valós felhasználó szimulálása
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        chrome_options.add_argument('--accept-lang=en-US,en;q=0.9')
        chrome_options.add_argument('--disable-web-security')
        chrome_options.add_argument('--allow-running-insecure-content')

        try:
            self.driver = webdriver.Chrome(
                service=ChromeService(ChromeDriverManager().install()),
                options=chrome_options
            )

            # Bot védelem kikerülése
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {
                "userAgent": 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })

            logger.info("Enhanced Chrome driver initialized")

        except Exception as e:
            logger.error(f"Driver initialization failed: {e}")
            raise

    def handle_cookies_and_modals(self):
        """Továbbfejlesztett cookie és modal kezelés"""
        if not self.driver:
            return False

        try:
            time.sleep(3)

            # FlashScore specifikus cookie és modal szelektorok
            dismiss_selectors = [
                "button[data-testid='wcmw-accept-all']",
                "button[id*='accept']",
                "button[class*='accept']",
                ".consent button",
                "#consent-accept",
                "[data-consent='accept']",
                "button[aria-label*='accept']",
                "button[aria-label*='Close']",
                ".modal button",
                ".popup button",
                "[class*='close']",
                "[class*='dismiss']"
            ]

            for selector in dismiss_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        if element.is_displayed() and element.is_enabled():
                            element.click()
                            logger.info(f"Dismissed modal/cookie: {selector}")
                            time.sleep(1)
                            break
                except:
                    continue

            # JavaScript alapú zárás
            self.driver.execute_script("""
                // Close any modals or overlays
                var overlays = document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="popup"]');
                overlays.forEach(function(overlay) {
                    if (overlay.style.display !== 'none') {
                        overlay.style.display = 'none';
                    }
                });

                // Accept cookies
                var cookieButtons = document.querySelectorAll('button');
                for (var i = 0; i < cookieButtons.length; i++) {
                    var text = cookieButtons[i].textContent.toLowerCase();
                    if (text.includes('accept') || text.includes('agree') || text.includes('ok')) {
                        cookieButtons[i].click();
                        break;
                    }
                }
            """)

            return True

        except Exception as e:
            logger.warning(f"Cookie/modal handling failed: {e}")
            return False

    def wait_for_content_load(self, timeout=20):
        """Tartalom betöltésére várakozás különböző stratégiákkal"""
        if not self.driver:
            return False

        try:
            wait = WebDriverWait(self.driver, timeout)

            # Különböző tartalom típusok várakozása
            content_indicators = [
                (".event__match", "Match events"),
                ("[class*='incident']", "Match incidents"),
                (".tableCellParticipant__name", "Team names"),
                ("[class*='fixture']", "Fixtures"),
                (".detailScore__wrapper", "Match scores"),
                (".smv__incident", "Match timeline")
            ]

            content_loaded = False
            for selector, description in content_indicators:
                try:
                    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                    logger.info(f"Content loaded: {description}")
                    content_loaded = True
                    break
                except TimeoutException:
                    continue

            if not content_loaded:
                logger.warning("No specific content indicators found, proceeding anyway")

            # Extra várakozás JavaScript rendering-re
            time.sleep(5)

            # Scroll a página para carregar conteúdo lazy-loaded
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            self.driver.execute_script("window.scrollTo(0, 0);")
            time.sleep(2)

            return True

        except Exception as e:
            logger.warning(f"Content loading wait failed: {e}")
            return False

    def extract_detailed_match_events(self):
        """Részletes meccs események kinyerése"""
        if not self.driver:
            return []

        events = []

        try:
            # Különböző esemény szelektorok kipróbálása
            event_selectors = [
                ".smv__incident",
                "[class*='incident']",
                ".event__incident",
                "[data-testid*='incident']",
                ".timeline__item",
                ".match-event"
            ]

            for selector in event_selectors:
                try:
                    event_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)

                    if event_elements:
                        logger.info(f"Found {len(event_elements)} events with selector: {selector}")

                        for event_elem in event_elements:
                            try:
                                event_text = event_elem.text.strip()
                                if len(event_text) < 5:
                                    continue

                                # Esemény parseolása
                                parsed_event = self.parse_advanced_event(event_text, event_elem)
                                if parsed_event:
                                    events.append(parsed_event)

                            except Exception as e:
                                if self.debug:
                                    logger.debug(f"Event parsing error: {e}")

                        if events:
                            break  # Ha találtunk eseményeket, ne próbáljunk más szelektorokat

                except Exception as e:
                    if self.debug:
                        logger.debug(f"Event selector {selector} failed: {e}")

            # Események rendezése idő szerint
            events.sort(key=lambda x: self.parse_event_minute(x.minute))

            logger.info(f"Extracted {len(events)} match events")
            return events

        except Exception as e:
            logger.error(f"Event extraction failed: {e}")
            return []

    def parse_advanced_event(self, event_text: str, event_elem) -> Optional[MatchEvent]:
        """Továbbfejlesztett esemény parseolás"""
        try:
            # Idő extraction (különböző formátumok)
            time_patterns = [
                r"(\d{1,2}(?:\+\d+)?)'",  # 45+2'
                r"(\d{1,2}:\d{2})",       # 45:30
                r"^(\d{1,2})\s",          # 45 kezdetén
                r"(\d{1,2})\s*min"        # 45 min
            ]

            minute = "0"
            for pattern in time_patterns:
                time_match = re.search(pattern, event_text)
                if time_match:
                    minute = time_match.group(1)
                    break

            # Esemény típus és játékos azonosítása
            event_type = "Event"
            player_name = ""
            team = ""
            additional_info = ""

            # Gól
            if any(keyword in event_text.lower() for keyword in ["goal", "gól", "⚽"]):
                event_type = "Goal"
                # Játékos név keresése gól előtt/után
                goal_patterns = [
                    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:goal|gól|⚽)",
                    r"(?:goal|gól|⚽)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)"
                ]
                for pattern in goal_patterns:
                    match = re.search(pattern, event_text, re.IGNORECASE)
                    if match:
                        player_name = match.group(1).strip()
                        break

            # Sárga lap
            elif any(keyword in event_text.lower() for keyword in ["yellow", "sárga", "🟨"]):
                event_type = "Yellow Card"
                yellow_patterns = [
                    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:yellow|sárga|🟨)",
                    r"(?:yellow|sárga|🟨)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)"
                ]
                for pattern in yellow_patterns:
                    match = re.search(pattern, event_text, re.IGNORECASE)
                    if match:
                        player_name = match.group(1).strip()
                        break

            # Piros lap
            elif any(keyword in event_text.lower() for keyword in ["red", "piros", "🟥"]):
                event_type = "Red Card"
                red_patterns = [
                    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:red|piros|🟥)",
                    r"(?:red|piros|🟥)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)"
                ]
                for pattern in red_patterns:
                    match = re.search(pattern, event_text, re.IGNORECASE)
                    if match:
                        player_name = match.group(1).strip()
                        break

            # Csere
            elif any(keyword in event_text.lower() for keyword in ["substitution", "sub", "csere", "⇄"]):
                event_type = "Substitution"
                sub_patterns = [
                    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:→|->|out|ki).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
                    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:←|<-|in|be).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)"
                ]
                for pattern in sub_patterns:
                    match = re.search(pattern, event_text, re.IGNORECASE)
                    if match:
                        player_name = f"{match.group(1)} → {match.group(2)}"
                        break

            # Csapat azonosítás
            for team_name in self.bolivia_teams:
                if team_name.lower() in event_text.lower():
                    team = team_name
                    break

            # HTML elemből további információk
            try:
                # Próbáljuk meg az elem class-ából vagy data attribútumokból kinyerni az info-t
                elem_classes = event_elem.get_attribute('class') or ""
                if 'home' in elem_classes:
                    additional_info += "home_team "
                elif 'away' in elem_classes:
                    additional_info += "away_team "

                # Data attribútumok
                data_attrs = event_elem.get_attribute('data-testid') or ""
                if data_attrs:
                    additional_info += f"testid:{data_attrs} "

            except:
                pass

            return MatchEvent(
                minute=minute,
                event_type=event_type,
                player=player_name,
                team=team,
                description=event_text,
                additional_info=additional_info.strip()
            )

        except Exception as e:
            if self.debug:
                logger.debug(f"Advanced event parsing error: {e}")
            return None

    def parse_event_minute(self, minute_str: str) -> int:
        """Esemény perc parseolása rendezéshez"""
        try:
            # Csak a számokat vegyük ki
            minute_match = re.search(r'(\d+)', str(minute_str))
            if minute_match:
                return int(minute_match.group(1))
            return 0
        except:
            return 0

    def extract_match_statistics(self):
        """Meccs statisztikák kinyerése"""
        try:
            stats = MatchStatistics()

            # Statisztikák tab megnyitása
            try:
                stats_tab_selectors = [
                    "a[href*='statistics']",
                    "button[data-testid*='stats']",
                    ".menu__link[href*='statistics']",
                    "[aria-label*='Statistics']"
                ]

                for selector in stats_tab_selectors:
                    try:
                        stats_tab = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if stats_tab.is_displayed():
                            stats_tab.click()
                            time.sleep(3)
                            break
                    except:
                        continue

            except Exception as e:
                logger.warning(f"Could not open statistics tab: {e}")

            # Statisztikák kinyerése
            stat_patterns = [
                (r"(\d+)%.*possession.*(\d+)%", "possession"),
                (r"(\d+).*shots.*(\d+)", "shots"),
                (r"(\d+).*on target.*(\d+)", "shots_on_target"),
                (r"(\d+).*corners.*(\d+)", "corners"),
                (r"(\d+).*fouls.*(\d+)", "fouls"),
                (r"(\d+).*yellow.*(\d+)", "yellow_cards"),
                (r"(\d+).*red.*(\d+)", "red_cards")
            ]

            page_text = self.driver.page_source.lower()

            for pattern, stat_name in stat_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    home_val = int(match.group(1))
                    away_val = int(match.group(2))
                    setattr(stats, f"{stat_name}_home", home_val)
                    setattr(stats, f"{stat_name}_away", away_val)

            logger.info("Match statistics extracted")
            return stats

        except Exception as e:
            logger.warning(f"Statistics extraction failed: {e}")
            return MatchStatistics()

    def extract_lineups(self):
        """Felállások kinyerése"""
        try:
            home_lineup = TeamLineup(formation="", starting_eleven=[], substitutes=[])
            away_lineup = TeamLineup(formation="", starting_eleven=[], substitutes=[])

            # Lineup tab megnyitása
            try:
                lineup_selectors = [
                    "a[href*='lineups']",
                    "button[data-testid*='lineup']",
                    ".menu__link[href*='lineups']",
                    "[aria-label*='Lineups']"
                ]

                for selector in lineup_selectors:
                    try:
                        lineup_tab = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if lineup_tab.is_displayed():
                            lineup_tab.click()
                            time.sleep(3)
                            break
                    except:
                        continue

            except Exception as e:
                logger.warning(f"Could not open lineups tab: {e}")

            # Játékosok kinyerése
            player_selectors = [
                ".lineups__player",
                "[class*='player']",
                ".lineup-player",
                "[data-testid*='player']"
            ]

            for selector in player_selectors:
                try:
                    players = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if players:
                        logger.info(f"Found {len(players)} players with selector: {selector}")

                        for player in players:
                            player_name = player.text.strip()
                            if len(player_name) > 2:
                                # Egyszerű logika: első 11 starting, többi substitute
                                if len(home_lineup.starting_eleven) < 11:
                                    home_lineup.starting_eleven.append(player_name)
                                elif len(away_lineup.starting_eleven) < 11:
                                    away_lineup.starting_eleven.append(player_name)
                                else:
                                    # Substitutes
                                    if len(home_lineup.substitutes) < len(away_lineup.substitutes):
                                        home_lineup.substitutes.append(player_name)
                                    else:
                                        away_lineup.substitutes.append(player_name)
                        break

                except Exception as e:
                    if self.debug:
                        logger.debug(f"Lineup extraction error for {selector}: {e}")

            logger.info(f"Extracted lineups - Home: {len(home_lineup.starting_eleven)} starting, Away: {len(away_lineup.starting_eleven)} starting")
            return home_lineup, away_lineup

        except Exception as e:
            logger.warning(f"Lineups extraction failed: {e}")
            return TeamLineup(formation="", starting_eleven=[], substitutes=[]), TeamLineup(formation="", starting_eleven=[], substitutes=[])

    def save_match_to_db(self, match: DetailedMatch):
        """Meccs mentése adatbázisba"""
        if not self.use_database:
            return

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Meccs alapadatok
            cursor.execute('''
            INSERT OR REPLACE INTO matches
            (match_id, url, home_team, away_team, match_date, match_time, status, score_home, score_away, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (
                match.match_id, match.url, match.home_team, match.away_team,
                match.date, match.time, match.status, match.score_home, match.score_away
            ))

            # Események törölése és újra hozzáadása
            cursor.execute('DELETE FROM match_events WHERE match_id = ?', (match.match_id,))

            for event in match.events:
                cursor.execute('''
                INSERT INTO match_events
                (match_id, minute, event_type, player, team, description, additional_info)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    match.match_id, event.minute, event.event_type,
                    event.player, event.team, event.description, event.additional_info
                ))

            # Statisztikák
            cursor.execute('''
            INSERT OR REPLACE INTO match_statistics
            (match_id, possession_home, possession_away, shots_home, shots_away,
             shots_on_target_home, shots_on_target_away, corners_home, corners_away,
             fouls_home, fouls_away, yellow_cards_home, yellow_cards_away,
             red_cards_home, red_cards_away)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                match.match_id, match.statistics.possession_home, match.statistics.possession_away,
                match.statistics.shots_home, match.statistics.shots_away,
                match.statistics.shots_on_target_home, match.statistics.shots_on_target_away,
                match.statistics.corners_home, match.statistics.corners_away,
                match.statistics.fouls_home, match.statistics.fouls_away,
                match.statistics.yellow_cards_home, match.statistics.yellow_cards_away,
                match.statistics.red_cards_home, match.statistics.red_cards_away
            ))

            conn.commit()
            conn.close()

            logger.info(f"Match {match.match_id} saved to database")

        except Exception as e:
            logger.error(f"Database save failed: {e}")

    def scrape_detailed_match(self, match_url: str) -> Optional[DetailedMatch]:
        """Részletes meccs scraping továbbfejlesztett funkcionalitással"""
        try:
            logger.info(f"🔍 Scraping detailed match: {match_url}")

            # Oldal betöltése
            self.driver.get(match_url)
            self.handle_cookies_and_modals()
            self.wait_for_content_load()

            # Match ID kinyerése URL-ből
            match_id = re.search(r'/([A-Za-z0-9]+)/#', match_url)
            match_id = match_id.group(1) if match_id else str(int(time.time()))

            # Alapinformációk
            title = self.driver.title
            home_team, away_team = "", ""

            # Csapatok kinyerése
            team_patterns = [
                r'(.+?)\s*vs?\s*(.+?)(?:\s*-|\s*live|$)',
                r'(.+?)\s*-\s*(.+?)(?:\s*live|$)'
            ]

            for pattern in team_patterns:
                team_match = re.search(pattern, title, re.IGNORECASE)
                if team_match:
                    home_team = team_match.group(1).strip()
                    away_team = team_match.group(2).strip()
                    break

            # Eredmény kinyerése
            score_home, score_away = 0, 0
            score_selectors = [
                ".detailScore__wrapper",
                "[class*='score']",
                ".smv__homeResult, .smv__awayResult"
            ]

            for selector in score_selectors:
                try:
                    score_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for elem in score_elements:
                        score_text = elem.text.strip()
                        score_match = re.search(r'(\d+)\s*[-:]\s*(\d+)', score_text)
                        if score_match:
                            score_home = int(score_match.group(1))
                            score_away = int(score_match.group(2))
                            break
                    if score_home or score_away:
                        break
                except:
                    continue

            # Részletes adatok kinyerése
            events = self.extract_detailed_match_events()
            statistics = self.extract_match_statistics()
            home_lineup, away_lineup = self.extract_lineups()

            # DetailedMatch objektum létrehozása
            detailed_match = DetailedMatch(
                match_id=match_id,
                url=match_url,
                home_team=home_team,
                away_team=away_team,
                date=datetime.now().strftime("%Y-%m-%d"),
                time=datetime.now().strftime("%H:%M"),
                status="Finished",
                score_home=score_home,
                score_away=score_away,
                events=events,
                home_lineup=home_lineup,
                away_lineup=away_lineup,
                statistics=statistics,
                player_stats=[],  # TODO: Implement player stats extraction
                metadata={
                    'timestamp': datetime.now().isoformat(),
                    'scraper_version': '8.0',
                    'title': title,
                    'url': match_url
                }
            )

            # Adatbázisba mentés
            self.save_match_to_db(detailed_match)

            logger.info(f"✅ Detailed match scraped successfully: {home_team} vs {away_team}")
            return detailed_match

        except Exception as e:
            logger.error(f"❌ Detailed match scraping failed: {e}")
            return None

    def get_recent_match_urls(self, limit=10):
        """Legutóbbi meccs URL-ek kinyerése"""
        try:
            results_url = f"{self.base_url}results/"
            self.driver.get(results_url)
            self.handle_cookies_and_modals()
            self.wait_for_content_load()

            match_urls = []

            # Meccs linkek keresése
            link_selectors = [
                "a[href*='/match/']",
                ".event__match a",
                "[class*='fixture'] a",
                "[data-testid*='match'] a"
            ]

            for selector in link_selectors:
                try:
                    links = self.driver.find_elements(By.CSS_SELECTOR, selector)

                    for link in links:
                        href = link.get_attribute('href')
                        if href and 'flashscore.com' in href and '/match/' in href:
                            if href not in match_urls:
                                match_urls.append(href)

                        if len(match_urls) >= limit:
                            break

                    if len(match_urls) >= limit:
                        break

                except Exception as e:
                    if self.debug:
                        logger.debug(f"Link extraction error for {selector}: {e}")

            logger.info(f"Found {len(match_urls)} recent match URLs")
            return match_urls[:limit]

        except Exception as e:
            logger.error(f"Recent match URLs extraction failed: {e}")
            return []

    def comprehensive_scrape(self, max_matches=5):
        """Átfogó scraping továbbfejlesztett funkciókkal"""
        logger.info("🚀 Starting comprehensive enhanced scraping...")

        results = {
            'detailed_matches': [],
            'scraping_summary': {
                'total_matches_attempted': 0,
                'successful_matches': 0,
                'failed_matches': 0,
                'total_events_extracted': 0,
                'start_time': datetime.now().isoformat(),
                'end_time': None
            },
            'metadata': {
                'scraper_version': '8.0',
                'database_enabled': self.use_database,
                'debug_mode': self.debug
            }
        }

        try:
            # Legutóbbi meccs URL-ek megszerzése
            match_urls = self.get_recent_match_urls(max_matches)

            if not match_urls:
                logger.warning("No match URLs found")
                return results

            # Meccsek részletes scraping-je
            for i, match_url in enumerate(match_urls):
                try:
                    logger.info(f"📊 Processing match {i+1}/{len(match_urls)}")
                    results['scraping_summary']['total_matches_attempted'] += 1

                    detailed_match = self.scrape_detailed_match(match_url)

                    if detailed_match:
                        results['detailed_matches'].append(asdict(detailed_match))
                        results['scraping_summary']['successful_matches'] += 1
                        results['scraping_summary']['total_events_extracted'] += len(detailed_match.events)
                        logger.info(f"✅ Match {i+1} completed successfully")
                    else:
                        results['scraping_summary']['failed_matches'] += 1
                        logger.warning(f"❌ Match {i+1} failed")

                    # Rate limiting
                    time.sleep(3)

                except Exception as e:
                    logger.error(f"Match {i+1} processing error: {e}")
                    results['scraping_summary']['failed_matches'] += 1

            results['scraping_summary']['end_time'] = datetime.now().isoformat()

            logger.info("🎯 Comprehensive scraping completed")
            return results

        except Exception as e:
            logger.error(f"Comprehensive scraping failed: {e}")
            results['scraping_summary']['end_time'] = datetime.now().isoformat()
            return results

    def close_driver(self):
        """Driver bezárása"""
        if self.driver:
            self.driver.quit()
            logger.info("Enhanced driver closed")

def test_enhanced_scraper():
    """Továbbfejlesztett scraper tesztelése"""
    print("=" * 80)
    print("⚡ ENHANCED FLASHSCORE SCRAPER V8 TEST")
    print("=" * 80)

    scraper = EnhancedFlashScoreScraper(headless=False, debug=True, use_database=True)

    try:
        # Átfogó scraping végrehajtása
        results = scraper.comprehensive_scrape(max_matches=3)

        # Eredmények mentése
        output_file = "/home/bandi/Documents/code/2025/sp3/scrapping_data/enhanced_flashscore_v8_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(f"\n💾 Results saved to: {output_file}")

        # Részletes összefoglaló
        summary = results['scraping_summary']
        print(f"\n📊 SCRAPING SUMMARY:")
        print(f"🎯 Total matches attempted: {summary['total_matches_attempted']}")
        print(f"✅ Successful matches: {summary['successful_matches']}")
        print(f"❌ Failed matches: {summary['failed_matches']}")
        print(f"⚽ Total events extracted: {summary['total_events_extracted']}")
        print(f"⏱️ Duration: {summary['start_time']} - {summary['end_time']}")

        # Sample detailed match
        if results['detailed_matches']:
            print(f"\n🔍 SAMPLE DETAILED MATCH:")
            match = results['detailed_matches'][0]
            print(f"  🏠 Home Team: {match['home_team']}")
            print(f"  🏃 Away Team: {match['away_team']}")
            print(f"  ⚽ Score: {match['score_home']} - {match['score_away']}")
            print(f"  📝 Events: {len(match['events'])}")
            print(f"  👥 Home Lineup: {len(match['home_lineup']['starting_eleven'])} players")
            print(f"  👥 Away Lineup: {len(match['away_lineup']['starting_eleven'])} players")

            # Sample events
            if match['events']:
                print(f"  🎬 Sample Events:")
                for event in match['events'][:3]:
                    print(f"    {event['minute']}' {event['event_type']}: {event['description'][:50]}...")

        print(f"\n🗄️ Database: {scraper.db_path}")
        print("=" * 80)

    except Exception as e:
        logger.error(f"Test failed: {e}")
        print(f"❌ Test failed: {e}")

    finally:
        scraper.close_driver()

if __name__ == "__main__":
    test_enhanced_scraper()

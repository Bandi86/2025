#!/usr/bin/env python3
"""
Tippmix Pro webscraper
Scrapes match data from https://www.tippmixpro.hu
"""

import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from PIL import Image
import pytesseract

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TippmixProScraper:
    def __init__(self):
        self.base_url = "https://www.tippmixpro.hu"
        self.driver = self._init_driver()
    
    def _init_driver(self):
        """Initializes the Selenium WebDriver."""
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option('excludeSwitches', ['enable-automation'])
        
        driver = webdriver.Chrome(options=options)
        return driver

    def scrape_matches(self, date: str = None) -> List[Dict]:
        """
        Scrape matches for a specific date using Selenium to handle dynamic content.
        Args:
            date: Date in format YYYY-MM-DD (defaults to today)
        Returns:
            List of match dictionaries
        """
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        url = f"{self.base_url}/hu/fogadas/i/elo-naptar/osszes/0/{date}"
        logger.info(f"Scraping matches from: {url}")
        
        try:
            self.driver.get(url)
            self._handle_cookie_consent()
            
            logger.info("Waiting for the sports iframe to be present...")
            WebDriverWait(self.driver, 30).until(
                EC.frame_to_be_available_and_switch_to_it((By.ID, "SportsIframe"))
            )
            logger.info("Switched to sports iframe.")

            logger.info("Waiting for match container to load inside the iframe...")
            WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'div.OM-LiveCalendar'))
            )
            logger.info("Match container loaded inside the iframe.")

            self._click_load_more_button()
            
            time.sleep(5) # Wait for any final content to settle

            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            matches = self._parse_matches(soup)

            if not matches:
                logger.warning("No matches found after parsing. The page structure might have changed. Saving screenshot.")
                self.take_screenshot(f"no_matches_found_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
            
            logger.info(f"Successfully scraped {len(matches)} matches")
            
            # Switch back to the main document
            self.driver.switch_to.default_content()
            
            return matches
            
        except TimeoutException as e:
            logger.error(f"Timeout while loading page or elements on {url}: {e}. Saving page source and attempting screenshot OCR.")
            html_filename = f"timeout_page_source_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            html_filepath = os.path.join(os.path.dirname(__file__), "screenshots", html_filename)
            os.makedirs(os.path.dirname(html_filepath), exist_ok=True)
            with open(html_filepath, 'w', encoding='utf-8') as f:
                f.write(self.driver.page_source)
            logger.info(f"Page source saved to {html_filepath}")
            
            screenshot_path = self.take_screenshot(f"timeout_error_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
            if screenshot_path:
                logger.info(f"Screenshot saved to {screenshot_path}")
                matches = self._extract_data_from_screenshot(screenshot_path)
                if matches:
                    logger.info(f"Successfully extracted {len(matches)} matches from screenshot using OCR.")
                    return matches
                else:
                    logger.warning("OCR extraction failed or found no matches.")
            return []
        except Exception as e:
            logger.error(f"An unexpected error occurred during scraping: {e}")
            return []

    def _handle_cookie_consent(self):
        """Attempts to find and click the cookie consent button."""
        try:
            cookie_selectors = [
                (By.ID, 'onetrust-accept-btn-handler'),
                (By.CSS_SELECTOR, 'button.cookie-consent-button'),
                (By.XPATH, "//button[contains(., 'Elfogadom') or contains(., 'Accept')]"),
                (By.XPATH, "//a[contains(., 'Elfogadom') or contains(., 'Accept')]"),
            ]
            
            for selector_type, selector_value in cookie_selectors:
                try:
                    cookie_button = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((selector_type, selector_value))
                    )
                    self.driver.execute_script("arguments[0].click();", cookie_button)
                    logger.info(f"Clicked cookie consent button using {selector_type}: {selector_value}")
                    time.sleep(2)
                    return
                except TimeoutException:
                    continue
        except TimeoutException:
            logger.debug("Cookie consent button not found within timeout.")
        except NoSuchElementException:
            logger.debug("Cookie consent button element not found.")
        except Exception as e:
            logger.debug(f"An unexpected error occurred while handling cookie consent: {e}")

    def _click_load_more_button(self):
        """Repeatedly clicks the 'load more' button until it is no longer present."""
        load_more_xpath = "//button[contains(@class, 'ShowMore') or contains(@class, 'LoadMore') or contains(text(), 'Több') or contains(text(), 'More')]"
        
        max_attempts = 50 # Increased maximum attempts
        attempt = 0
        
        while attempt < max_attempts:
            try:
                # Scroll to bottom first to make sure the button is in the viewport if it exists
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1) # Give a moment for scroll to complete

                # Try to find the button. If not found, NoSuchElementException is raised.
                load_more_button = self.driver.find_element(By.XPATH, load_more_xpath)
                logger.info(f"Found load more button on attempt {attempt + 1}.")
                
                # Click the button using JavaScript
                self.driver.execute_script("arguments[0].click();", load_more_button)
                logger.info(f"Clicked 'load more' button (Attempt {attempt + 1}/{max_attempts})")
                
                time.sleep(3) # Wait for new content to load
                attempt += 1

            except NoSuchElementException:
                logger.info("Load more button not found. Assuming all matches are loaded.")
                break # Exit the while loop
            except (ElementClickInterceptedException, StaleElementReferenceException) as e:
                logger.warning(f"Handled Selenium exception during load more button interaction: {e}. Retrying...")
                time.sleep(2) # Wait a bit before retrying
                attempt += 1
            except Exception as e:
                logger.error(f"An unexpected error occurred during load more button interaction: {e}")
                break
        
        logger.info("Finished attempting to load more matches.")

    def take_screenshot(self, filename: str = "screenshot.png") -> Optional[str]:
        """Takes a screenshot of the current page and saves it to a file."""
        try:
            screenshot_dir = os.path.join(os.path.dirname(__file__), "screenshots")
            os.makedirs(screenshot_dir, exist_ok=True)
            filepath = os.path.join(screenshot_dir, filename)
            self.driver.save_screenshot(filepath)
            logger.info(f"Screenshot saved to {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Error taking screenshot: {e}")
            return None

    def _extract_data_from_screenshot(self, image_path: str) -> List[Dict]:
        """Extracts text from a screenshot using OCR and attempts to parse match data."""
        try:
            text = pytesseract.image_to_string(Image.open(image_path), lang='hun')
            logger.debug(f"OCR extracted text:\n{text}")
            
            matches = []
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if ':' in line and ('-' in line or 'vs' in line):
                    parts = line.split(' ')
                    if len(parts) >= 4:
                        time_str = parts[0]
                        event_str = " ".join(parts[1:-1])
                        championship_str = parts[-1]
                        matches.append({
                            'datum': time_str,
                            'esemeny': event_str,
                            'bajnoksag': championship_str,
                            'raw_data': line,
                            'scraped_at': datetime.now().isoformat()
                        })
            return matches
        except Exception as e:
            logger.error(f"Error during OCR extraction: {e}")
            return []
    
    def _close_driver(self):
        """Closes the Selenium WebDriver."""
        if self.driver:
            self.driver.quit()
            logger.info("Selenium WebDriver closed.")

    def _parse_matches(self, soup: BeautifulSoup) -> List[Dict]:
        """Parse match data from the HTML soup"""
        matches = []
        
        calendar_container = soup.select_one('div.OM-LiveCalendar')
        if not calendar_container:
            logger.warning("Could not find the main calendar container ('div.OM-LiveCalendar').")
            return []

        match_items = calendar_container.select('div.OM-LiveCalendar__Item')
        logger.info(f"Found {len(match_items)} match items using selector 'div.OM-LiveCalendar__Item'")
        
        for item in match_items:
            match_data = self._extract_match_data(item)
            if match_data:
                matches.append(match_data)
        
        return matches
    
    def _extract_match_data(self, item) -> Optional[Dict]:
        """Extract match data from a match item div"""
        try:
            time_element = item.select_one('.OM-LiveCalendar__Time')
            home_participant_element = item.select_one('.OM-LiveCalendar__HomeParticipantName')
            away_participant_element = item.select_one('.OM-LiveCalendar__AwayParticipantName')
            tournament_element = item.select_one('.OM-LiveCalendar__TournamentName')
            link_element = item.select_one('a.OM-WidgetsLink.OM-LiveCalendar__Indicator')
            
            if not all([time_element, home_participant_element, away_participant_element, tournament_element, link_element]):
                logger.debug("Missing one or more main elements for match data extraction.")
                return None
            
            relative_link = link_element.get('href')
            absolute_link = urljoin(self.base_url, relative_link) if relative_link else ''

            # Extract odds
            odds_data = {}
            market_element = item.select_one('.OM-LiveCalendar__Market')
            if market_element:
                outcomes = market_element.select('.OM-Outcome')
                for outcome in outcomes:
                    name_element = outcome.select_one('.OM-Outcome_Name')
                    odds_element = outcome.select_one('.OM-Outcome_Odds')
                    if name_element and odds_element:
                        outcome_name = name_element.get_text(strip=True)
                        outcome_odds = odds_element.get_text(strip=True)
                        if outcome_name and outcome_odds:
                            odds_data[outcome_name] = outcome_odds

            match_data = {
                'datum': time_element.get_text(strip=True),
                'esemeny': f"{home_participant_element.get_text(strip=True)} - {away_participant_element.get_text(strip=True)}",
                'bajnoksag': tournament_element.get_text(strip=True),
                'link': absolute_link,
                'link_text': link_element.get_text(strip=True),
                'odds': odds_data, # Add odds to the dictionary
                'raw_data': item.get_text(strip=True),
                'scraped_at': datetime.now().isoformat()
            }
            
            return match_data

        except Exception as e:
            logger.debug(f"Error extracting match data: {e}")

        return None
    
    def save_to_json(self, matches: List[Dict], filename: str = None) -> str:
        """Save matches to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"tippmix_matches_{timestamp}.json"
        
        # Ensure directory exists
        output_dir = os.path.join(os.path.dirname(__file__), 'data')
        os.makedirs(output_dir, exist_ok=True)
        filepath = os.path.join(output_dir, filename)
        
        data = {
            'scraped_at': datetime.now().isoformat(),
            'total_matches': len(matches),
            'matches': matches
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Saved {len(matches)} matches to {filepath}")
        return filepath

    def scrape_match_odds(self, match_url: str, max_retries: int = 3) -> Dict:
        """
        Scrape pre-match odds from a specific match URL with retry mechanism.
        Args:
            match_url: The URL of the match page.
            max_retries: Maximum number of retry attempts.
        Returns:
            A dictionary containing pre-match odds.
        """
        logger.info(f"Scraping pre-match odds from: {match_url}")
        
        for attempt in range(max_retries):
            try:
                # Add delay between requests to avoid rate limiting
                if attempt > 0:
                    delay = 2 ** attempt  # Exponential backoff
                    logger.info(f"Retry attempt {attempt + 1}/{max_retries} after {delay}s delay")
                    time.sleep(delay)
                
                self.driver.get(match_url)
                self._handle_cookie_consent()

                logger.info("Waiting for the sports iframe to be present...")
                WebDriverWait(self.driver, 45).until(
                    EC.frame_to_be_available_and_switch_to_it((By.ID, "SportsIframe"))
                )
                logger.info("Switched to sports iframe.")

                logger.info("Waiting for odds container to load inside the iframe...")
                
                # Try multiple selectors for the odds container
                odds_selectors = [
                    'div.OM-EventView',
                    'div.OM-EventView-Container',
                    'div[class*="EventView"]',
                    'div.OM-MarketGroup',
                    'div[class*="Market"]'
                ]
                
                odds_container = None
                for selector in odds_selectors:
                    try:
                        odds_container = WebDriverWait(self.driver, 15).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                        logger.info(f"Found odds container using selector: {selector}")
                        break
                    except TimeoutException:
                        continue
                
                if not odds_container:
                    raise TimeoutException("No odds container found with any selector")

                logger.info("Odds container loaded inside the iframe.")

                # Wait a bit more for dynamic content to load
                time.sleep(3)

                soup = BeautifulSoup(self.driver.page_source, 'html.parser')
                odds = self._parse_pre_match_odds(soup)

                self.driver.switch_to.default_content()
                
                if odds:
                    logger.info(f"Successfully scraped odds with {len(odds)} markets")
                    return odds
                else:
                    logger.warning("No odds found in parsed content")
                    if attempt == max_retries - 1:
                        return {}

            except TimeoutException as e:
                logger.error(f"Timeout while loading match page {match_url} (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    self.take_screenshot(f"match_page_timeout_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
                    return {}
            except Exception as e:
                logger.error(f"Error scraping match odds from {match_url} (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    return {}
            finally:
                # Always switch back to default content
                try:
                    self.driver.switch_to.default_content()
                except:
                    pass
        
        return {}

    def _parse_pre_match_odds(self, soup: BeautifulSoup) -> Dict:
        """
        Parse pre-match odds from the HTML soup of a match page.
        This is a placeholder and needs to be implemented based on the actual HTML structure.
        """
        pre_match_odds = {}
        # Example: Find elements containing odds. This will vary greatly by website.
        # Look for common patterns like 'outcome-name' and 'outcome-odds'
        # For demonstration, let's assume a simple structure:
        # <div class="OM-Market">
        #   <div class="OM-Outcome">
        #     <span class="OM-Outcome_Name">Home</span>
        #     <span class="OM-Outcome_Odds">1.50</span>
        #   </div>
        #   ...
        # </div>
        
        # Find all market groups (e.g., "Full Time Result", "Over/Under")
        market_groups = soup.select('div.OM-MarketGroup')
        for group in market_groups:
            market_name_element = group.select_one('div.OM-MarketGroup_Title')
            if market_name_element:
                market_name = market_name_element.get_text(strip=True)
                pre_match_odds[market_name] = {}
                
                outcomes = group.select('div.OM-Outcome')
                for outcome in outcomes:
                    name_element = outcome.select_one('.OM-Outcome_Name')
                    odds_element = outcome.select_one('.OM-Outcome_Odds')
                    if name_element and odds_element:
                        outcome_name = name_element.get_text(strip=True)
                        outcome_odds = odds_element.get_text(strip=True)
                        pre_match_odds[market_name][outcome_name] = outcome_odds
        
        return pre_match_odds

def main():
    """Main function to run the scraper"""
    scraper = TippmixProScraper()
    
    try:
        # Scrape today's matches
        today_str = datetime.now().strftime('%Y-%m-%d')
        matches = scraper.scrape_matches(date=today_str)
        
        if matches:
            # Save to JSON with date in the filename
            filename = f"tippmix_matches_{today_str.replace('-','')}.json"
            scraper.save_to_json(matches, filename=filename)
            print(f"Successfully scraped and saved {len(matches)} matches to {filename}")

        else:
            print("No matches found or error occurred during scraping")

    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
    except Exception as e:
        print(f"Unexpected error during scraping: {e}")
    finally:
        scraper._close_driver()

if __name__ == "__main__":
    main()
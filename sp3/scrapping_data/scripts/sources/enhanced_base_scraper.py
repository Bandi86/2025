#!/usr/bin/env python3
"""
Enhanced Base Scraper with Selenium Support
==========================================

Extended base scraper that supports both requests and Selenium
for sites that require JavaScript rendering.
"""

import requests
from bs4 import BeautifulSoup
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import time
import logging
from datetime import datetime, date
import random
import os

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service as ChromeService
    from webdriver_manager.chrome import ChromeDriverManager
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    # Create dummy classes to avoid unbound variable errors
    webdriver = None
    ChromeService = None
    ChromeDriverManager = None
    By = None
    WebDriverWait = None
    EC = None
    TimeoutException = Exception
    NoSuchElementException = Exception

from .base_scraper import BaseScraper

class EnhancedBaseScraper(BaseScraper):
    """
    Enhanced base scraper with Selenium support for JavaScript-heavy sites
    """

    def __init__(self, source_name: str, base_url: str, delay_range: tuple = (1, 3),
                 use_selenium: bool = False, headless: bool = True):
        """
        Initialize enhanced scraper

        Args:
            source_name: Name of the data source
            base_url: Base URL for the source
            delay_range: Min and max delay between requests (seconds)
            use_selenium: Whether to use Selenium for JavaScript rendering
            headless: Whether to run browser in headless mode
        """
        super().__init__(source_name, base_url, delay_range)

        self.use_selenium = use_selenium and SELENIUM_AVAILABLE
        self.headless = headless
        self.driver = None

        if self.use_selenium:
            self.setup_selenium()

        if use_selenium and not SELENIUM_AVAILABLE:
            self.logger.warning("Selenium requested but not available. Falling back to requests.")

    def setup_selenium(self):
        """Setup Chrome WebDriver with optimal settings"""
        if not SELENIUM_AVAILABLE:
            self.logger.error("Selenium not available")
            return False

        try:
            chrome_options = webdriver.ChromeOptions()

            if self.headless:
                chrome_options.add_argument('--headless')

            # Optimized settings for scraping
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)

            # Real user simulation
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            chrome_options.add_argument('--accept-lang=en-US,en;q=0.9')
            chrome_options.add_argument('--disable-web-security')
            chrome_options.add_argument('--allow-running-insecure-content')

            # Disable images and CSS for faster loading
            prefs = {
                "profile.managed_default_content_settings.images": 2,
                "profile.default_content_setting_values.notifications": 2
            }
            chrome_options.add_experimental_option("prefs", prefs)

            self.driver = webdriver.Chrome(
                service=ChromeService(ChromeDriverManager().install()),
                options=chrome_options
            )

            # Anti-bot measures
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {
                "userAgent": 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })

            self.logger.info("Enhanced Chrome driver initialized successfully")
            return True

        except Exception as e:
            self.logger.error(f"Failed to setup Selenium driver: {e}")
            self.use_selenium = False
            return False

    def handle_cookies_and_modals(self):
        """Handle cookies and modal dialogs"""
        if not self.driver:
            return False

        try:
            time.sleep(2)

            # Common selectors for cookie banners and modals
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
                            self.logger.debug(f"Dismissed modal/cookie: {selector}")
                            time.sleep(1)
                            break
                except:
                    continue

            # JavaScript-based cleanup
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
            self.logger.warning(f"Cookie/modal handling failed: {e}")
            return False

    def wait_for_content_load(self, timeout=20):
        """Wait for content to load with various strategies"""
        if not self.driver:
            return False

        try:
            wait = WebDriverWait(self.driver, timeout)

            # Common content indicators
            content_indicators = [
                (".event__match", "Match events"),
                ("[class*='incident']", "Match incidents"),
                (".tableCellParticipant__name", "Team names"),
                ("[class*='fixture']", "Fixtures"),
                (".detailScore__wrapper", "Match scores"),
                ("[class*='match']", "Match containers"),
                ("[class*='event']", "Event containers")
            ]

            for selector, description in content_indicators:
                try:
                    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                    self.logger.debug(f"Content loaded: {description}")
                    return True
                except TimeoutException:
                    continue

            # If no specific content found, wait for general page load
            wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            time.sleep(3)  # Additional wait for dynamic content
            return True

        except Exception as e:
            self.logger.warning(f"Content load wait failed: {e}")
            return False

    def get_page_selenium(self, url: str, wait_for_content: bool = True) -> Optional[BeautifulSoup]:
        """
        Get page content using Selenium

        Args:
            url: URL to fetch
            wait_for_content: Whether to wait for dynamic content to load

        Returns:
            BeautifulSoup object or None
        """
        if not self.driver:
            self.logger.error("Selenium driver not available")
            return None

        try:
            self.logger.info(f"Fetching with Selenium: {url}")
            self.driver.get(url)

            # Handle cookies and modals
            self.handle_cookies_and_modals()

            # Wait for content if requested
            if wait_for_content:
                self.wait_for_content_load()

            # Get page source and parse
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')

            self.logger.debug(f"Page content length: {len(page_source)}")
            return soup

        except Exception as e:
            self.logger.error(f"Selenium page fetch failed for {url}: {e}")
            return None

    def get_page(self, url: str, params: Optional[Dict] = None,
                 timeout: int = 30, force_selenium: bool = False) -> Optional[BeautifulSoup]:
        """
        Get page content using requests or Selenium

        Args:
            url: URL to fetch
            params: Query parameters
            timeout: Request timeout
            force_selenium: Force use of Selenium even if use_selenium is False

        Returns:
            BeautifulSoup object or None
        """
        # Use Selenium if available and requested
        if (self.use_selenium or force_selenium) and self.driver:
            return self.get_page_selenium(url)

        # Fall back to parent method (requests)
        return super().get_page(url, params, timeout)

    def close(self):
        """Clean up resources"""
        if self.driver:
            try:
                self.driver.quit()
                self.logger.info("Selenium driver closed")
            except Exception as e:
                self.logger.warning(f"Error closing Selenium driver: {e}")

    def __del__(self):
        """Destructor to ensure driver cleanup"""
        self.close()

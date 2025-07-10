#!/usr/bin/env python3
"""
Eredmenyek.com scraper
=====================

Eredmenyek.com specifikus scraper magyar nyelvű adatokhoz.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, date, timedelta
from bs4 import BeautifulSoup
import re
import json

from .base_scraper import BaseScraper


class EredmenyekScraper(BaseScraper):
    """Scraper for Eredmenyek.com data."""

    def __init__(self):
        """Initialize Eredmenyek.com scraper."""
        super().__init__(
            source_name="eredmenyek",
            base_url="https://www.eredmenyek.com",
            delay_range=(1, 2)  # Shorter delay for this site
        )

        # Eredmenyek specific headers
        self.session.headers.update({
            'Accept-Language': 'hu-HU,hu;q=0.9,en;q=0.8',
            'Referer': 'https://www.eredmenyek.com/'
        })

    def get_daily_matches(self, target_date: date) -> List[Dict[str, Any]]:
        """
        Get list of matches for a specific date from Eredmenyek.com.

        Args:
            target_date: Date to get matches for

        Returns:
            List of match dictionaries
        """
        matches = []

        try:
            # Format date for Eredmenyek URL (YYYY-MM-DD format)
            date_str = target_date.strftime("%Y-%m-%d")
            url = f"{self.base_url}/labdarugas/merkozes/{date_str}/"

            soup = self.get_page(url)
            if not soup:
                self.logger.error(f"Could not fetch Eredmenyek page for {date_str}")
                return matches

            # Find match containers - Eredmenyek uses different structure
            match_sections = soup.find_all("div", class_=re.compile(r"match-row|game-row"))

            if not match_sections:
                # Try alternative selectors
                match_sections = soup.find_all("tr", class_=re.compile(r"match|game"))

            for match_elem in match_sections:
                match_data = self._parse_match_element(match_elem, target_date)
                if match_data:
                    matches.append(match_data)

            self.logger.info(f"Found {len(matches)} matches on Eredmenyek for {date_str}")

        except Exception as e:
            self.logger.error(f"Error getting daily matches from Eredmenyek: {e}")

        return matches

    def _parse_match_element(self, match_elem: Any, target_date: date) -> Optional[Dict[str, Any]]:
        """
        Parse individual match element from Eredmenyek.

        Args:
            match_elem: BeautifulSoup element containing match data
            target_date: Date of the match

        Returns:
            Match dictionary or None if parsing fails
        """
        try:
            # Extract team names - Eredmenyek has specific structure
            home_team = ""
            away_team = ""

            # Try different selectors for team names
            team_cells = match_elem.find_all("td", class_=re.compile(r"team|participant"))
            if len(team_cells) >= 2:
                home_team = self._safe_extract_text(team_cells[0])
                away_team = self._safe_extract_text(team_cells[1])
            else:
                # Alternative structure
                team_elements = match_elem.find_all("span", class_=re.compile(r"team|home|away"))
                if len(team_elements) >= 2:
                    home_team = self._safe_extract_text(team_elements[0])
                    away_team = self._safe_extract_text(team_elements[1])

            if not home_team or not away_team:
                return None

            # Extract match time
            time_elem = match_elem.find("td", class_=re.compile(r"time|hour"))
            if not time_elem:
                time_elem = match_elem.find("span", class_=re.compile(r"time|hour"))

            match_time = self._safe_extract_text(time_elem) if time_elem else "TBD"

            # Extract league/competition
            league = "Hungarian League"  # Default for this site
            league_elem = match_elem.find_parent("div", class_=re.compile(r"league|competition"))
            if league_elem:
                league_name_elem = league_elem.find("h3") or league_elem.find("h2")
                if league_name_elem:
                    league = self._safe_extract_text(league_name_elem)

            # Extract match URL
            match_url = ""
            match_link = match_elem.find("a")
            if match_link:
                href = self._safe_extract_attribute(match_link, "href")
                if href and not href.startswith("http"):
                    match_url = self.base_url + href
                elif href:
                    match_url = href

            # Extract current score if available
            score = ""
            score_elem = match_elem.find("td", class_=re.compile(r"score|result"))
            if not score_elem:
                score_elem = match_elem.find("span", class_=re.compile(r"score|result"))

            if score_elem:
                score = self._safe_extract_text(score_elem)

            # Extract match status
            status = "scheduled"
            status_elem = match_elem.find("td", class_=re.compile(r"status|state"))
            if status_elem:
                status_text = self._safe_extract_text(status_elem)
                status = self._normalize_status(status_text)

            # Create match dictionary
            match_data = self._create_match_dict(
                home_team=home_team,
                away_team=away_team,
                league=league,
                match_time=match_time,
                match_url=match_url,
                score=score,
                status=status,
                date=target_date.isoformat()
            )

            return match_data

        except Exception as e:
            self.logger.error(f"Error parsing Eredmenyek match element: {e}")
            return None

    def get_match_details(self, match_url: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information for a specific match from Eredmenyek.

        Args:
            match_url: URL of the match page

        Returns:
            Detailed match dictionary or None if error
        """
        try:
            soup = self.get_page(match_url)
            if not soup:
                return None

            # Extract basic match info
            match_details = self._extract_basic_match_info(soup)

            # Extract odds if available (limited on this site)
            odds_data = self._extract_odds(soup)
            if odds_data:
                match_details["odds"] = odds_data

            # Extract statistics if available
            stats_data = self._extract_statistics(soup)
            if stats_data:
                match_details["statistics"] = stats_data

            match_details["source"] = self.source_name
            match_details["match_url"] = match_url

            return match_details

        except Exception as e:
            self.logger.error(f"Error getting match details from Eredmenyek: {e}")
            return None

    def _extract_basic_match_info(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract basic match information from match page."""
        info = {}

        # Extract teams
        home_team_elem = soup.find("span", class_=re.compile(r"home.*team"))
        away_team_elem = soup.find("span", class_=re.compile(r"away.*team"))

        if home_team_elem:
            info["home_team"] = self._safe_extract_text(home_team_elem)

        if away_team_elem:
            info["away_team"] = self._safe_extract_text(away_team_elem)

        # Extract score
        score_elem = soup.find("div", class_=re.compile(r"score|result"))
        if score_elem:
            score_text = self._safe_extract_text(score_elem)
            if ":" in score_text or "-" in score_text:
                info["score"] = score_text

        # Extract match time and date
        time_elem = soup.find("span", class_=re.compile(r"time|date"))
        if time_elem:
            info["match_time"] = self._safe_extract_text(time_elem)

        # Extract venue
        venue_elem = soup.find("span", class_=re.compile(r"venue|stadium"))
        if venue_elem:
            info["venue"] = self._safe_extract_text(venue_elem)

        # Extract league
        league_elem = soup.find("h1") or soup.find("h2")
        if league_elem:
            league_text = self._safe_extract_text(league_elem)
            if any(word in league_text.lower() for word in ["liga", "kupa", "bajnokság"]):
                info["league"] = league_text

        return info

    def _extract_odds(self, soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
        """Extract betting odds from match page (limited on this site)."""
        try:
            # Eredmenyek.com has limited odds information
            odds_section = soup.find("div", class_=re.compile(r"odds|betting"))
            if not odds_section:
                return None

            odds_data = {}

            # Look for basic 1X2 odds
            odds_elements = odds_section.find_all("span", class_=re.compile(r"odd"))

            if len(odds_elements) >= 3:
                odds_data["home"] = self._safe_extract_text(odds_elements[0])
                odds_data["draw"] = self._safe_extract_text(odds_elements[1])
                odds_data["away"] = self._safe_extract_text(odds_elements[2])

            return odds_data if odds_data else None

        except Exception as e:
            self.logger.error(f"Error extracting odds: {e}")
            return None

    def _extract_statistics(self, soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
        """Extract match statistics from match page."""
        try:
            stats_section = soup.find("div", class_=re.compile(r"statistics|stats"))
            if not stats_section:
                return None

            stats_data = {}

            # Look for possession data
            possession_row = stats_section.find("tr", string=re.compile(r"Labdabirtoklás|Possession"))
            if possession_row:
                possession_cells = possession_row.find_next_sibling("tr").find_all("td")
                if len(possession_cells) >= 2:
                    stats_data["possession_home"] = self._safe_extract_text(possession_cells[0]).replace("%", "")
                    stats_data["possession_away"] = self._safe_extract_text(possession_cells[1]).replace("%", "")

            # Look for shots data
            shots_row = stats_section.find("tr", string=re.compile(r"Lövések|Shots"))
            if shots_row:
                shots_cells = shots_row.find_next_sibling("tr").find_all("td")
                if len(shots_cells) >= 2:
                    stats_data["shots_home"] = self._safe_extract_text(shots_cells[0])
                    stats_data["shots_away"] = self._safe_extract_text(shots_cells[1])

            return stats_data if stats_data else None

        except Exception as e:
            self.logger.error(f"Error extracting statistics: {e}")
            return None

    def _normalize_status(self, status_text: str) -> str:
        """Normalize match status text (Hungarian)."""
        status_text = status_text.lower().strip()

        status_map = {
            "nem kezdődött": "scheduled",
            "előre": "scheduled",
            "élő": "live",
            "félidő": "halftime",
            "szünet": "halftime",
            "vége": "finished",
            "befejezett": "finished",
            "elhalasztva": "postponed",
            "lemondva": "cancelled"
        }

        for key, value in status_map.items():
            if key in status_text:
                return value

        return "unknown"

    def get_leagues(self) -> List[str]:
        """
        Get list of available Hungarian leagues.

        Returns:
            List of league names
        """
        return [
            "NB I",
            "NB II",
            "NB III",
            "Magyar Kupa",
            "UEFA Europa League",
            "UEFA Champions League"
        ]

def main():
    """Eredmények.com scraper teszt"""
    print("🇭🇺 Eredmények.com scraper teszt...")

    # TODO: Implementálás
    pass

if __name__ == "__main__":
    main()

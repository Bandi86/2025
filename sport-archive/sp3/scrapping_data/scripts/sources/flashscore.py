#!/usr/bin/env python3
"""
FlashScore scraper
=================

FlashScore específikus scraper a bolíviai meccsekhez.
Felhasználja a korábbi fejlesztéseket az _old mappából.
"""

from typing import Dict, List, Any, Optional, Union
from datetime import datetime, date, timedelta
from bs4 import BeautifulSoup, Tag
import re
import json
import time

from .enhanced_base_scraper import EnhancedBaseScraper

class FlashScoreScraper(EnhancedBaseScraper):
    """
    Enhanced FlashScore scraper with Selenium support
    """

    def __init__(self, headless: bool = True, use_selenium: bool = True, target_teams: Optional[List[str]] = None):
        self.base_url = "https://www.flashscore.com"
        super().__init__("flashscore", self.base_url, use_selenium=use_selenium, headless=headless)

        # Team list can be configured or loaded from external source
        self.target_teams = target_teams or []  # Teams to filter for

        # FlashScore specific headers
        self.session.headers.update({
            'Referer': 'https://www.flashscore.com/',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

    def get_daily_matches(self, target_date: Union[str, date], league_url: Optional[str] = None) -> List[Dict]:
        """
        Get daily matches from FlashScore using Selenium for dynamic content

        Args:
            target_date: Date (str in YYYY-MM-DD format or date object)
            league_url: Optional specific league URL to scrape

        Returns:
            List[Dict]: List of matches with league/competition grouping
        """
        matches = []
        current_league = "Unknown League"
        current_region = "Unknown Region"

        try:
            # Convert to date object if string, or use as-is if already date
            if isinstance(target_date, str):
                date_obj = datetime.strptime(target_date, "%Y-%m-%d").date()
            else:
                date_obj = target_date

            # Default URLs to try if no specific league URL provided
            if league_url:
                urls_to_try = [league_url]
            else:
                urls_to_try = [
                    f"{self.base_url}/football/",  # General football page
                    f"{self.base_url}/",           # Main page
                ]

            for url in urls_to_try:
                self.logger.info(f"Trying FlashScore URL with Selenium: {url}")

                # Use Selenium to get dynamic content
                soup = self.get_page(url, force_selenium=True)
                if soup:
                    self.logger.info(f"Page content length: {len(str(soup))}")

                    # Debug: check if target teams are mentioned in content if we have them
                    if self.target_teams:
                        content_text = soup.get_text().lower()
                        found_teams = [team for team in self.target_teams if team.lower() in content_text]
                        if found_teams:
                            self.logger.info(f"Found target teams in content: {found_teams}")
                        else:
                            self.logger.warning("No target teams found in page content")

                    # Enhanced strategy: Process all events to identify leagues and matches
                    # First pass: Process all events to identify leagues and collect match data
                    all_events = soup.find_all("div", class_=re.compile(r"event"))  # Remove ^$ to match more
                    self.logger.info(f"Found {len(all_events)} event containers")

                    for event in all_events:
                        event_text = self._safe_extract_text(event)

                        # Check if this is a league/competition header
                        if self._is_league_header(event_text):
                            current_league, current_region = self._parse_league_header(event_text)
                            self.logger.debug(f"Found league: {current_region} - {current_league}")
                            continue

                        # Check if this is a complete match container (prioritize this)
                        event_classes = event.get("class", []) if hasattr(event, 'get') else []
                        if any("event__match" in str(cls) for cls in event_classes):
                            match_data = self._parse_complete_match_container(event, date_obj)
                            if match_data:
                                # Fix team names first
                                match_data = self._fix_team_names(match_data)

                                # Add league/region information
                                match_data['league'] = current_league
                                match_data['region'] = current_region

                                # Try to detect correct region from team names
                                detected_region = self._detect_region_from_teams(match_data)
                                if detected_region:
                                    self.logger.debug(f"Override region from {current_region} to {detected_region} for {match_data.get('home_team')} vs {match_data.get('away_team')}")
                                    match_data['region'] = detected_region

                                # Try to detect correct league from team names and region
                                detected_league = self._detect_league_from_teams(match_data)
                                if detected_league:
                                    self.logger.debug(f"Override league from {current_league} to {detected_league} for {match_data.get('home_team')} vs {match_data.get('away_team')}")
                                    match_data['league'] = detected_league

                                self.logger.debug(f"Parsed complete match: {match_data.get('home_team')} vs {match_data.get('away_team')} - {match_data.get('status')}")

                                # If we have target teams, filter for them, otherwise keep all matches
                                if not self.target_teams or self._is_target_match(match_data):
                                    self.logger.info(f"Added match: {match_data}")
                                    matches.append(match_data)
                                continue

                        # Fallback: Check if this is a match using the old method
                        match_data = self._parse_match_element(event, date_obj)
                        if match_data:
                            # Fix team names first
                            match_data = self._fix_team_names(match_data)

                            # Add league/region information
                            match_data['league'] = current_league
                            match_data['region'] = current_region

                            # Try to detect correct region from team names
                            detected_region = self._detect_region_from_teams(match_data)
                            if detected_region:
                                self.logger.debug(f"Override region from {current_region} to {detected_region} for {match_data.get('home_team')} vs {match_data.get('away_team')}")
                                match_data['region'] = detected_region

                            # Try to detect correct league from team names and region
                            detected_league = self._detect_league_from_teams(match_data)
                            if detected_league:
                                self.logger.debug(f"Override league from {current_league} to {detected_league} for {match_data.get('home_team')} vs {match_data.get('away_team')}")
                                match_data['league'] = detected_league

                            self.logger.debug(f"Parsed match: {match_data.get('home_team')} vs {match_data.get('away_team')} in {match_data.get('region')} - {current_league}")

                            # If we have target teams, filter for them, otherwise keep all matches
                            if not self.target_teams or self._is_target_match(match_data):
                                self.logger.info(f"Added match: {match_data}")
                                matches.append(match_data)

                    # Fallback: Look for match containers if we didn't find many matches
                    if len(matches) < 50:  # If we found fewer than expected
                        self.logger.info("Trying fallback match detection...")

                        match_elements = []
                        # Strategy 1: Standard FlashScore match containers
                        match_elements.extend(soup.find_all("div", class_=re.compile(r"event__match")))

                        # Strategy 2: Look for match containers with data attributes
                        match_elements.extend(soup.find_all("div", {"data-testid": re.compile(r"match")}))

                        # Strategy 3: Look for elements with match URLs
                        match_links = soup.find_all("a", href=re.compile(r"/match/"))
                        for link in match_links:
                            parent = link.find_parent("div")
                            if parent and parent not in match_elements:
                                match_elements.append(parent)

                        self.logger.info(f"Found {len(match_elements)} additional match elements")

                        # Parse additional match elements
                        for match_elem in match_elements:
                            match_data = self._parse_match_element(match_elem, date_obj)
                            if match_data:
                                # Add default league info if not already set
                                if 'league' not in match_data:
                                    match_data['league'] = current_league
                                if 'region' not in match_data:
                                    match_data['region'] = current_region

                                # Check if we already have this match (avoid duplicates)
                                is_duplicate = any(
                                    existing['home_team'] == match_data.get('home_team') and
                                    existing['away_team'] == match_data.get('away_team')
                                    for existing in matches
                                )

                                if not is_duplicate:
                                    if not self.target_teams or self._is_target_match(match_data):
                                        matches.append(match_data)

                    if matches:
                        break  # Stop trying URLs if we found matches

            self.logger.info(f"Found {len(matches)} matches on FlashScore for {date_obj}")

        except Exception as e:
            self.logger.error(f"Error getting daily matches from FlashScore: {e}")

        return matches

    def _is_league_header(self, text: str) -> bool:
        """Check if text represents a league/competition header"""
        if not text:
            return False

        # Common patterns for league headers
        league_indicators = [
            "EUROPE:", "WORLD:", "AFRICA:", "ASIA:", "AMERICA:",
            "League", "Cup", "Championship", "Qualification", "Tournament",
            "Premier", "Serie", "Bundesliga", "Ligue", "Liga"
        ]

        return any(indicator in text for indicator in league_indicators)

    def _parse_league_header(self, text: str) -> tuple:
        """Parse league header to extract region and league name"""
        if ":" in text:
            parts = text.split(":", 1)
            region = parts[0].strip()
            league = parts[1].strip() if len(parts) > 1 else "Unknown League"
        else:
            region = "Unknown Region"
            league = text.strip()

        return league, region

    def _is_target_match(self, match_data: Dict) -> bool:
        """Check if match involves target teams."""
        if not self.target_teams:
            return True  # If no target teams specified, return all matches

        home_team = match_data.get('home_team', '').lower()
        away_team = match_data.get('away_team', '').lower()

        for team in self.target_teams:
            if team.lower() in home_team or team.lower() in away_team:
                return True
        return False

    def _detect_match_status(self, match_elem, raw_text: str) -> tuple:
        """
        Detect match status and score from match element.

        Returns:
            tuple: (status, score)
        """
        try:
            raw_lower = raw_text.lower()

            # Check for finished indicators first (most specific)
            if any(indicator in raw_lower for indicator in ['ft', 'finished', 'final', 'ended']):
                # Look for score patterns like "2-1", "0-0", etc. in the full text
                score_pattern = re.search(r'(\d+)\s*[-]\s*(\d+)', raw_text)
                if score_pattern:
                    score = f"{score_pattern.group(1)}-{score_pattern.group(2)}"
                    return "finished", score

                # Look for specific score patterns in concatenated text (for finished matches)
                # Pattern: "TeamATeamB12" or similar (two single digits at the end)
                score_at_end = re.search(r'[A-Za-z\s)]+(\d{1})(\d{1})$', raw_text)
                if score_at_end:
                    score = f"{score_at_end.group(1)}-{score_at_end.group(2)}"
                    return "finished", score

                # Pattern: "TeamATeamB123" (three digits could be 1-2-3 -> 1-23 or 12-3, prefer single digits)
                score_triple = re.search(r'[A-Za-z\s)]+(\d{1})(\d{1})(\d{1})$', raw_text)
                if score_triple:
                    # Try to interpret as two single digits (most common case)
                    score = f"{score_triple.group(1)}-{score_triple.group(2)}"
                    return "finished", score

                return "finished", ""

            # Check for live indicators
            if any(indicator in raw_lower for indicator in ['live', 'half', 'ht']) or re.search(r"\d+'\s", raw_text):
                return "live", ""

            # Check for postponed/cancelled
            if any(indicator in raw_lower for indicator in ['postponed', 'cancelled', 'canceled', 'interrupted']):
                return "postponed", ""

            # Look for time patterns (future matches) - only if no other indicators found
            if re.search(r'\d{1,2}:\d{2}', raw_text) and 'finished' not in raw_lower:
                return "scheduled", ""

            # Default
            return "scheduled", ""

        except Exception as e:
            self.logger.debug(f"Error detecting match status: {e}")
            return "scheduled", ""

    def _parse_match_element(self, match_elem, target_date: date) -> Optional[Dict]:
        """
        Enhanced parsing for FlashScore match elements

        Args:
            match_elem: BeautifulSoup element for the match
            target_date: Target date

        Returns:
            Match dictionary or None if parsing fails
        """
        try:
            # Get the raw text to analyze patterns
            raw_text = match_elem.get_text(strip=True)

            if not raw_text:
                return None

            # Look for general team names patterns and times
            # Strategy: Look for team names from target teams if available
            if self.target_teams:
                teams_found = []
                raw_text_lower = raw_text.lower()

                for team in self.target_teams:
                    if team.lower() in raw_text_lower:
                        teams_found.append(team)

                # If we found exactly 2 teams, we can create a match
                if len(teams_found) == 2:
                    time_match = re.search(r'\d{1,2}:\d{2}', raw_text)
                    match_time = time_match.group() if time_match else ''

                    # Detect status and score
                    status, score = self._detect_match_status(match_elem, raw_text)

                    return {
                        'home_team': teams_found[0],
                        'away_team': teams_found[1],
                        'match_time': match_time,
                        'league': 'Football League',  # Default
                        'match_url': self._extract_match_url(match_elem),
                        'score': score,
                        'status': status,
                        'source': 'flashscore',
                        'scraped_at': datetime.now().isoformat(),
                        'match_date': target_date.isoformat()
                    }

            # If no target teams or couldn't match, try general parsing
            # Look for time patterns and team containers
            time_match = re.search(r'\d{1,2}:\d{2}', raw_text)
            if time_match:
                # Try to find team names in participant containers
                team_containers = match_elem.find_all(["span", "div"], class_=re.compile(r"participant|team"))
                if len(team_containers) >= 2:
                    home_team = self._safe_extract_text(team_containers[0])
                    away_team = self._safe_extract_text(team_containers[1])

                    if home_team and away_team:
                        # Detect status and score
                        status, score = self._detect_match_status(match_elem, raw_text)

                        return {
                            'home_team': home_team,
                            'away_team': away_team,
                            'match_time': time_match.group(),
                            'league': 'Football League',
                            'match_url': self._extract_match_url(match_elem),
                            'score': score,
                            'status': status,
                            'source': 'flashscore',
                            'scraped_at': datetime.now().isoformat(),
                            'match_date': target_date.isoformat()
                        }

            return None

        except Exception as e:
            self.logger.debug(f"Error parsing match element: {e}")
            return None

    def _split_team_names(self, teams_str: str) -> tuple:
        """
        Split concatenated team names using known team list

        Args:
            teams_str: Concatenated team names string

        Returns:
            Tuple of (home_team, away_team) or (None, None)
        """
        teams_str = teams_str.strip()

        # If we have target teams, try to match against them
        if self.target_teams:
            # Try to match against known team names
            for i, team in enumerate(self.target_teams):
                if teams_str.startswith(team):
                    home_team = team
                    remaining = teams_str[len(team):].strip()

                    # Check if remaining text matches another team
                    for j, away_candidate in enumerate(self.target_teams):
                        if i != j and remaining == away_candidate:
                            return home_team, away_candidate
                        elif i != j and remaining.startswith(away_candidate):
                            return home_team, away_candidate

            # If direct matching fails, try partial matching
            teams_str_lower = teams_str.lower()
            found_teams = []

            for team in self.target_teams:
                if team.lower() in teams_str_lower:
                    found_teams.append(team)

            if len(found_teams) >= 2:
                # Find positions and order them
                team_positions = []
                for team in found_teams:
                    pos = teams_str_lower.find(team.lower())
                    if pos >= 0:
                        team_positions.append((pos, team))

                team_positions.sort()  # Sort by position
                if len(team_positions) >= 2:
                    return team_positions[0][1], team_positions[1][1]

        return None, None

    def _extract_match_url(self, match_elem) -> str:
        """Extract match URL from element"""
        try:
            match_link = match_elem.find("a")
            if match_link:
                href = self._safe_extract_attribute(match_link, "href")
                if href:
                    return self.base_url + href if not href.startswith('http') else href
        except:
            pass
        return ""

    def get_match_details(self, match_url: str, base_match_data: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Részletes meccs információk lekérése

        Args:
            match_url: A meccs URL-je
            base_match_data: Optional base match data from list parsing (contains match_time, etc.)

        Returns:
            Részletes meccs adatok vagy None
        """
        if not match_url:
            return None

        try:
            # Use Selenium to fetch the page content
            self.logger.info(f"Fetching match details with Selenium: {match_url}")
            soup = self.get_page(match_url, force_selenium=True, timeout=20)  # Increased timeout

            if not soup:
                self.logger.warning(f"Failed to fetch page content for {match_url}")
                # If we have base match data, return it as fallback with time format fix
                if base_match_data:
                    self.logger.info("Using base match data as fallback")
                    fallback_data = base_match_data.copy()
                    # Fix the time format for validation
                    if fallback_data.get('match_time'):
                        base_time = fallback_data['match_time']
                        time_match = re.search(r'(\d{1,2}:\d{2})(?:\s*$)', base_time)
                        if time_match:
                            fallback_data['match_time'] = time_match.group(1)
                        else:
                            time_match = re.search(r'(\d{1,2}:\d{2})', base_time)
                            if time_match:
                                fallback_data['match_time'] = time_match.group(1)
                        self.logger.debug(f"Fixed time format: {base_time} -> {fallback_data['match_time']}")
                    return fallback_data
                return None

            details = {}

            # Extract basic match info
            self._extract_basic_info(soup, details)

            # If we have base match data, use it to fill in missing fields
            if base_match_data:
                # Start with base match data and only override with scraped details
                base_fields_to_preserve = ['region', 'league', 'match_date', 'status']
                for field in base_fields_to_preserve:
                    if base_match_data.get(field):
                        details[field] = base_match_data[field]

                # Use base match data for any missing critical fields
                if not details.get('match_time') and base_match_data.get('match_time'):
                    base_time = base_match_data['match_time']
                    # Extract just the time part if it includes date (like "07.07. 21:00" -> "21:00")
                    time_match = re.search(r'(\d{1,2}:\d{2})(?:\s*$)', base_time)
                    if time_match:
                        details['match_time'] = time_match.group(1)
                    else:
                        # Try to extract time from other patterns
                        time_match = re.search(r'(\d{1,2}:\d{2})', base_time)
                        if time_match:
                            details['match_time'] = time_match.group(1)
                        else:
                            details['match_time'] = base_time
                    self.logger.debug(f"Using match_time from base data: {base_time} -> {details['match_time']}")

                if not details.get('home_team') and base_match_data.get('home_team'):
                    details['home_team'] = base_match_data['home_team']

                if not details.get('away_team') and base_match_data.get('away_team'):
                    details['away_team'] = base_match_data['away_team']

                if not details.get('score') and base_match_data.get('score'):
                    details['score'] = base_match_data['score']

            # Always ensure match_time is in the correct format (HH:MM only) for validation
            if details.get('match_time'):
                current_time = details['match_time']
                # Extract just the time part if it includes date or extra characters
                time_match = re.search(r'(\d{1,2}:\d{2})(?:\s*$)', current_time)
                if time_match:
                    fixed_time = time_match.group(1)
                    if fixed_time != current_time:
                        details['match_time'] = fixed_time
                        self.logger.debug(f"Fixed time format: {current_time} -> {fixed_time}")
                else:
                    # Try to extract time from other patterns
                    time_match = re.search(r'(\d{1,2}:\d{2})', current_time)
                    if time_match:
                        fixed_time = time_match.group(1)
                        details['match_time'] = fixed_time
                        self.logger.debug(f"Extracted time from pattern: {current_time} -> {fixed_time}")

            # Extract betting odds if available
            self._extract_betting_odds(soup, details)

            # Extract match statistics
            self._extract_match_stats(soup, details)

            # Extract events (goals, cards, etc.)
            self._extract_match_events(soup, details)

            details['scraped_at'] = datetime.now().isoformat()
            details['source'] = 'flashscore'

            return details

        except Exception as e:
            self.logger.error(f"Error getting FlashScore match details from {match_url}: {e}")
            return None

    def _extract_basic_info(self, soup: BeautifulSoup, info: Dict[str, Any]):
        """Extract basic match information."""
        try:
            # Extract team names - try both list page and detail page selectors
            home_team_elem = None
            away_team_elem = None

            # Try detail page selectors first
            home_container = soup.select_one(".duelParticipant__home")
            if home_container:
                home_team_elem = home_container.select_one(".participant__participantName")

            away_container = soup.select_one(".duelParticipant__away")
            if away_container:
                away_team_elem = away_container.select_one(".participant__participantName")

            # Fallback to list page selectors if detail page selectors don't work
            if not home_team_elem:
                home_container = soup.find("div", class_=re.compile(r"participant__participant--home"))
                if home_container:
                    home_team_elem = home_container.find("div", class_="participant__participantName")

            if not away_team_elem:
                away_container = soup.find("div", class_=re.compile(r"participant__participant--away"))
                if away_container:
                    away_team_elem = away_container.find("div", class_="participant__participantName")

            # Extract team names
            if home_team_elem:
                info["home_team"] = self._safe_extract_text(home_team_elem)
                self.logger.debug(f"Found home team: {info['home_team']}")

            if away_team_elem:
                info["away_team"] = self._safe_extract_text(away_team_elem)
                self.logger.debug(f"Found away team: {info['away_team']}")

            # Extract score - try multiple selectors
            score_text = ""

            # Try detail page score selectors
            score_elements = soup.find_all("div", class_=re.compile(r"detailScore"))
            for elem in score_elements:
                text = self._safe_extract_text(elem)
                # Look for pattern like "2-2" in the text
                score_match = re.search(r'(\d+)-(\d+)', text)
                if score_match:
                    score_text = score_match.group(0)
                    break

            # Fallback to other score selectors if needed
            if not score_text:
                score_elem = soup.find("div", class_=re.compile(r"detailScore"))
                if score_elem:
                    home_score_elem = score_elem.find("span", class_="detailScore__home")
                    away_score_elem = score_elem.find("span", class_="detailScore__away")

                    home_score = self._safe_extract_text(home_score_elem) if home_score_elem else ""
                    away_score = self._safe_extract_text(away_score_elem) if away_score_elem else ""

                    if home_score and away_score:
                        score_text = f"{home_score}-{away_score}"

            if score_text:
                info["score"] = score_text
                self.logger.debug(f"Found score: {score_text}")

            # Add basic match metadata
            if "home_team" in info and "away_team" in info:
                # Try to extract match time from detail page
                match_time = self._extract_match_time_from_detail(soup)
                # Ensure the time is in HH:MM format only
                if match_time:
                    time_match = re.search(r'(\d{1,2}:\d{2})', match_time)
                    if time_match:
                        info["match_time"] = time_match.group(1)
                    else:
                        info["match_time"] = match_time
                else:
                    info["match_time"] = ""

                info["league"] = "Football League"  # Default for FlashScore
                info["status"] = "finished" if score_text else "scheduled"

        except Exception as e:
            self.logger.error(f"Error extracting basic info: {e}")

    def _extract_betting_odds(self, soup: BeautifulSoup, details: Dict[str, Any]):
        """Extract betting odds information."""
        try:
            # Try multiple selectors for odds section
            odds_section = None
            odds_selectors = [
                "div[class*='odds']",
                "[data-testid*='odds']",
                ".odds",
                "[class*='bookmaker']",
                ".ui-table"
            ]

            for selector in odds_selectors:
                try:
                    odds_section = soup.select_one(selector)
                    if odds_section:
                        self.logger.debug(f"Found odds section with selector: {selector}")
                        break
                except Exception:
                    continue

            if not odds_section:
                self.logger.debug("No odds section found")
                return

            odds_data = {}

            # Try multiple row selectors
            row_selectors = [
                "div[class*='ui-table__row']",
                "tr",
                "[class*='row']",
                "div[class*='bookmaker']"
            ]

            odds_rows = []
            for selector in row_selectors:
                try:
                    rows = odds_section.select(selector)
                    if rows:
                        odds_rows = rows
                        self.logger.debug(f"Found {len(rows)} odds rows with selector: {selector}")
                        break
                except Exception:
                    continue

            for row in odds_rows:
                # Try to extract cells
                cell_selectors = [
                    "div[class*='ui-table__cell']",
                    "td",
                    "span",
                    "[class*='cell']"
                ]

                cells = []
                for selector in cell_selectors:
                    try:
                        cells = row.select(selector)
                        if len(cells) >= 3:  # Need at least 3 for odds
                            break
                    except Exception:
                        continue

                if len(cells) >= 4:  # Bookmaker, Home, Draw, Away
                    bookmaker = self._safe_extract_text(cells[0])
                    home_odds = self._safe_extract_text(cells[1])
                    draw_odds = self._safe_extract_text(cells[2])
                    away_odds = self._safe_extract_text(cells[3])

                    if bookmaker and any([home_odds, draw_odds, away_odds]):
                        odds_data[bookmaker] = {
                            'home': home_odds,
                            'draw': draw_odds,
                            'away': away_odds
                        }
                elif len(cells) >= 3:  # Home, Draw, Away (no bookmaker)
                    home_odds = self._safe_extract_text(cells[0])
                    draw_odds = self._safe_extract_text(cells[1])
                    away_odds = self._safe_extract_text(cells[2])

                    if any([home_odds, draw_odds, away_odds]):
                        odds_data['Unknown'] = {
                            'home': home_odds,
                            'draw': draw_odds,
                            'away': away_odds
                        }

            if odds_data:
                details['betting_odds'] = odds_data
                self.logger.debug(f"Extracted betting odds: {len(odds_data)} bookmakers")

        except Exception as e:
            self.logger.error(f"Error extracting betting odds: {e}")

    def _extract_match_stats(self, soup: BeautifulSoup, details: Dict[str, Any]):
        """Extract match statistics."""
        try:
            # Try multiple selectors for stats section
            stats_section = None
            stats_selectors = [
                "div[class*='stats']",
                "[data-testid*='stat']",
                ".stat",
                "[class*='statistic']",
                "[class*='matchStatistics']"
            ]

            for selector in stats_selectors:
                try:
                    sections = soup.select(selector)
                    if sections:
                        # Use the first section that contains stats-like content
                        for section in sections:
                            text = self._safe_extract_text(section).lower()
                            if any(keyword in text for keyword in ['possession', 'shots', 'corners', 'fouls', '%']):
                                stats_section = section
                                self.logger.debug(f"Found stats section with selector: {selector}")
                                break
                        if stats_section:
                            break
                except Exception:
                    continue

            if not stats_section:
                self.logger.debug("No stats section found")
                return

            stats = {}

            # Look for common statistics patterns
            stat_types = {
                'possession': ['possession', 'ball possession'],
                'shots': ['shots', 'total shots'],
                'shots_on_target': ['shots on target', 'on target'],
                'corners': ['corners', 'corner kicks'],
                'fouls': ['fouls', 'total fouls'],
                'yellow_cards': ['yellow cards', 'yellow'],
                'red_cards': ['red cards', 'red'],
                'passes': ['passes', 'total passes'],
                'pass_accuracy': ['pass accuracy', 'passing %']
            }

            # Try to extract stats using various patterns
            page_text = soup.get_text()

            for stat_name, keywords in stat_types.items():
                for keyword in keywords:
                    # Look for patterns like "Possession 65% - 35%" or "Shots 12 - 8"
                    patterns = [
                        rf'{keyword}\s*(\d+)%?\s*-\s*(\d+)%?',
                        rf'{keyword}:\s*(\d+)%?\s*-\s*(\d+)%?',
                        rf'(\d+)%?\s*-\s*(\d+)%?\s*{keyword}',
                    ]

                    for pattern in patterns:
                        match = re.search(pattern, page_text, re.IGNORECASE)
                        if match:
                            home_value = match.group(1)
                            away_value = match.group(2)
                            stats[stat_name] = {
                                'home': home_value,
                                'away': away_value
                            }
                            self.logger.debug(f"Found {stat_name}: {home_value} - {away_value}")
                            break
                    if stat_name in stats:
                        break

            # Alternative approach: look for structured stat elements
            if not stats:
                stat_elements = soup.select("[class*='stat']")
                for elem in stat_elements:
                    elem_text = self._safe_extract_text(elem)

                    # Look for percentage patterns
                    if '%' in elem_text:
                        # Try to extract home/away values
                        pct_match = re.search(r'(\d+)%.*?(\d+)%', elem_text)
                        if pct_match:
                            stats['possession'] = {
                                'home': pct_match.group(1),
                                'away': pct_match.group(2)
                            }
                            break

                    # Look for number patterns like "12 - 8"
                    num_match = re.search(r'(\d+)\s*-\s*(\d+)', elem_text)
                    if num_match:
                        # Try to determine what type of stat this is
                        if 'shot' in elem_text.lower():
                            stats['shots'] = {
                                'home': num_match.group(1),
                                'away': num_match.group(2)
                            }
                        elif 'corner' in elem_text.lower():
                            stats['corners'] = {
                                'home': num_match.group(1),
                                'away': num_match.group(2)
                            }
                        elif 'foul' in elem_text.lower():
                            stats['fouls'] = {
                                'home': num_match.group(1),
                                'away': num_match.group(2)
                            }

            if stats:
                details['statistics'] = stats
                self.logger.debug(f"Extracted match statistics: {list(stats.keys())}")

        except Exception as e:
            self.logger.error(f"Error extracting match stats: {e}")

            # Extract possession
            possession_elem = stats_section.find("div", class_=re.compile(r"stat.*possession"))
            if possession_elem:
                home_poss_elem = possession_elem.find("div", class_="stat__homeValue")
                away_poss_elem = possession_elem.find("div", class_="stat__awayValue")

                home_poss = self._safe_extract_text(home_poss_elem) if home_poss_elem else ""
                away_poss = self._safe_extract_text(away_poss_elem) if away_poss_elem else ""

                stats['possession'] = {
                    'home': home_poss,
                    'away': away_poss
                }

            # Extract shots
            shots_elem = stats_section.find("div", class_=re.compile(r"stat.*shots"))
            if shots_elem:
                home_shots_elem = shots_elem.find("div", class_="stat__homeValue")
                away_shots_elem = shots_elem.find("div", class_="stat__awayValue")

                home_shots = self._safe_extract_text(home_shots_elem) if home_shots_elem else ""
                away_shots = self._safe_extract_text(away_shots_elem) if away_shots_elem else ""

                stats['shots'] = {
                    'home': home_shots,
                    'away': away_shots
                }

            if stats:
                details['statistics'] = stats

        except Exception as e:
            self.logger.error(f"Error extracting match stats: {e}")

    def _extract_match_events(self, soup: BeautifulSoup, details: Dict[str, Any]):
        """Extract match events (goals, cards, etc.)."""
        try:
            events_section = soup.find("div", class_=re.compile(r"events"))
            if not events_section:
                return

            events = []
            event_rows = events_section.find_all("div", class_=re.compile(r"event"))

            for event in event_rows:
                event_time_elem = event.find("div", class_=re.compile(r"eventTime"))
                event_type_elem = event.find("div", class_=re.compile(r"eventType"))
                event_player_elem = event.find("div", class_=re.compile(r"eventPlayer"))

                event_time = self._safe_extract_text(event_time_elem) if event_time_elem else ""
                event_type = self._safe_extract_text(event_type_elem) if event_type_elem else ""
                event_player = self._safe_extract_text(event_player_elem) if event_player_elem else ""

                if event_time and event_type:
                    events.append({
                        'time': event_time,
                        'type': event_type,
                        'player': event_player
                    })

            if events:
                details['events'] = events

        except Exception as e:
            self.logger.error(f"Error extracting match events: {e}")

    def _extract_match_time_from_detail(self, soup: BeautifulSoup) -> str:
        """Extract match time from detail page HTML."""
        try:
            # Try various selectors for time information
            time_selectors = [
                ".duelParticipant__startTime",
                ".startTime",
                ".fixedHeaderDuel__startTime",
                ".duel__time",
                "[data-time]",
                "[class*='time']",
                "[class*='Time']"
            ]

            for selector in time_selectors:
                try:
                    elements = soup.select(selector)
                    for elem in elements:
                        text = self._safe_extract_text(elem)
                        if text and re.search(r'\d{1,2}:\d{2}', text):
                            # Found time pattern, extract just the HH:MM part for validation
                            time_match = re.search(r'(\d{1,2}:\d{2})', text)
                            if time_match:
                                return time_match.group(1)  # Return just "HH:MM"
                except Exception:
                    continue

            # Fallback: look for time patterns in the general page content
            page_text = soup.get_text()
            time_patterns = re.findall(r'(\d{1,2}:\d{2})', page_text)
            if time_patterns:
                return time_patterns[0]  # Return just the first "HH:MM" found

            return ""

        except Exception as e:
            self.logger.debug(f"Error extracting match time from detail page: {e}")
            return ""

    def is_available(self) -> bool:
        """
        Ellenőrzi hogy a FlashScore elérhető-e

        Returns:
            bool: True ha elérhető
        """
        try:
            response = self.session.get(self.base_url, timeout=10)
            return response.status_code == 200
        except Exception:
            return False

    def test_connection(self) -> Dict[str, Any]:
        """
        Teszteli a kapcsolatot FlashScore-ral

        Returns:
            Dict: Teszt eredmények
        """
        result = {
            'source': 'flashscore',
            'base_url': self.base_url,
            'available': False,
            'response_time': None,
            'error': None
        }

        try:
            start_time = time.time()
            response = self.session.get(self.base_url, timeout=10)
            end_time = time.time()

            result['response_time'] = round(end_time - start_time, 2)
            result['available'] = response.status_code == 200

            if not result['available']:
                result['error'] = f"HTTP {response.status_code}"

        except Exception as e:
            result['error'] = str(e)

        return result

    def _parse_complete_match_container(self, match_container, target_date: date) -> Optional[Dict]:
        """
        Parse a complete match container element to extract match information

        Args:
            match_container: BeautifulSoup element containing a complete match
            target_date: Target date

        Returns:
            Match dictionary or None if parsing fails
        """
        try:
            # Get the raw text for the entire match container
            raw_text = match_container.get_text(strip=True)

            if not raw_text:
                return None

            # Extract match URL
            match_url = self._extract_match_url(match_container)

            # Detect status and score from the complete container
            status, score = self._detect_match_status(match_container, raw_text)

            # Try to extract team names from participant containers
            home_team = ""
            away_team = ""
            match_time = ""

            # Look for team participants
            participants = match_container.find_all("div", class_=re.compile(r"participant"))
            if len(participants) >= 2:
                home_team = self._safe_extract_text(participants[0])
                away_team = self._safe_extract_text(participants[1])
            else:
                # Fallback: try to extract team names from the raw text
                # Pattern like "FinishedTeamATeamB12" or "20:00TeamATeamB--"

                # Remove status words first
                clean_text = raw_text
                for status_word in ['Finished', 'Live', 'Scheduled', 'Cancelled', 'Interrupted']:
                    clean_text = clean_text.replace(status_word, '')

                # Remove time patterns
                clean_text = re.sub(r'\d{1,2}:\d{2}', '', clean_text)

                # Remove score patterns
                clean_text = re.sub(r'\d{1,2}\d{1,2}$', '', clean_text)
                clean_text = re.sub(r'--$', '', clean_text)

                # Try to split remaining text into two team names
                # This is a simplified approach - in practice, you'd need more sophisticated parsing
                if len(clean_text) > 10:  # Minimum length for two team names
                    # This is a basic approach - real implementation would need team name lists
                    midpoint = len(clean_text) // 2
                    home_team = clean_text[:midpoint].strip()
                    away_team = clean_text[midpoint:].strip()

            # Extract time if scheduled
            if status == "scheduled":
                time_match = re.search(r'\d{1,2}:\d{2}', raw_text)
                if time_match:
                    match_time = time_match.group()

            # Only return if we have valid team names
            if home_team and away_team and len(home_team) > 1 and len(away_team) > 1:
                return {
                    'home_team': home_team,
                    'away_team': away_team,
                    'match_time': match_time,
                    'league': 'Football League',  # Will be updated by caller
                    'match_url': match_url,
                    'score': score,
                    'status': status,
                    'source': 'flashscore',
                    'scraped_at': datetime.now().isoformat(),
                    'match_date': target_date.isoformat()
                }

            return None

        except Exception as e:
            self.logger.debug(f"Error parsing complete match container: {e}")
            return None

    def _detect_region_from_teams(self, match_data: Dict) -> str:
        """Detect region based on team names to fix misassignments"""
        home_team = match_data.get('home_team', '').lower()
        away_team = match_data.get('away_team', '').lower()

        # Known team patterns by region/country
        team_patterns = {
            'BRAZIL': [
                'batalhao', 'csa', 'bahia', 'fortaleza', 'ferroviario',
                'tocantinopolis', 'sport recife', 'ceara', 'corinthians',
                'flamengo', 'palmeiras', 'santos', 'sao paulo', 'gremio',
                'internacional', 'atletico mg', 'cruzeiro', 'botafogo',
                'vasco', 'fluminense'
            ],
            'BOLIVIA': [
                'bolivar', 'independiente', 'the strongest', 'jorge wilstermann',
                'blooming', 'oriente petrolero', 'real potosi', 'nacional potosi',
                'aurora', 'guabira', 'royal pari', 'palmaflor', 'sa bulo bulo',
                'bulo bulo', 'academia del balompie', 'balompie', 'always ready',
                'club destroyers', 'universitario', 'san jose', 'tomayapo'
            ],
            'CANADA': [
                'montreal', 'forge', 'vancouver whitecaps', 'cf montreal',
                'toronto fc', 'valour', 'cavalry', 'pacific fc', 'hamilton',
                'york united', 'atletico ottawa', 'edmonton'
            ],
            'USA': [
                'atlanta united', 'new york city', 'la galaxy', 'seattle sounders',
                'portland timbers', 'sporting kc', 'columbus crew', 'chicago fire',
                'toronto fc', 'real salt lake', 'colorado rapids', 'houston dynamo'
            ],
            'ARGENTINA': [
                'boca juniors', 'river plate', 'racing', 'independiente',
                'san lorenzo', 'estudiantes', 'gimnasia', 'lanus',
                'defensa y justicia', 'huracan', 'newells', 'talleres'
            ]
        }

        # Check each team against patterns
        for region, patterns in team_patterns.items():
            for pattern in patterns:
                if pattern in home_team or pattern in away_team:
                    return region

        return ""  # No match found

    def _detect_league_from_teams(self, match_data: Dict) -> str:
        """Detect likely league based on team names and regions"""
        home_team = match_data.get('home_team', '').lower()
        away_team = match_data.get('away_team', '').lower()
        region = match_data.get('region', '')

        # Known league patterns by region and team types
        league_patterns = {
            'BRAZIL': {
                'u20': 'Copa do Brasil U20',
                'women': 'Campeonato Brasileiro Feminino',
                'default': 'Copa do Brasil'
            },
            'BOLIVIA': {
                'default': 'Liga de Fútbol Profesional Boliviano'
            },
            'CANADA': {
                'default': 'Canadian Premier League'
            },
            'USA': {
                'default': 'Major League Soccer'
            },
            'ARGENTINA': {
                'default': 'Primera División Argentina'
            }
        }

        if region in league_patterns:
            region_leagues = league_patterns[region]

            # Check for specific league types
            if 'u20' in home_team or 'u20' in away_team:
                return region_leagues.get('u20', region_leagues['default'])
            elif any(w in home_team + away_team for w in ['women', 'w', 'feminino']):
                return region_leagues.get('women', region_leagues['default'])
            else:
                return region_leagues['default']

        return ""  # No match found

    def _fix_team_names(self, match_data: Dict) -> Dict:
        """Clean up team names that got merged with status text"""
        home_team = match_data.get('home_team', '')
        away_team = match_data.get('away_team', '')

        # Remove common suffixes that get appended incorrectly
        suffixes_to_remove = [
            'Advancing to next round',
            'Winner',
            'Loser',
            'Qualified',
            'Eliminated'
        ]

        for suffix in suffixes_to_remove:
            if home_team.endswith(suffix):
                home_team = home_team.replace(suffix, '').strip()
                match_data['home_team'] = home_team

            if away_team.endswith(suffix):
                away_team = away_team.replace(suffix, '').strip()
                match_data['away_team'] = away_team

        return match_data

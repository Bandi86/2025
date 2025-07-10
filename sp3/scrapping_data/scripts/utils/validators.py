#!/usr/bin/env python3
"""
Adatvalidáció segédeszközök
==========================

Scraped adatok validálásához szükséges függvények.
"""

import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, date
import logging

class MatchValidator:
    """Validate match data structures and content."""

    def __init__(self):
        """Initialize validator."""
        self.logger = logging.getLogger(__name__)

        # Common patterns for validation
        self.time_pattern = re.compile(r'^([01]?[0-9]|2[0-3])[:.]([0-5][0-9])$')
        self.score_pattern = re.compile(r'^\d+[-:]\d+$')
        self.url_pattern = re.compile(r'^https?://.+$')

    def validate_basic_match(self, match_data: Dict) -> Tuple[bool, List[str]]:
        """
        Validate basic match data structure.

        Args:
            match_data: Match data to validate

        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []

        # Required fields
        required_fields = [
            "home_team", "away_team", "league", "match_time", "source"
        ]

        for field in required_fields:
            if field not in match_data:
                errors.append(f"Missing required field: {field}")
            elif not match_data[field] or str(match_data[field]).strip() == "":
                errors.append(f"Empty required field: {field}")

        # Validate team names
        if "home_team" in match_data and "away_team" in match_data:
            if match_data["home_team"] == match_data["away_team"]:
                errors.append("Home team and away team cannot be the same")

        # Validate time format
        if "match_time" in match_data:
            time_str = str(match_data["match_time"])
            if not self._validate_time_format(time_str):
                errors.append(f"Invalid time format: {time_str}")

        # Validate source
        if "source" in match_data:
            source = match_data["source"]
            if not isinstance(source, str) or len(source) < 3:
                errors.append("Invalid source format")

        return len(errors) == 0, errors

    def validate_detailed_match(self, match_data: Dict) -> Tuple[bool, List[str]]:
        """
        Validate detailed match data with additional fields.

        Args:
            match_data: Detailed match data to validate

        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        # First validate basic structure
        is_valid, errors = self.validate_basic_match(match_data)

        # Validate odds if present
        if "odds" in match_data:
            odds_valid, odds_errors = self._validate_odds(match_data["odds"])
            if not odds_valid:
                errors.extend(odds_errors)

        # Validate statistics if present
        if "statistics" in match_data:
            stats_valid, stats_errors = self._validate_statistics(match_data["statistics"])
            if not stats_valid:
                errors.extend(stats_errors)

        # Validate score if present
        if "score" in match_data:
            score_valid, score_error = self._validate_score(match_data["score"])
            if not score_valid:
                errors.append(score_error)

        # Validate match URL if present
        if "match_url" in match_data:
            url_valid, url_error = self._validate_url(match_data["match_url"])
            if not url_valid:
                errors.append(url_error)

        return len(errors) == 0, errors

    def validate_daily_matches_list(self, matches: List[Dict]) -> Tuple[bool, Dict[str, Any]]:
        """
        Validate entire daily matches list.

        Args:
            matches: List of match dictionaries

        Returns:
            Tuple of (is_valid, validation_report)
        """
        report = {
            "total_matches": len(matches),
            "valid_matches": 0,
            "invalid_matches": 0,
            "errors": [],
            "warnings": []
        }

        if not matches:
            report["warnings"].append("Empty matches list")
            return True, report

        # Validate each match
        for i, match in enumerate(matches):
            is_valid, errors = self.validate_basic_match(match)

            if is_valid:
                report["valid_matches"] += 1
            else:
                report["invalid_matches"] += 1
                for error in errors:
                    report["errors"].append(f"Match {i}: {error}")

        # Check for duplicates
        duplicates = self._find_duplicate_matches(matches)
        if duplicates:
            report["warnings"].extend([f"Duplicate match found: {dup}" for dup in duplicates])

        overall_valid = report["invalid_matches"] == 0
        return overall_valid, report

    def _validate_time_format(self, time_str: str) -> bool:
        """Validate time format."""
        if not time_str:
            return False

        # Check common time formats
        return bool(self.time_pattern.match(time_str))

    def _validate_odds(self, odds_data: Dict) -> Tuple[bool, List[str]]:
        """Validate odds data structure."""
        errors = []

        if not isinstance(odds_data, dict):
            errors.append("Odds must be a dictionary")
            return False, errors

        # Common odds fields
        for field in ["home", "draw", "away"]:
            if field in odds_data:
                try:
                    odd_value = float(odds_data[field])
                    if odd_value <= 0:
                        errors.append(f"Invalid {field} odd value: {odd_value}")
                except (ValueError, TypeError):
                    errors.append(f"Invalid {field} odd format: {odds_data[field]}")

        return len(errors) == 0, errors

    def _validate_statistics(self, stats_data: Dict) -> Tuple[bool, List[str]]:
        """Validate statistics data structure."""
        errors = []

        if not isinstance(stats_data, dict):
            errors.append("Statistics must be a dictionary")
            return False, errors

        # Validate numeric statistics
        numeric_fields = ["possession_home", "possession_away", "shots_home", "shots_away"]
        for field in numeric_fields:
            if field in stats_data:
                try:
                    value = float(stats_data[field])
                    if field.startswith("possession") and (value < 0 or value > 100):
                        errors.append(f"Invalid possession value: {value}")
                    elif field.startswith("shots") and value < 0:
                        errors.append(f"Invalid shots value: {value}")
                except (ValueError, TypeError):
                    errors.append(f"Invalid {field} format: {stats_data[field]}")

        return len(errors) == 0, errors

    def _validate_score(self, score: str) -> Tuple[bool, str]:
        """Validate score format."""
        if not score:
            return False, "Empty score"

        if not self.score_pattern.match(score):
            return False, f"Invalid score format: {score}"

        # Check if scores are reasonable
        try:
            home_score, away_score = score.replace(":", "-").split("-")
            home_score, away_score = int(home_score), int(away_score)

            if home_score < 0 or away_score < 0:
                return False, "Negative scores not allowed"

            if home_score > 20 or away_score > 20:
                return False, "Unreasonably high score"

        except ValueError:
            return False, f"Cannot parse score: {score}"

        return True, ""

    def _validate_url(self, url: str) -> Tuple[bool, str]:
        """Validate URL format."""
        if not url:
            return False, "Empty URL"

        if not self.url_pattern.match(url):
            return False, f"Invalid URL format: {url}"

        return True, ""

    def _find_duplicate_matches(self, matches: List[Dict]) -> List[str]:
        """Find duplicate matches in the list."""
        seen = set()
        duplicates = []

        for match in matches:
            # Create a signature for the match
            if all(field in match for field in ["home_team", "away_team", "match_time"]):
                signature = f"{match['home_team']}_{match['away_team']}_{match['match_time']}"

                if signature in seen:
                    duplicates.append(signature)
                else:
                    seen.add(signature)

        return duplicates

    def clean_team_name(self, team_name: str) -> str:
        """Clean and normalize team name."""
        if not team_name:
            return ""

        # Remove extra whitespace
        clean_name = re.sub(r'\s+', ' ', team_name.strip())

        # Remove common suffixes/prefixes
        clean_name = re.sub(r'\s+(FC|SC|AC|CF|United|City|Town)\s*$', '', clean_name, flags=re.IGNORECASE)

        return clean_name

    def normalize_league_name(self, league_name: str) -> str:
        """Normalize league name."""
        if not league_name:
            return ""

        # Remove extra whitespace
        clean_league = re.sub(r'\s+', ' ', league_name.strip())

        # Common normalizations
        normalizations = {
            "Premier League": "English Premier League",
            "Bundesliga": "German Bundesliga",
            "Serie A": "Italian Serie A",
            "La Liga": "Spanish La Liga",
        }

        return normalizations.get(clean_league, clean_league)

def main():
    """Validators teszt"""
    print("✅ Validators teszt...")

    # TODO: Implementálás
    pass

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
JSON fájlkezelő segédeszközök
===========================

JSON fájlok írásához és olvasásához szükséges függvények.
"""

import json
import os
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, date
import logging

class JSONHandler:
    """Handle JSON operations for scraping data."""

    def __init__(self, base_path: str):
        """
        Initialize JSON handler.

        Args:
            base_path: Base directory path for data operations
        """
        self.base_path = base_path
        self.logger = logging.getLogger(__name__)

    def save_json(self, data: Union[Dict, List], file_path: str,
                  ensure_dir: bool = True, indent: int = 2) -> bool:
        """
        Save data to JSON file.

        Args:
            data: Data to save
            file_path: File path to save to
            ensure_dir: Whether to create directory if it doesn't exist
            indent: JSON indentation

        Returns:
            True if successful, False otherwise
        """
        try:
            if ensure_dir:
                os.makedirs(os.path.dirname(file_path), exist_ok=True)

            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=indent, ensure_ascii=False,
                         default=self._json_serializer)

            self.logger.info(f"Saved JSON data to {file_path}")
            return True

        except Exception as e:
            self.logger.error(f"Error saving JSON to {file_path}: {e}")
            return False

    def load_json(self, file_path: str) -> Optional[Union[Dict, List]]:
        """
        Load data from JSON file.

        Args:
            file_path: File path to load from

        Returns:
            Loaded data or None if error
        """
        try:
            if not os.path.exists(file_path):
                self.logger.warning(f"JSON file not found: {file_path}")
                return None

            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            self.logger.info(f"Loaded JSON data from {file_path}")
            return data

        except Exception as e:
            self.logger.error(f"Error loading JSON from {file_path}: {e}")
            return None

    def save_daily_matches(self, matches: List[Dict], target_date: date) -> str:
        """
        Save daily matches to appropriate directory structure.

        Args:
            matches: List of match dictionaries
            target_date: Date for the matches

        Returns:
            Path to saved file
        """
        from .date_utils import get_data_directory_path, ensure_data_directory

        # Ensure directory exists
        data_dir = ensure_data_directory(self.base_path, target_date)

        # Generate filename
        date_str = target_date.strftime("%Y-%m-%d")
        filename = f"daily_matches_{date_str}.json"
        file_path = os.path.join(data_dir, filename)

        # Prepare data structure
        data = {
            "date": date_str,
            "total_matches": len(matches),
            "scraped_at": datetime.now().isoformat(),
            "matches": matches
        }

        self.save_json(data, file_path)
        return file_path

    def save_detailed_match(self, match_data: Dict, target_date: date,
                           match_id: str) -> str:
        """
        Save detailed match data to individual file.

        Args:
            match_data: Detailed match data
            target_date: Date of the match
            match_id: Unique match identifier

        Returns:
            Path to saved file
        """
        from .date_utils import get_data_directory_path, ensure_data_directory

        # Ensure directory exists
        data_dir = ensure_data_directory(self.base_path, target_date)

        # Generate filename
        filename = f"match_{match_id}.json"
        file_path = os.path.join(data_dir, filename)

        # Add metadata
        match_data["scraped_at"] = datetime.now().isoformat()
        match_data["match_id"] = match_id

        self.save_json(match_data, file_path)
        return file_path

    def load_daily_matches(self, target_date: date) -> Optional[List[Dict]]:
        """
        Load daily matches for a specific date.

        Args:
            target_date: Date to load matches for

        Returns:
            List of matches or None if not found
        """
        from .date_utils import get_data_directory_path

        data_dir = get_data_directory_path(self.base_path, target_date)
        date_str = target_date.strftime("%Y-%m-%d")
        filename = f"daily_matches_{date_str}.json"
        file_path = os.path.join(data_dir, filename)

        data = self.load_json(file_path)
        if data and isinstance(data, dict) and "matches" in data:
            return data["matches"]
        return None

    def get_existing_match_files(self, target_date: date) -> List[str]:
        """
        Get list of existing match files for a date.

        Args:
            target_date: Date to check

        Returns:
            List of match file paths
        """
        from .date_utils import get_data_directory_path

        data_dir = get_data_directory_path(self.base_path, target_date)

        if not os.path.exists(data_dir):
            return []

        match_files = []
        for filename in os.listdir(data_dir):
            if filename.startswith("match_") and filename.endswith(".json"):
                match_files.append(os.path.join(data_dir, filename))

        return match_files

    def validate_match_structure(self, match_data: Dict) -> bool:
        """
        Validate match data structure.

        Args:
            match_data: Match data to validate

        Returns:
            True if valid, False otherwise
        """
        required_fields = [
            "home_team", "away_team", "league", "match_time", "source"
        ]

        for field in required_fields:
            if field not in match_data:
                self.logger.error(f"Missing required field: {field}")
                return False

        return True

    def merge_match_sources(self, sources_data: List[Dict]) -> Dict:
        """
        Merge match data from multiple sources.

        Args:
            sources_data: List of match data from different sources

        Returns:
            Merged match data
        """
        if not sources_data:
            return {}

        # Start with first source as base
        merged = sources_data[0].copy()
        merged["sources"] = [sources_data[0].get("source", "unknown")]

        # Merge additional sources
        for source_data in sources_data[1:]:
            source_name = source_data.get("source", "unknown")
            merged["sources"].append(source_name)

            # Merge specific fields
            if "odds" in source_data:
                if "odds" not in merged:
                    merged["odds"] = {}
                merged["odds"].update(source_data["odds"])

            if "statistics" in source_data:
                if "statistics" not in merged:
                    merged["statistics"] = {}
                merged["statistics"].update(source_data["statistics"])

        merged["source"] = "merged"
        return merged

    def _json_serializer(self, obj: Any) -> str:
        """
        Custom JSON serializer for datetime objects.

        Args:
            obj: Object to serialize

        Returns:
            Serialized string
        """
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

    def detailed_match_exists(self, target_date: date, match_id: str) -> bool:
        """
        Check if detailed match file already exists.

        Args:
            target_date: Date of the match
            match_id: Unique match identifier

        Returns:
            True if detailed match file exists, False otherwise
        """
        try:
            from .date_utils import get_data_directory_path

            # Get the data directory path
            data_dir = get_data_directory_path(self.base_path, target_date)

            # Generate filename
            filename = f"match_{match_id}.json"
            file_path = os.path.join(data_dir, filename)

            return os.path.exists(file_path)

        except Exception as e:
            self.logger.debug(f"Error checking if detailed match exists: {e}")
            return False

def create_date_directory(date_str: str) -> str:
    """
    Dátum alapú könyvtár létrehozása

    Args:
        date_str (str): Dátum YYYY-MM-DD formátumban

    Returns:
        str: Könyvtár elérési útja
    """
    # TODO: Implementálás
    pass

def main():
    """JSON handler teszt"""
    print("📄 JSON handler teszt...")

    # TODO: Implementálás
    pass

if __name__ == "__main__":
    main()

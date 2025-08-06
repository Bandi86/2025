"""
Day Splitter for Football Data

This module provides functionality to split football games by date into separate files
with standardized ISO date format filenames.
"""

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class DaySplitter:
    """Split processed football games by date into separate files"""
    
    def __init__(self):
        """Initialize the DaySplitter"""
        # Hungarian month names to numbers mapping
        self.hungarian_months = {
            'január': '01', 'jan': '01',
            'február': '02', 'feb': '02',
            'március': '03', 'már': '03', 'marc': '03',
            'április': '04', 'ápr': '04', 'apr': '04',
            'május': '05', 'máj': '05', 'maj': '05',
            'június': '06', 'jún': '06', 'jun': '06',
            'július': '07', 'júl': '07', 'jul': '07',
            'augusztus': '08', 'aug': '08',
            'szeptember': '09', 'szep': '09', 'sep': '09',
            'október': '10', 'okt': '10', 'oct': '10',
            'november': '11', 'nov': '11',
            'december': '12', 'dec': '12'
        }
        
        # Date patterns for parsing various formats
        self.date_patterns = [
            # Standard format: "2025. augusztus 5."
            r'(\d{4})\.\s*([a-záéíóöőúüű]+)\s+(\d{1,2})\.',
            # Alternative format: "2025 augusztus 5"
            r'(\d{4})\s+([a-záéíóöőúüű]+)\s+(\d{1,2})',
            # ISO format: "2025-08-05"
            r'(\d{4})-(\d{2})-(\d{2})',
            # US format: "08/05/2025"
            r'(\d{2})/(\d{2})/(\d{4})',
            # European format: "05.08.2025"
            r'(\d{1,2})\.(\d{1,2})\.(\d{4})'
        ]
        
        self.processing_stats = {
            'total_games': 0,
            'dated_games': 0,
            'undated_games': 0,
            'files_created': 0,
            'dates_processed': []
        }
    
    def split_by_days(self, games: List[Dict[str, Any]], output_dir: str = "jsons/days") -> Dict[str, List[str]]:
        """
        Split games by date into separate files
        
        Args:
            games: List of game dictionaries
            output_dir: Output directory for daily files
            
        Returns:
            Dictionary mapping dates to created file paths
        """
        logger.info(f"Starting day splitting for {len(games)} games")
        
        # Reset processing stats
        self.processing_stats = {
            'total_games': len(games),
            'dated_games': 0,
            'undated_games': 0,
            'files_created': 0,
            'dates_processed': []
        }
        
        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Group games by date
        games_by_date = {}
        undated_games = []
        
        for game in games:
            iso_date = self._extract_date_from_game(game)
            
            if iso_date:
                if iso_date not in games_by_date:
                    games_by_date[iso_date] = []
                games_by_date[iso_date].append(game)
                self.processing_stats['dated_games'] += 1
            else:
                undated_games.append(game)
                self.processing_stats['undated_games'] += 1
        
        # Save daily files
        created_files = {}
        
        for date, date_games in games_by_date.items():
            file_path = self._save_daily_file(date_games, date, str(output_path))
            if date not in created_files:
                created_files[date] = []
            created_files[date].append(file_path)
            self.processing_stats['files_created'] += 1
            self.processing_stats['dates_processed'].append(date)
        
        # Save undated games if any
        if undated_games:
            undated_file_path = self._save_daily_file(undated_games, "undated", str(output_path))
            created_files["undated"] = [undated_file_path]
            self.processing_stats['files_created'] += 1
        
        logger.info(f"Day splitting completed: {self.processing_stats['files_created']} files created")
        logger.info(f"Dated games: {self.processing_stats['dated_games']}, "
                   f"Undated games: {self.processing_stats['undated_games']}")
        
        return created_files
    
    def _extract_date_from_game(self, game: Dict[str, Any]) -> Optional[str]:
        """
        Extract and convert date from game to ISO format
        
        Args:
            game: Game dictionary
            
        Returns:
            ISO date string (YYYY-MM-DD) or None if date cannot be parsed
        """
        # Try to get date from various fields
        date_candidates = [
            game.get('iso_date'),  # Already in ISO format
            game.get('date'),      # Original date string
            game.get('match_date') # Alternative field name
        ]
        
        for date_candidate in date_candidates:
            if not date_candidate:
                continue
                
            # If already in ISO format, validate and return
            if self._is_iso_date(date_candidate):
                return date_candidate
            
            # Try to convert to ISO format
            iso_date = self._convert_to_iso_date(date_candidate)
            if iso_date:
                return iso_date
        
        return None
    
    def _is_iso_date(self, date_str: str) -> bool:
        """Check if date string is already in ISO format (YYYY-MM-DD)"""
        if not isinstance(date_str, str):
            return False
        
        iso_pattern = r'^\d{4}-\d{2}-\d{2}$'
        return bool(re.match(iso_pattern, date_str))
    
    def _convert_to_iso_date(self, date_str: str) -> Optional[str]:
        """
        Convert various date formats to ISO format (YYYY-MM-DD)
        
        Args:
            date_str: Date string in various formats
            
        Returns:
            ISO date string or None if conversion fails
        """
        if not isinstance(date_str, str):
            return None
        
        date_str = date_str.strip()
        
        # Try each date pattern
        for i, pattern in enumerate(self.date_patterns):
            match = re.search(pattern, date_str, re.IGNORECASE)
            if match:
                try:
                    if i == 0 or i == 1:  # Hungarian format: "2025. augusztus 5."
                        year = match.group(1)
                        month_name = match.group(2).lower()
                        day = match.group(3).zfill(2)
                        
                        # Convert Hungarian month name to number
                        month_num = self.hungarian_months.get(month_name)
                        if not month_num:
                            # Try partial matching for abbreviated months
                            for hun_month, num in self.hungarian_months.items():
                                if month_name.startswith(hun_month[:3]):
                                    month_num = num
                                    break
                        
                        if month_num:
                            return f"{year}-{month_num}-{day}"
                    
                    elif i == 2:  # ISO format: "2025-08-05"
                        return match.group(0)  # Already in correct format
                    
                    elif i == 3:  # US format: "08/05/2025"
                        month = match.group(1).zfill(2)
                        day = match.group(2).zfill(2)
                        year = match.group(3)
                        return f"{year}-{month}-{day}"
                    
                    elif i == 4:  # European format: "05.08.2025"
                        day = match.group(1).zfill(2)
                        month = match.group(2).zfill(2)
                        year = match.group(3)
                        return f"{year}-{month}-{day}"
                
                except (ValueError, IndexError) as e:
                    logger.debug(f"Error parsing date '{date_str}' with pattern {i}: {e}")
                    continue
        
        logger.debug(f"Could not parse date: '{date_str}'")
        return None
    
    def _save_daily_file(self, games: List[Dict[str, Any]], date: str, output_dir: str) -> str:
        """
        Save games for a specific date to a file
        
        Args:
            games: List of games for the date
            date: Date string (ISO format or "undated")
            output_dir: Output directory path
            
        Returns:
            Path to the created file
        """
        # Generate filename
        if date == "undated":
            filename = "undated_games.json"
        else:
            filename = f"{date}_games.json"
        
        file_path = Path(output_dir) / filename
        
        # Prepare output data
        output_data = {
            'file_info': {
                'creation_date': datetime.now().isoformat(),
                'date': date,
                'total_games': len(games),
                'format': 'daily_split'
            },
            'games': games
        }
        
        # Calculate additional statistics
        total_markets = sum(game.get('total_markets', 0) for game in games)
        leagues = list(set(game.get('league', 'Unknown') for game in games))
        
        output_data['file_info'].update({
            'total_markets': total_markets,
            'leagues': sorted(leagues),
            'leagues_count': len(leagues)
        })
        
        # Save file
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Saved {len(games)} games for {date} to {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error saving daily file for {date}: {e}")
            raise
    
    def get_processing_stats(self) -> Dict[str, Any]:
        """Get processing statistics"""
        return self.processing_stats.copy()
    
    def validate_date_range(self, games: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate date range and identify potential issues
        
        Args:
            games: List of games to validate
            
        Returns:
            Validation report
        """
        validation_report = {
            'total_games': len(games),
            'valid_dates': 0,
            'invalid_dates': 0,
            'date_range': {
                'earliest': None,
                'latest': None
            },
            'issues': [],
            'date_formats_found': set()
        }
        
        valid_dates = []
        
        for i, game in enumerate(games):
            date_str = game.get('date') or game.get('iso_date')
            
            if not date_str:
                validation_report['invalid_dates'] += 1
                validation_report['issues'].append({
                    'game_index': i,
                    'issue': 'missing_date',
                    'game_info': f"{game.get('home_team', 'Unknown')} vs {game.get('away_team', 'Unknown')}"
                })
                continue
            
            # Record the format found
            validation_report['date_formats_found'].add(type(date_str).__name__ + ': ' + str(date_str)[:20])
            
            iso_date = self._extract_date_from_game(game)
            
            if iso_date:
                validation_report['valid_dates'] += 1
                valid_dates.append(iso_date)
            else:
                validation_report['invalid_dates'] += 1
                validation_report['issues'].append({
                    'game_index': i,
                    'issue': 'unparseable_date',
                    'date_value': date_str,
                    'game_info': f"{game.get('home_team', 'Unknown')} vs {game.get('away_team', 'Unknown')}"
                })
        
        # Calculate date range
        if valid_dates:
            valid_dates.sort()
            validation_report['date_range']['earliest'] = valid_dates[0]
            validation_report['date_range']['latest'] = valid_dates[-1]
        
        # Convert set to list for JSON serialization
        validation_report['date_formats_found'] = list(validation_report['date_formats_found'])
        
        return validation_report
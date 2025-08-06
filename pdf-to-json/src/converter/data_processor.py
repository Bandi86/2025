"""
DataProcessor for handling deduplication and market capping.

This module provides functionality to:
- Remove exact duplicate markets from games
- Cap additional markets to configurable limits using priority-based selection
- Track processing statistics for deduplication and capping actions
"""

import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
import hashlib
from pathlib import Path

from .exceptions import ConfigurationError

logger = logging.getLogger(__name__)


class DataProcessor:
    """
    Handles deduplication and market capping with priority-based selection.
    
    This class provides functionality to:
    - Remove exact duplicate markets from games based on content hashing
    - Cap additional markets to configurable limits using priority-based selection
    - Track comprehensive statistics for deduplication and capping actions
    - Load market priorities from configuration files for flexible prioritization
    
    The processor uses a two-stage approach:
    1. Deduplication: Remove markets with identical content (type, description, odds)
    2. Capping: Limit additional markets per game using priority-based selection
    
    Market priorities are loaded from config/market_priorities.json and can be customized
    to match business requirements. Lower priority numbers indicate higher importance.
    """
    
    def __init__(self, max_markets: int = None, config_dir: str = "config"):
        """
        Initialize DataProcessor with configurable market limits and priorities.
        
        Args:
            max_markets: Maximum number of additional markets per game (None to use config)
            config_dir: Directory containing configuration files (default: "config")
        """
        self.config_dir = Path(config_dir)
        
        # Initialize processing statistics
        self.processing_stats = {
            'games_processed': 0,
            'total_duplicates_removed': 0,
            'total_markets_capped': 0,
            'games_with_duplicates': 0,
            'games_with_capping': 0,
            'duplicate_details': [],
            'capping_details': []
        }
        
        # Load market priorities from configuration (this will set max_markets if not provided)
        self.market_priorities = self._load_market_priorities()
        
        # Override max_markets if explicitly provided
        if max_markets is not None:
            self.max_markets = max_markets
            logger.info(f"Using explicit max_markets parameter: {max_markets}")
        
        logger.info(f"DataProcessor initialized with max_markets={self.max_markets}, "
                   f"loaded {len(self.market_priorities)} market priorities")
    
    def deduplicate_markets(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Remove exact duplicate markets from games.
        
        Args:
            games: List of game dictionaries with additional_markets
            
        Returns:
            List of games with duplicates removed
        """
        processed_games = []
        
        for game in games:
            original_market_count = len(game.get('additional_markets', []))
            
            # Deduplicate additional markets
            deduplicated_markets = self._remove_duplicate_markets(game.get('additional_markets', []))
            duplicates_removed = original_market_count - len(deduplicated_markets)
            
            # Update game data
            game_copy = game.copy()
            game_copy['additional_markets'] = deduplicated_markets
            game_copy['processing_info']['duplicates_removed'] = duplicates_removed
            
            # Update statistics
            if duplicates_removed > 0:
                self.processing_stats['games_with_duplicates'] += 1
                self.processing_stats['total_duplicates_removed'] += duplicates_removed
                
                # Track duplicate details
                self.processing_stats['duplicate_details'].append({
                    'game_key': f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}",
                    'time': game.get('time', 'Unknown'),
                    'duplicates_removed': duplicates_removed,
                    'original_count': original_market_count,
                    'final_count': len(deduplicated_markets)
                })
            
            processed_games.append(game_copy)
        
        self.processing_stats['games_processed'] = len(games)
        logger.info(f"Deduplication completed: {self.processing_stats['total_duplicates_removed']} "
                   f"duplicates removed from {self.processing_stats['games_with_duplicates']} games")
        
        return processed_games
    
    def cap_additional_markets(self, games: List[Dict[str, Any]], max_markets: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Cap additional markets to maximum limit using priority-based selection.
        
        Args:
            games: List of game dictionaries
            max_markets: Override default max_markets limit
            
        Returns:
            List of games with markets capped
        """
        if max_markets is None:
            max_markets = self.max_markets
        
        processed_games = []
        
        for game in games:
            additional_markets = game.get('additional_markets', [])
            original_count = len(additional_markets)
            
            if original_count <= max_markets:
                # No capping needed
                processed_games.append(game)
                continue
            
            # Sort markets by priority (lower priority number = higher priority)
            sorted_markets = self._sort_markets_by_priority(additional_markets)
            
            # Cap to maximum limit
            capped_markets = sorted_markets[:max_markets]
            excluded_markets = sorted_markets[max_markets:]
            markets_capped = len(excluded_markets)
            
            # Update game data
            game_copy = game.copy()
            game_copy['additional_markets'] = capped_markets
            game_copy['processing_info']['markets_capped'] = True
            game_copy['total_markets'] = len(capped_markets) + (1 if game.get('main_market') else 0)
            
            # Update statistics
            self.processing_stats['games_with_capping'] += 1
            self.processing_stats['total_markets_capped'] += markets_capped
            
            # Track capping details
            excluded_market_types = [market.get('market_type', 'unknown') for market in excluded_markets]
            self.processing_stats['capping_details'].append({
                'game_key': f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}",
                'time': game.get('time', 'Unknown'),
                'original_count': original_count,
                'capped_count': len(capped_markets),
                'markets_removed': markets_capped,
                'excluded_market_types': excluded_market_types
            })
            
            logger.debug(f"Capped markets for {game.get('home_team')} - {game.get('away_team')}: "
                        f"{original_count} -> {len(capped_markets)} markets")
            
            processed_games.append(game_copy)
        
        logger.info(f"Market capping completed: {self.processing_stats['total_markets_capped']} "
                   f"markets removed from {self.processing_stats['games_with_capping']} games")
        
        return processed_games
    
    def process_games(self, games: List[Dict[str, Any]], max_markets: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Run complete processing pipeline: deduplication followed by capping.
        
        Args:
            games: List of game dictionaries
            max_markets: Override default max_markets limit
            
        Returns:
            List of fully processed games
        """
        logger.info(f"Starting data processing for {len(games)} games")
        
        # Reset statistics for this processing run
        self._reset_stats()
        
        # Step 1: Remove duplicates
        deduplicated_games = self.deduplicate_markets(games)
        
        # Step 2: Cap markets
        processed_games = self.cap_additional_markets(deduplicated_games, max_markets)
        
        logger.info(f"Data processing completed: {len(processed_games)} games processed")
        return processed_games
    
    def get_processing_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive processing statistics.
        
        Returns:
            Dictionary containing all processing statistics
        """
        return {
            'summary': {
                'games_processed': self.processing_stats['games_processed'],
                'total_duplicates_removed': self.processing_stats['total_duplicates_removed'],
                'total_markets_capped': self.processing_stats['total_markets_capped'],
                'games_with_duplicates': self.processing_stats['games_with_duplicates'],
                'games_with_capping': self.processing_stats['games_with_capping']
            },
            'deduplication': {
                'games_affected': self.processing_stats['games_with_duplicates'],
                'total_duplicates': self.processing_stats['total_duplicates_removed'],
                'details': self.processing_stats['duplicate_details']
            },
            'capping': {
                'games_affected': self.processing_stats['games_with_capping'],
                'total_markets_removed': self.processing_stats['total_markets_capped'],
                'max_markets_limit': self.max_markets,
                'details': self.processing_stats['capping_details']
            },
            'market_priorities': self.market_priorities
        }
    
    def _remove_duplicate_markets(self, markets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Remove exact duplicate markets based on market content hash.
        
        Args:
            markets: List of market dictionaries
            
        Returns:
            List of unique markets
        """
        if not markets:
            return markets
        
        seen_hashes = set()
        unique_markets = []
        
        for market in markets:
            # Create a hash based on market content (excluding priority which might vary)
            market_hash = self._calculate_market_hash(market)
            
            if market_hash not in seen_hashes:
                seen_hashes.add(market_hash)
                unique_markets.append(market)
        
        return unique_markets
    
    def _calculate_market_hash(self, market: Dict[str, Any]) -> str:
        """
        Calculate a hash for a market based on its essential content.
        
        Args:
            market: Market dictionary
            
        Returns:
            Hash string representing the market
        """
        # Use market type, description, and odds for hash calculation
        # Exclude priority as it might be calculated differently
        hash_content = {
            'market_type': market.get('market_type', ''),
            'description': market.get('description', ''),
            'odds': market.get('odds', {})
        }
        
        # Convert to string and create hash
        content_str = str(sorted(hash_content.items()))
        return hashlib.md5(content_str.encode('utf-8')).hexdigest()
    
    def _sort_markets_by_priority(self, markets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sort markets by priority (lower priority number = higher priority).
        
        Args:
            markets: List of market dictionaries
            
        Returns:
            List of markets sorted by priority
        """
        def get_priority(market: Dict[str, Any]) -> Tuple[int, str]:
            # Primary sort by priority number, secondary by market type for consistency
            market_type = market.get('market_type', 'unknown')
            priority = self._calculate_market_priority(market)
            return (priority, market_type)
        
        return sorted(markets, key=get_priority)
    
    def _calculate_market_priority(self, market: Dict[str, Any]) -> int:
        """
        Calculate priority for a market based on its type.
        
        Args:
            market: Market dictionary
            
        Returns:
            Priority number (lower = higher priority)
        """
        market_type = market.get('market_type', 'unknown')
        
        # Use predefined priority if available
        if market_type in self.market_priorities:
            return self.market_priorities[market_type]
        
        # Use market's own priority if set
        if 'priority' in market:
            return market['priority']
        
        # Default to lowest priority
        return self.market_priorities['unknown']
    
    def _load_market_priorities(self) -> Dict[str, int]:
        """
        Load market priorities from configuration file.
        
        Returns:
            Dictionary mapping market types to priority numbers
            
        Raises:
            ConfigurationError: If configuration file is invalid or missing
        """
        config_path = self.config_dir / "market_priorities.json"
        
        # Use default priorities if config file doesn't exist
        if not config_path.exists():
            logger.warning(f"Market priorities config file '{config_path}' not found, using defaults")
            return self._get_default_market_priorities()
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid JSON in market priorities config '{config_path}': {e}")
        except Exception as e:
            raise ConfigurationError(f"Error reading market priorities config '{config_path}': {e}")
        
        # Extract market priorities from config
        if 'market_priorities' not in config:
            raise ConfigurationError(f"Missing 'market_priorities' section in '{config_path}'")
        
        priorities = config['market_priorities']
        if not isinstance(priorities, dict):
            raise ConfigurationError(f"'market_priorities' must be a dictionary in '{config_path}'")
        
        # Validate priority values
        for market_type, priority in priorities.items():
            if not isinstance(priority, int) or priority < 1:
                raise ConfigurationError(
                    f"Priority for '{market_type}' must be a positive integer in '{config_path}'"
                )
        
        # Update max_markets from config if specified
        if 'settings' in config and 'max_additional_markets' in config['settings']:
            config_max_markets = config['settings']['max_additional_markets']
            if isinstance(config_max_markets, int) and config_max_markets > 0:
                self.max_markets = config_max_markets
                logger.info(f"Updated max_markets from config: {self.max_markets}")
        else:
            # Set default if not specified in config
            self.max_markets = 10
            logger.info(f"Using default max_markets: {self.max_markets}")
        
        logger.info(f"Loaded {len(priorities)} market priorities from configuration")
        return priorities
    
    def _get_default_market_priorities(self) -> Dict[str, int]:
        """
        Get default market priorities when configuration file is not available.
        
        Returns:
            Dictionary with default market priorities
        """
        return {
            '1x2': 1,           # Main market (highest priority)
            'main_1x2': 1,
            'double_chance': 2,
            'handicap': 3,
            'asian_handicap': 3,
            'total_goals': 4,
            'over_under': 4,
            'both_teams_score': 5,
            'btts': 5,
            'half_time': 6,
            'half_time_full_time': 6,
            'first_last_goal': 7,
            'correct_score': 8,
            'first_goalscorer': 9,
            'anytime_goalscorer': 10,
            'corners': 11,
            'cards': 12,
            'penalty': 13,
            'unknown': 99,
            'other': 100
        }
    
    def _reset_stats(self) -> None:
        """Reset processing statistics for a new processing run."""
        self.processing_stats = {
            'games_processed': 0,
            'total_duplicates_removed': 0,
            'total_markets_capped': 0,
            'games_with_duplicates': 0,
            'games_with_capping': 0,
            'duplicate_details': [],
            'capping_details': []
        }
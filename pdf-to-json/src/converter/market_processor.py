"""
MarketProcessor for handling market classification and game merging.

This module provides functionality to:
- Classify different types of betting markets
- Merge multiple markets under single game entries
- Group markets by game using improved detection algorithms
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)


class MarketProcessor:
    """Handles market classification and game merging logic"""
    
    def __init__(self):
        """Initialize MarketProcessor with market type patterns and classification rules"""
        
        # Market type classification patterns - enhanced from FootballExtractor
        self.market_type_patterns = {
            'double_chance': [
                r'Kétesély',
                r'1X|12|X2',
                r'Két.*esély'
            ],
            'handicap': [
                r'Hendikep',
                r'Handicap',
                r'Hcp',
                r'[+-]\d+[,\.]\d*'
            ],
            'total_goals': [
                r'Gólszám',
                r'Összesen.*gól',
                r'Több.*mint.*\d+[,\.]\d*',
                r'Kevesebb.*mint.*\d+[,\.]\d*',
                r'Over.*\d+[,\.]\d*',
                r'Under.*\d+[,\.]\d*'
            ],
            'both_teams_score': [
                r'Mindkét.*csapat.*gól',
                r'BTTS',
                r'Both.*teams.*score',
                r'Igen.*Nem'
            ],
            'half_time': [
                r'[Ff]élidő',
                r'HT.*FT',
                r'Half.*time',
                r'Melyik.*félidő'
            ],
            'first_last_goal': [
                r'első.*gól',
                r'utolsó.*gól',
                r'First.*goal',
                r'Last.*goal'
            ],
            'draw_no_bet': [
                r'Döntetlennél.*visszajár',
                r'Draw.*no.*bet',
                r'DNB'
            ]
        }
        
        # Keywords that indicate special bet types (not main 1X2 markets)
        self.special_bet_keywords = [
            'Kétesély', 'Hendikep', 'Gólszám', 'Mindkét csapat', 
            'Döntetlennél', 'félidő', 'Melyik csapat', 'Hazai csapat',
            'Vendégcsapat', 'Félidő/végeredmény', 'Melyik félidőben',
            'a tét visszajár', 'szerez gólt', 'szerzi', 'több gól', 'kev.', 'több',
            'Igen', 'Nem', 'H:', 'V:', 'D:', 'lesz', 'szerez', 'nyeri', 'nyer',
            'legalább', 'egy', 't', 'mindkét', 'kevesebb', 'több', 'az első', 'az utolsó',
            'Mindké', 'Melyik', 'melyik', 'a', 'az uolsó gól', 'mindké', 'nyer legalább',
            'nyer', 'legalább', 'egy félidőt', 'félidőt', 'félidőben', 'több gólt',
            'szerzi a(z)', 'szerzi az', 'gólt', 'szerez gólt mindkét', 'nyeri mindkét',
            'nyeri', 'mindkét félidőben', 'kevesebb mint', 'több mint', 'lesz',
            'Hazai csapat', 'Vendégcsapat', '0-ra nyeri', 'nyer legalább egy',
            'Ki jut tovább?', 'Ki ju ovább'
        ]
        
    def merge_matches_by_game(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Merge matches that belong to the same game and create additional_markets structure.
        
        Args:
            matches: List of individual match dictionaries
            
        Returns:
            List of merged game dictionaries with main_market and additional_markets
        """
        merged_games = {}
        
        for match in matches:
            # Create a unique key for the game (time + teams)
            game_key = self._create_game_key(match)
            
            # Check if this is a main 1X2 market or additional market
            is_main_market = self._is_main_market(match)
            
            if game_key not in merged_games:
                # First occurrence of this game - initialize structure
                merged_games[game_key] = {
                    'league': match['league'],
                    'date': match['date'],
                    'time': match['time'],
                    'home_team': self._clean_team_name_for_merge(match['home_team']),
                    'away_team': self._clean_team_name_for_merge(match['away_team']),
                    'original_home_team': match['home_team'],
                    'original_away_team': match['away_team'],
                    'main_market': None,
                    'additional_markets': [],
                    'total_markets': 0,
                    'processing_info': {
                        'team_normalized': False,  # Will be set by TeamNormalizer
                        'markets_capped': False,   # Will be set by DataProcessor
                        'duplicates_removed': 0    # Will be set by DataProcessor
                    },
                    'raw_lines': []
                }
            
            # Add raw line for debugging and traceability
            merged_games[game_key]['raw_lines'].append(match.get('raw_line', ''))
            
            if is_main_market:
                # This is the main 1X2 market
                merged_games[game_key]['main_market'] = {
                    'market_type': '1x2',
                    'home_odds': match['home_odds'],
                    'draw_odds': match['draw_odds'],
                    'away_odds': match['away_odds']
                }
            else:
                # This is an additional market
                market_info = self._extract_market_info(match)
                merged_games[game_key]['additional_markets'].append(market_info)
        
        # Convert to list and calculate total markets
        result = []
        for game_key, game_data in merged_games.items():
            game_data['total_markets'] = len(game_data['additional_markets']) + (1 if game_data['main_market'] else 0)
            result.append(game_data)
        
        # Sort by time, league, and home team for consistent ordering
        result.sort(key=lambda x: (x['time'], x['league'], x['home_team']))
        
        logger.info(f"Merged {len(matches)} match entries into {len(result)} unique games")
        return result
    
    def classify_market_type(self, match: Dict[str, Any]) -> str:
        """
        Classify the market type based on match data and patterns.
        
        Args:
            match: Match dictionary containing team names and raw line
            
        Returns:
            Market type string ('main', 'double_chance', 'handicap', etc.)
        """
        raw_line = match.get('raw_line', '')
        home_team = match.get('home_team', '')
        away_team = match.get('away_team', '')
        
        # Combine all text for analysis
        full_text = f"{raw_line} {home_team} {away_team}".lower()
        
        # Check each market type pattern
        for market_type, patterns in self.market_type_patterns.items():
            for pattern in patterns:
                if re.search(pattern.lower(), full_text, re.IGNORECASE):
                    return market_type
        
        # Check if this looks like a main 1X2 market
        if self._is_main_market(match):
            return 'main'
        
        return 'unknown'
    
    def _create_game_key(self, match: Dict[str, Any]) -> str:
        """
        Create a unique key for the game based on time and cleaned team names.
        
        Args:
            match: Match dictionary
            
        Returns:
            Unique game key string
        """
        # Clean team names for better matching - remove all special keywords
        clean_home_team = self._clean_team_name_for_merge(match['home_team'])
        clean_away_team = self._clean_team_name_for_merge(match['away_team'])
        
        # Include date and league in key to handle same teams playing multiple times
        date_part = match.get('date', 'no_date')
        time_part = match.get('time', 'no_time')
        league_part = match.get('league', 'no_league')
        
        return f"{date_part}_{time_part}_{league_part}_{clean_home_team}_{clean_away_team}"
    
    def _is_main_market(self, match: Dict[str, Any]) -> bool:
        """
        Check if this is a main 1X2 market (not special bet types).
        
        Args:
            match: Match dictionary
            
        Returns:
            True if this is a main market, False otherwise
        """
        raw_line = match.get('raw_line', '')
        home_team = match.get('home_team', '')
        away_team = match.get('away_team', '')
        
        # Combine all text for analysis
        full_text = f"{raw_line} {home_team} {away_team}".lower()
        
        # First check for explicit special bet type indicators
        special_bet_indicators = [
            'kétesély', 'hendikep', 'gólszám', 'mindkét csapat',
            'döntetlennél', 'félidő', 'melyik csapat', 'hazai csapat',
            'vendégcsapat', 'visszajár', 'szerzi', 'több gól',
            'kevesebb', 'igen', 'nem', 'első gól', 'utolsó gól',
            'over', 'under', 'btts', 'több mint', 'kevesebb mint'
        ]
        
        # Check if any special bet indicators are present
        for indicator in special_bet_indicators:
            if indicator in full_text:
                return False
        
        # Check for handicap patterns
        if re.search(r'[+-]\d+[,\.]\d*', full_text):
            return False
        
        # Check for double chance patterns
        if re.search(r'\b(1x|12|x2)\b', full_text, re.IGNORECASE):
            return False
        
        # If we have draw odds (3 odds), it's likely a main market
        if match.get('draw_odds') is not None:
            return True
        
        # If we have exactly 2 odds and no special indicators, check if it looks like a main market
        if match.get('draw_odds') is None:
            # Could be a 2-way main market (like in some sports) or a special bet
            # Check if the team names look clean (no special bet keywords)
            clean_home = self._clean_team_name_for_merge(home_team)
            clean_away = self._clean_team_name_for_merge(away_team)
            
            # If cleaning removed significant content, it was probably a special bet
            if len(clean_home) < len(home_team) * 0.7 or len(clean_away) < len(away_team) * 0.7:
                return False
        
        # Check if this looks like a proper match line with time and team names
        # Main markets should have a recognizable pattern
        if re.search(r'^[kpvcsz][a-z]*\s+\d{1,2}:\d{2}.*[a-záéíóöőúüű]+\s*-\s*[a-záéíóöőúüű]+.*\d+[,\.]\d+', raw_line.lower()):
            return True
        
        # If it has team names that look like real teams and odds, it's likely main
        # But only if the raw line also looks like a proper match format
        if (home_team and away_team and match.get('home_odds') and match.get('away_odds') and 
            raw_line and len(raw_line) > 20):  # Raw line should be substantial
            # Check if team names look like real team names (not just keywords)
            if len(home_team) > 3 and len(away_team) > 3:
                # Additional check: raw line should contain both team names
                if home_team.lower() in raw_line.lower() and away_team.lower() in raw_line.lower():
                    return True
        
        # Default to False for unrecognizable patterns
        return False
    
    def _clean_team_name_for_merge(self, team_name: str) -> str:
        """
        Clean team name more aggressively for merging - remove all special keywords and extra text.
        
        Args:
            team_name: Original team name
            
        Returns:
            Cleaned team name suitable for merging
        """
        cleaned_name = team_name
        
        # Remove specific market type patterns that appear in team names
        market_patterns = [
            r'\s+1\.\s*félidő.*$',  # Remove "1. félidő" and everything after
            r'\s+2\.\s*félidő.*$',  # Remove "2. félidő" and everything after
            r'\s+félidő.*$',        # Remove "félidő" and everything after
            r'\s+Kétesély.*$',      # Remove "Kétesély" and everything after
            r'\s+Hendikep.*$',      # Remove "Hendikep" and everything after
            r'\s+Gólszám.*$',       # Remove "Gólszám" and everything after
            r'\s+Mindkét.*$',       # Remove "Mindkét" and everything after
            r'\s+Döntetlennél.*$',  # Remove "Döntetlennél" and everything after
            r'\s+Melyik.*$',        # Remove "Melyik" and everything after
            r'\s+Ki\s+jut.*$',      # Remove "Ki jut" and everything after
            r'\s+\([^)]*\)$',       # Remove parenthetical content at end
            r'\s+[+-]\d+[,\.]\d*$', # Remove handicap values
            r'\s+\d+[,\.]\d+$',     # Remove odds at end
            r'\s+(1X|12|X2)$',      # Remove double chance indicators
            r'\s+(több|kevesebb).*$', # Remove over/under indicators
            r'\s+(H:|V:|D:).*$',    # Remove H:, V:, D: indicators
            r'\s+(Igen|Nem)$',      # Remove Yes/No indicators
            r'\s+1X2$',             # Remove 1X2 indicator
        ]
        
        for pattern in market_patterns:
            cleaned_name = re.sub(pattern, '', cleaned_name, flags=re.IGNORECASE).strip()
        
        # Remove special bet keywords - be more precise with word boundaries
        for keyword in self.special_bet_keywords:
            # Use word boundaries and case-insensitive matching for longer keywords
            if len(keyword) > 3:
                pattern = r'\b' + re.escape(keyword) + r'\b.*?'
                cleaned_name = re.sub(pattern, '', cleaned_name, flags=re.IGNORECASE).strip()
        
        # Remove extra spaces and clean up
        cleaned_name = re.sub(r'\s+', ' ', cleaned_name).strip()
        
        # Remove trailing punctuation and dashes
        cleaned_name = re.sub(r'\s*[-\s]*$', '', cleaned_name).strip()
        
        # If the cleaned name is too short or empty, return the original
        if len(cleaned_name) < 3:
            return team_name
        
        return cleaned_name
    
    def _extract_market_info(self, match: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract detailed market information from additional markets.
        
        Args:
            match: Match dictionary
            
        Returns:
            Market info dictionary with type, description, and odds
        """
        market_info = {
            'market_type': 'unknown',
            'description': '',
            'priority': 10,  # Default low priority
            'odds': {
                'home_odds': match['home_odds'],
                'draw_odds': match.get('draw_odds'),  # Can be None for 2-odds markets
                'away_odds': match['away_odds']
            }
        }
        
        # Get the raw line for better analysis
        raw_line = match.get('raw_line', '')
        home_team = match.get('home_team', '')
        away_team = match.get('away_team', '')
        
        # Classify market type
        market_type = self.classify_market_type(match)
        market_info['market_type'] = market_type
        
        # Set priority based on market type
        market_priorities = {
            'double_chance': 2,
            'handicap': 3,
            'total_goals': 4,
            'both_teams_score': 5,
            'half_time': 6,
            'first_last_goal': 7,
            'draw_no_bet': 8,
            'unknown': 10
        }
        market_info['priority'] = market_priorities.get(market_type, 10)
        
        # Generate description based on market type and content
        if 'Kétesély' in raw_line:
            market_info['description'] = 'Kétesély (1X/12/X2)'
        elif 'Hendikep' in raw_line:
            # Extract handicap value if available
            handicap_match = re.search(r'Hendikep\s+([^)]+)', raw_line)
            if handicap_match:
                market_info['description'] = f"Hendikep {handicap_match.group(1)}"
            else:
                market_info['description'] = 'Hendikep'
        elif 'Gólszám' in raw_line:
            # Extract goal line if available
            goals_match = re.search(r'Gólszám\s+([^)]+)', raw_line)
            if goals_match:
                market_info['description'] = f"Gólszám {goals_match.group(1)}"
            else:
                market_info['description'] = 'Gólszám'
        elif 'Mindkét csapat' in raw_line:
            market_info['description'] = 'Mindkét csapat gólzik (Igen/Nem)'
        elif 'Döntetlennél a tét visszajár' in raw_line:
            market_info['description'] = 'Döntetlennél a tét visszajár'
        elif 'félidő' in raw_line.lower():
            if 'melyik félidőben' in raw_line.lower():
                market_info['description'] = 'Melyik félidőben lesz több gól'
            elif 'hazai csapat melyik félidőben' in raw_line.lower():
                market_info['description'] = 'Hazai csapat melyik félidőben szerez több gólt'
            elif 'vendégcsapat melyik félidőben' in raw_line.lower():
                market_info['description'] = 'Vendégcsapat melyik félidőben szerez több gólt'
            else:
                market_info['description'] = 'Félidő'
        elif 'melyik csapat szerzi' in raw_line.lower():
            if 'az utolsó gólt' in raw_line.lower():
                market_info['description'] = 'Melyik csapat szerzi az utolsó gólt'
            else:
                market_info['description'] = 'Melyik csapat szerzi az első gólt'
        else:
            # Fallback to team names if raw line doesn't help
            if any(keyword in home_team or keyword in away_team for keyword in ['Kétesély', 'Hendikep', 'Gólszám', 'Mindkét csapat', 'félidő']):
                # Extract the keyword for description
                for keyword in ['Kétesély', 'Hendikep', 'Gólszám', 'Mindkét csapat', 'félidő']:
                    if keyword in home_team or keyword in away_team:
                        market_info['description'] = keyword
                        break
            else:
                # Create a more descriptive fallback
                clean_home = self._clean_team_name_for_merge(home_team)
                clean_away = self._clean_team_name_for_merge(away_team)
                market_info['description'] = f"Egyéb piac: {clean_home} - {clean_away}"
        
        return market_info
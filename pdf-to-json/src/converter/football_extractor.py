import re
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class FootballExtractor:
    """Extract football match data from Tippmix JSON content"""
    
    def __init__(self):
        self.football_patterns = [
            # Labdarúgás, [Bajnokság neve]
            r'Labdarúgás,\s*([^:]+?)(?:\s*[:\d]|$)',
            # Labdarúgás [Bajnokság neve]
            r'Labdarúgás\s+([^:]+?)(?:\s*[:\d]|$)',
        ]
        
        # Match time pattern: K 20:00, Sze 19:30, etc.
        self.time_pattern = r'([K|Sze|Cs|P|Szo|V]\s+\d{1,2}:\d{2})'
        
        # Team pattern: Team1 - Team2 (more flexible to handle various team names)
        self.team_pattern = r'([A-ZÁÉÍÓÖŐÚÜŰ][A-ZÁÉÍÓÖŐÚÜŰa-záéíóöőúüű\s\.\-]+?)\s*-\s*([A-ZÁÉÍÓÖŐÚÜŰ][A-ZÁÉÍÓÖŐÚÜŰa-záéíóöőúüű\s\.\-]+?)(?=\s+\d+,\d+|\s*$)'
        
        # Odds patterns: H D V (Hazai Döntetlen Vendég) or H V (Hazai Vendég)
        self.odds_patterns = [
            r'(\d+,\d+)\s+(\d+,\d+)\s+(\d+,\d+)',  # 3 odds: H D V
            r'(\d+,\d+)\s+(\d+,\d+)',  # 2 odds: H V
        ]
        
    def extract_football_data(self, json_content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract football match data from JSON content"""
        matches = []
        
        if 'content' not in json_content or 'full_text' not in json_content['content']:
            logger.warning("No content or full_text found in JSON")
            return matches
            
        full_text = json_content['content']['full_text']
        
        # Split text into lines
        lines = full_text.split('\n')
        
        current_league = None
        current_date = None
        
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Extract league name
            league_match = self._extract_league(line)
            if league_match is not None:  # Explicitly check for None
                if league_match:  # If it's a valid league name
                    current_league = league_match
                else:  # If it's an empty string (other sport detected)
                    current_league = None
                continue
                
            # Extract date
            date_match = self._extract_date(line)
            if date_match:
                current_date = date_match
                continue
                
            # Extract match data only if we have a valid league
            if current_league:
                match_data = self._extract_match_data(line, current_league, current_date)
                if match_data:
                    matches.append(match_data)
                
        logger.info(f"Extracted {len(matches)} football matches")
        return matches
    
    def _extract_league(self, line: str) -> Optional[str]:
        """Extract league name from line"""
        # First check for football patterns
        for pattern in self.football_patterns:
            match = re.search(pattern, line)
            if match:
                league = match.group(1).strip()
                # Clean up league name
                league = re.sub(r'\s+', ' ', league)
                return league
        
        # Check for other sports to avoid misclassification
        other_sports_patterns = [
            r'Asztalitenisz,\s*([^:]+?)(?:\s*[:\d]|$)',
            r'Asztalitenisz\s+([^:]+?)(?:\s*[:\d]|$)',
            r'Tenisz,\s*([^:]+?)(?:\s*[:\d]|$)',
            r'Tenisz\s+([^:]+?)(?:\s*[:\d]|$)',
            r'Kézilabda,\s*([^:]+?)(?:\s*[:\d]|$)',
            r'Kézilabda\s+([^:]+?)(?:\s*[:\d]|$)',
            r'Kosárlabda,\s*([^:]+?)(?:\s*[:\d]|$)',
            r'Kosárlabda\s+([^:]+?)(?:\s*[:\d]|$)',
        ]
        
        for pattern in other_sports_patterns:
            match = re.search(pattern, line)
            if match:
                # Return empty string for non-football sports to clear the current league
                return ""
        
        return None
    
    def _extract_date(self, line: str) -> Optional[str]:
        """Extract date from line"""
        # Look for date patterns like "2025. augusztus 5." or "Szerda (2025. augusztus 6.)"
        date_patterns = [
            r'(\d{4}\.\s*[a-záéíóöőúüű]+\s+\d+\.)',
            r'([A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+\s*\((\d{4}\.\s*[a-záéíóöőúüű]+\s+\d+\.)\))'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, line)
            if match:
                if len(match.groups()) > 1 and match.group(2):  # Second group for parenthesized dates
                    return match.group(2)
                else:
                    return match.group(1)
        return None
    
    def _extract_match_data(self, line: str, league: Optional[str], date: Optional[str]) -> Optional[Dict[str, Any]]:
        """Extract match data from a single line"""
        # Look for time + teams + odds pattern
        time_match = re.search(self.time_pattern, line)
        if not time_match:
            return None
            
        time = time_match.group(1)
        
        # Extract teams
        team_match = re.search(self.team_pattern, line)
        if not team_match:
            return None
            
        home_team = team_match.group(1).strip()
        away_team = team_match.group(2).strip()
        
        # Clean up team names - fix common OCR errors
        home_team = self._fix_team_name(home_team)
        away_team = self._fix_team_name(away_team)
        
        # Extract odds - try different patterns
        odds_match = None
        for pattern in self.odds_patterns:
            odds_match = re.search(pattern, line)
            if odds_match:
                break
                
        if not odds_match:
            return None
            
        # Handle different odds formats
        if len(odds_match.groups()) == 3:
            # 3 odds: H D V
            home_odds = float(odds_match.group(1).replace(',', '.'))
            draw_odds = float(odds_match.group(2).replace(',', '.'))
            away_odds = float(odds_match.group(3).replace(',', '.'))
        elif len(odds_match.groups()) == 2:
            # 2 odds: H V (no draw option)
            home_odds = float(odds_match.group(1).replace(',', '.'))
            draw_odds = None  # No draw option
            away_odds = float(odds_match.group(2).replace(',', '.'))
        else:
            return None
        
        return {
            'league': league,
            'date': date,
            'time': time,
            'home_team': home_team,
            'away_team': away_team,
            'home_odds': home_odds,
            'draw_odds': draw_odds,
            'away_odds': away_odds,
            'raw_line': line
        }
    
    def save_football_data(self, matches: List[Dict[str, Any]], output_file: str):
        """Save extracted football data to JSON file"""
        # Check if this is the new merged format
        is_merged_format = len(matches) > 0 and 'main_market' in matches[0]
        
        if is_merged_format:
            total_games = len(matches)
            total_markets = sum(match['total_markets'] for match in matches)
            output_data = {
                'extraction_info': {
                    'extraction_date': datetime.now().isoformat(),
                    'total_games': total_games,
                    'total_markets': total_markets,
                    'format': 'merged_games'
                },
                'games': matches
            }
        else:
            output_data = {
                'extraction_info': {
                    'extraction_date': datetime.now().isoformat(),
                    'total_matches': len(matches),
                    'format': 'individual_matches'
                },
                'matches': matches
            }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
            
        if is_merged_format:
            logger.info(f"Saved {len(matches)} games with {total_markets} total markets to {output_file}")
        else:
            logger.info(f"Saved {len(matches)} matches to {output_file}")
    
    def print_matches(self, matches: List[Dict[str, Any]]):
        """Print matches in a readable format"""
        print(f"\n=== LABDARÚGÁS MÉRKŐZÉSEK ({len(matches)} db) ===\n")
        
        current_league = None
        for match in matches:
            if match['league'] != current_league:
                current_league = match['league']
                print(f"\n--- {current_league} ---")
            
            print(f"{match['time']} | {match['home_team']} - {match['away_team']}")
            
            # Check if this is the new merged format or old format
            if 'main_market' in match:
                # New merged format
                if match['main_market']:
                    print(f"Fő piac (1X2): {match['main_market']['home_odds']} | {match['main_market']['draw_odds']} | {match['main_market']['away_odds']}")
                
                if match['additional_markets']:
                    print(f"További piacok ({len(match['additional_markets'])} db):")
                    for i, market in enumerate(match['additional_markets'], 1):
                        print(f"  {i}. {market['description']}: {market['odds']['home_odds']} | {market['odds']['draw_odds']} | {market['odds']['away_odds']}")
                
                print(f"Összesen {match['total_markets']} piac")
            else:
                # Old format
                print(f"Odds: {match['home_odds']} | {match['draw_odds']} | {match['away_odds']}")
            
            print("-" * 50) 

    def filter_main_matches(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter out special bet types and keep only main 1X2 matches"""
        main_matches = []
        seen_matches = set()
        
        for match in matches:
            # Skip matches with special bet types
            skip_keywords = [
                'Kétesély', 'Hendikep', 'Gólszám', 'Mindkét csapat', 
                'Döntetlennél', 'félidő', 'Melyik csapat', 'Hazai csapat',
                'Vendégcsapat', 'Félidő/végeredmény', 'Melyik félidőben'
            ]
            
            should_skip = False
            for keyword in skip_keywords:
                if keyword in match['home_team'] or keyword in match['away_team']:
                    should_skip = True
                    break
            
            if should_skip:
                continue
                
            # Create a unique key for the match to avoid duplicates
            match_key = f"{match['time']}_{match['home_team']}_{match['away_team']}"
            
            # Skip if we've already seen this match
            if match_key in seen_matches:
                continue
                
            seen_matches.add(match_key)
            main_matches.append(match)
        
        logger.info(f"Filtered {len(matches)} matches to {len(main_matches)} main matches")
        return main_matches 

    def merge_matches_by_game(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Merge matches that belong to the same game and create additional_markets structure"""
        merged_matches = {}
        
        for match in matches:
            # Create a unique key for the game (time + teams)
            # Clean team names for better matching - remove all special keywords
            clean_home_team = self._clean_team_name_for_merge(match['home_team'])
            clean_away_team = self._clean_team_name_for_merge(match['away_team'])
            game_key = f"{match['time']}_{clean_home_team}_{clean_away_team}"
            
            # Check if this is a main 1X2 market or additional market
            is_main_market = self._is_main_1x2_market(match)
            
            if game_key not in merged_matches:
                # First occurrence of this game
                merged_matches[game_key] = {
                    'league': match['league'],
                    'date': match['date'],
                    'time': match['time'],
                    'home_team': clean_home_team,
                    'away_team': clean_away_team,
                    'main_market': None,
                    'additional_markets': [],
                    'total_markets': 0,
                    'raw_lines': []
                }
            
            # Add raw line
            merged_matches[game_key]['raw_lines'].append(match['raw_line'])
            
            if is_main_market:
                # This is the main 1X2 market
                merged_matches[game_key]['main_market'] = {
                    'home_odds': match['home_odds'],
                    'draw_odds': match['draw_odds'],
                    'away_odds': match['away_odds'],
                    'market_type': '1X2'
                }
            else:
                # This is an additional market
                market_info = self._extract_market_info(match)
                merged_matches[game_key]['additional_markets'].append(market_info)
        
        # Convert to list and calculate total markets
        result = []
        for game_key, game_data in merged_matches.items():
            game_data['total_markets'] = len(game_data['additional_markets']) + (1 if game_data['main_market'] else 0)
            result.append(game_data)
        
        # Sort by time and league
        result.sort(key=lambda x: (x['time'], x['league'], x['home_team']))
        
        logger.info(f"Merged {len(matches)} match entries into {len(result)} unique games")
        return result
    
    def _clean_team_name(self, team_name: str) -> str:
        """Clean team name by removing special bet type keywords"""
        skip_keywords = [
            'Kétesély', 'Hendikep', 'Gólszám', 'Mindkét csapat', 
            'Döntetlennél', 'félidő', 'Melyik csapat', 'Hazai csapat',
            'Vendégcsapat', 'Félidő/végeredmény', 'Melyik félidőben'
        ]
        
        cleaned_name = team_name
        for keyword in skip_keywords:
            cleaned_name = cleaned_name.replace(keyword, '').strip()
        
        return cleaned_name
    
    def _clean_team_name_for_merge(self, team_name: str) -> str:
        """Clean team name more aggressively for merging - remove all special keywords and extra text"""
        # Extended list of keywords to remove for merging
        skip_keywords = [
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
        
        cleaned_name = team_name
        for keyword in skip_keywords:
            cleaned_name = cleaned_name.replace(keyword, '').strip()
        
        # Remove extra spaces and clean up
        cleaned_name = re.sub(r'\s+', ' ', cleaned_name).strip()
        
        # Remove trailing punctuation and extra text
        cleaned_name = re.sub(r'\s*[-\s]*$', '', cleaned_name)
        
        # Remove any remaining text that looks like special bet types
        # Look for patterns like "csapat - Gólszám" or "csapat -"
        cleaned_name = re.sub(r'\s*-\s*(Gólszám|Hendikep|Kétesély|Mindkét|Melyik|félidő|nyer|szerzi|szerez).*$', '', cleaned_name)
        
        # Don't remove valid team name parts like "FC", "Köbenhavn", etc.
        # Only remove if it's clearly a special bet type keyword
        if cleaned_name in ['FC', 'Köbenhavn', 'Malmö', 'Paks', 'Polisszja Zsitomir', 'Zsitomir', 'Brabrand', 'Skive', 'Hutnik Krakkó', 'Zaglebie Sosnowiec']:
            return cleaned_name  # Return cleaned name for valid team names
        
        # If the cleaned name is too short or empty, return the original
        if len(cleaned_name) < 3:
            return team_name
        
        return cleaned_name
    
    def _is_main_1x2_market(self, match: Dict[str, Any]) -> bool:
        """Check if this is a main 1X2 market (not special bet types)"""
        skip_keywords = [
            'Kétesély', 'Hendikep', 'Gólszám', 'Mindkét csapat', 
            'Döntetlennél', 'félidő', 'Melyik csapat', 'Hazai csapat',
            'Vendégcsapat', 'Félidő/végeredmény', 'Melyik félidőben',
            'visszajár', 'szerzi', 'több gól', 'kev.', 'több'
        ]
        
        # Check if any of the skip keywords are in the team names
        for keyword in skip_keywords:
            if keyword in match['home_team'] or keyword in match['away_team']:
                return False
        
        # Also check the raw line for additional keywords
        raw_line = match.get('raw_line', '')
        for keyword in skip_keywords:
            if keyword in raw_line:
                return False
        
        # Additional check: if the line contains parentheses with specific content, it's likely not a main market
        if '(' in raw_line and ')' in raw_line:
            # Check for common patterns in parentheses that indicate special markets
            parentheses_patterns = [
                r'\(H:\s*[^)]+\)',  # (H: ...)
                r'\([^)]*kev[^)]*\)',  # contains "kev"
                r'\([^)]*több[^)]*\)',  # contains "több"
                r'\([^)]*Igen[^)]*\)',  # contains "Igen"
                r'\([^)]*Nem[^)]*\)',   # contains "Nem"
            ]
            
            for pattern in parentheses_patterns:
                if re.search(pattern, raw_line):
                    return False
        
        return True
    
    def _extract_market_info(self, match: Dict[str, Any]) -> Dict[str, Any]:
        """Extract market information from additional markets"""
        market_info = {
            'market_type': 'unknown',
            'description': '',
            'odds': {
                'home_odds': match['home_odds'],
                'draw_odds': match.get('draw_odds'),  # Can be None for 2-odds markets
                'away_odds': match['away_odds']
            }
        }
        
        # Get the raw line for better analysis
        raw_line = match.get('raw_line', '')
        
        # Try to identify market type from raw line first (more accurate)
        if 'Kétesély' in raw_line:
            market_info['market_type'] = 'double_chance'
            market_info['description'] = 'Kétesély (1X/12/X2)'
        elif 'Hendikep' in raw_line:
            market_info['market_type'] = 'handicap'
            # Extract handicap value if available
            handicap_match = re.search(r'Hendikep\s+([^)]+)', raw_line)
            if handicap_match:
                market_info['description'] = f"Hendikep {handicap_match.group(1)}"
            else:
                market_info['description'] = 'Hendikep'
        elif 'Gólszám' in raw_line:
            market_info['market_type'] = 'total_goals'
            # Extract goal line if available
            goals_match = re.search(r'Gólszám\s+([^)]+)', raw_line)
            if goals_match:
                market_info['description'] = f"Gólszám {goals_match.group(1)}"
            else:
                market_info['description'] = 'Gólszám'
        elif 'Mindkét csapat' in raw_line:
            market_info['market_type'] = 'both_teams_score'
            market_info['description'] = 'Mindkét csapat gólzik (Igen/Nem)'
        elif 'Döntetlennél a tét visszajár' in raw_line:
            market_info['market_type'] = 'draw_no_bet'
            market_info['description'] = 'Döntetlennél a tét visszajár'
        elif 'félidő' in raw_line.lower():
            market_info['market_type'] = 'half_time'
            if 'melyik félidőben' in raw_line.lower():
                market_info['description'] = 'Melyik félidőben lesz több gól'
            elif 'hazai csapat melyik félidőben' in raw_line.lower():
                market_info['description'] = 'Hazai csapat melyik félidőben szerez több gólt'
            elif 'vendégcsapat melyik félidőben' in raw_line.lower():
                market_info['description'] = 'Vendégcsapat melyik félidőben szerez több gólt'
            else:
                market_info['description'] = 'Félidő'
        elif 'melyik csapat szerzi' in raw_line.lower():
            market_info['market_type'] = 'first_last_goal'
            if 'az utolsó gólt' in raw_line.lower():
                market_info['description'] = 'Melyik csapat szerzi az utolsó gólt'
            else:
                market_info['description'] = 'Melyik csapat szerzi az első gólt'
        else:
            # Fallback to team names if raw line doesn't help
            home_team = match['home_team']
            away_team = match['away_team']
            
            if 'Kétesély' in home_team or 'Kétesély' in away_team:
                market_info['market_type'] = 'double_chance'
                market_info['description'] = 'Kétesély'
            elif 'Hendikep' in home_team or 'Hendikep' in away_team:
                market_info['market_type'] = 'handicap'
                market_info['description'] = 'Hendikep'
            elif 'Gólszám' in home_team or 'Gólszám' in away_team:
                market_info['market_type'] = 'total_goals'
                market_info['description'] = 'Gólszám'
            elif 'Mindkét csapat' in home_team or 'Mindkét csapat' in away_team:
                market_info['market_type'] = 'both_teams_score'
                market_info['description'] = 'Mindkét csapat gólzik'
            elif 'félidő' in home_team or 'félidő' in away_team:
                market_info['market_type'] = 'half_time'
                market_info['description'] = 'Félidő'
            else:
                # Create a more descriptive fallback
                market_info['description'] = f"Egyéb piac: {home_team} - {away_team}"
        
        return market_info
    
    def _fix_team_name(self, team_name: str) -> str:
        """Fix common OCR errors in team names"""
        # Common OCR fixes
        fixes = {
            'Kongói Közársság': 'Kongói Köztársaság',
            'Hunik Krkkó': 'Hutnik Krakkó',
            'Zglebie Sosnowiec': 'Zaglebie Sosnowiec',
            'Brbrnd': 'Brabrand',
            'Pis': 'Pisa',
            'Polisszj Zsiomir': 'Polisszja Zsitomir',
            'FTC': 'FTC',
            'AIK Sockholm': 'AIK Stockholm',
            'Győr': 'Győr',
            'Leverkusen': 'Leverkusen',
            'Paks': 'Paks'
        }
        
        # Apply fixes
        for wrong, correct in fixes.items():
            if team_name == wrong:
                return correct
        
        # Also try partial matches for common OCR errors
        if 'Kongói Közársság' in team_name:
            return team_name.replace('Kongói Közársság', 'Kongói Köztársaság')
        if 'Hunik Krkkó' in team_name:
            return team_name.replace('Hunik Krkkó', 'Hutnik Krakkó')
        if 'Zglebie Sosnowiec' in team_name:
            return team_name.replace('Zglebie Sosnowiec', 'Zaglebie Sosnowiec')
        if 'Brbrnd' in team_name:
            return team_name.replace('Brbrnd', 'Brabrand')
        if 'Pis' in team_name and team_name != 'Pisa':
            return team_name.replace('Pis', 'Pisa')
        
        return team_name 
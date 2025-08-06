"""
Report Generator for Football Data Processing

This module provides comprehensive reporting functionality including:
- JSON and CSV report generation with processing statistics
- Anomaly detection and reporting with detailed descriptions
- Normalization mapping reports and daily breakdown statistics
"""

import json
import csv
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict, Counter

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generate comprehensive reports for football data processing"""
    
    def __init__(self):
        """Initialize the ReportGenerator"""
        self.anomaly_detectors = {
            'missing_odds': self._detect_missing_odds,
            'invalid_team_names': self._detect_invalid_team_names,
            'date_parsing_issues': self._detect_date_parsing_issues,
            'market_classification_issues': self._detect_market_classification_issues,
            'duplicate_games': self._detect_duplicate_games,
            'unusual_odds_ranges': self._detect_unusual_odds_ranges
        }
        
        self.report_stats = {
            'reports_generated': 0,
            'anomalies_detected': 0,
            'last_generation_time': None
        }
    
    def generate_reports(self, games: List[Dict[str, Any]], processing_stats: Dict[str, Any], 
                        output_dir: str = "jsons/reports", 
                        normalization_mapping: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """
        Generate comprehensive JSON and CSV reports
        
        Args:
            games: List of processed game dictionaries
            processing_stats: Statistics from various processing stages
            output_dir: Output directory for reports
            normalization_mapping: Team name normalization mapping
            
        Returns:
            Dictionary mapping report types to file paths
        """
        logger.info(f"Starting report generation for {len(games)} games")
        
        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Generate timestamp for filenames
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Calculate comprehensive statistics
        game_stats = self._calculate_statistics(games)
        
        # Detect anomalies
        anomalies = self._detect_anomalies(games)
        
        # Create daily breakdown
        daily_breakdown = self._create_daily_breakdown(games)
        
        # Compile complete report data
        report_data = {
            'generation_info': {
                'timestamp': datetime.now().isoformat(),
                'version': '1.0.0',
                'total_games_processed': len(games),
                'report_types': ['summary', 'anomalies', 'daily_breakdown', 'processing_stats']
            },
            'summary': game_stats,
            'processing_stats': processing_stats,
            'anomalies': anomalies,
            'normalization_mapping': normalization_mapping or {},
            'daily_breakdown': daily_breakdown
        }
        
        # Generate reports
        generated_files = {}
        
        # JSON Report
        json_file = output_path / f"football_report_{timestamp}.json"
        self._generate_json_report(report_data, str(json_file))
        generated_files['json'] = str(json_file)
        
        # CSV Reports
        csv_files = self._generate_csv_reports(report_data, output_path, timestamp)
        generated_files.update(csv_files)
        
        # Update statistics
        self.report_stats['reports_generated'] += 1
        self.report_stats['anomalies_detected'] = len(anomalies)
        self.report_stats['last_generation_time'] = datetime.now().isoformat()
        
        logger.info(f"Report generation completed: {len(generated_files)} files created")
        logger.info(f"Anomalies detected: {len(anomalies)}")
        
        return generated_files
    
    def _calculate_statistics(self, games: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate comprehensive statistics for games
        
        Args:
            games: List of game dictionaries
            
        Returns:
            Dictionary containing various statistics
        """
        if not games:
            return {
                'total_games': 0,
                'total_markets': 0,
                'leagues_count': 0,
                'dates_processed': [],
                'teams_count': 0,
                'average_markets_per_game': 0.0
            }
        
        # Basic counts
        total_games = len(games)
        total_markets = sum(game.get('total_markets', 0) for game in games)
        
        # League statistics
        leagues = set()
        for game in games:
            if game.get('league'):
                leagues.add(game['league'])
        
        # Date statistics
        dates = set()
        for game in games:
            iso_date = game.get('iso_date')
            if iso_date:
                dates.add(iso_date)
        
        # Team statistics
        teams = set()
        for game in games:
            if game.get('home_team'):
                teams.add(game['home_team'])
            if game.get('away_team'):
                teams.add(game['away_team'])
        
        # Market type distribution
        market_types = Counter()
        main_market_count = 0
        additional_market_count = 0
        
        for game in games:
            # Count main markets
            if game.get('main_market'):
                main_market_count += 1
                market_type = game['main_market'].get('market_type', 'unknown')
                market_types[market_type] += 1
            
            # Count additional markets
            additional_markets = game.get('additional_markets', [])
            additional_market_count += len(additional_markets)
            
            for market in additional_markets:
                market_type = market.get('market_type', 'unknown')
                market_types[market_type] += 1
        
        # Processing info statistics
        teams_normalized = sum(1 for game in games 
                             if game.get('processing_info', {}).get('team_normalized', False))
        markets_capped = sum(1 for game in games 
                           if game.get('processing_info', {}).get('markets_capped', False))
        duplicates_removed = sum(game.get('processing_info', {}).get('duplicates_removed', 0) 
                               for game in games)
        
        return {
            'total_games': total_games,
            'total_markets': total_markets,
            'main_markets': main_market_count,
            'additional_markets': additional_market_count,
            'leagues_count': len(leagues),
            'leagues': sorted(list(leagues)),
            'dates_processed': sorted(list(dates)),
            'date_range': {
                'earliest': min(dates) if dates else None,
                'latest': max(dates) if dates else None,
                'total_days': len(dates)
            },
            'teams_count': len(teams),
            'teams': sorted(list(teams)),
            'average_markets_per_game': round(total_markets / total_games, 2) if total_games > 0 else 0.0,
            'market_type_distribution': dict(market_types.most_common()),
            'processing_summary': {
                'teams_normalized': teams_normalized,
                'games_with_capped_markets': markets_capped,
                'total_duplicates_removed': duplicates_removed
            }
        }
    
    def _detect_anomalies(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detect various anomalies in the game data
        
        Args:
            games: List of game dictionaries
            
        Returns:
            List of anomaly dictionaries
        """
        all_anomalies = []
        
        for detector_name, detector_func in self.anomaly_detectors.items():
            try:
                anomalies = detector_func(games)
                all_anomalies.extend(anomalies)
                logger.debug(f"{detector_name}: {len(anomalies)} anomalies detected")
            except Exception as e:
                logger.error(f"Error in anomaly detector {detector_name}: {e}")
                all_anomalies.append({
                    'type': 'detector_error',
                    'detector': detector_name,
                    'description': f"Anomaly detector failed: {str(e)}",
                    'severity': 'high',
                    'game_info': None
                })
        
        # Sort anomalies by severity
        severity_order = {'high': 0, 'medium': 1, 'low': 2}
        all_anomalies.sort(key=lambda x: severity_order.get(x.get('severity', 'low'), 2))
        
        return all_anomalies
    
    def _detect_missing_odds(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect games with missing or invalid odds"""
        anomalies = []
        
        for i, game in enumerate(games):
            game_key = f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}"
            
            # Check main market odds
            main_market = game.get('main_market', {})
            if main_market:
                odds = main_market.get('odds', {})
                missing_odds = []
                
                for odd_type in ['home_odds', 'draw_odds', 'away_odds']:
                    odd_value = odds.get(odd_type)
                    if odd_value is None or odd_value <= 0:
                        missing_odds.append(odd_type)
                
                if missing_odds:
                    anomalies.append({
                        'type': 'missing_odds',
                        'description': f"Missing or invalid odds in main market: {', '.join(missing_odds)}",
                        'game_info': {
                            'game_key': game_key,
                            'time': game.get('time', 'Unknown'),
                            'league': game.get('league', 'Unknown'),
                            'missing_odds': missing_odds
                        },
                        'severity': 'medium'
                    })
            
            # Check additional markets
            for market_idx, market in enumerate(game.get('additional_markets', [])):
                odds = market.get('odds', {})
                if not odds or all(v is None or v <= 0 for v in odds.values()):
                    anomalies.append({
                        'type': 'missing_odds',
                        'description': f"Missing odds in additional market {market_idx + 1}",
                        'game_info': {
                            'game_key': game_key,
                            'time': game.get('time', 'Unknown'),
                            'market_type': market.get('market_type', 'unknown'),
                            'market_description': market.get('description', '')
                        },
                        'severity': 'low'
                    })
        
        return anomalies
    
    def _detect_invalid_team_names(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect games with suspicious or invalid team names"""
        anomalies = []
        
        # Patterns that might indicate OCR errors or invalid names
        suspicious_patterns = [
            r'[0-9]{3,}',  # Long sequences of numbers
            r'[^a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\-\.]',  # Non-letter characters (except common ones)
            r'^[a-z]',  # Names starting with lowercase
            r'\s{2,}',  # Multiple consecutive spaces
        ]
        
        for game in games:
            game_key = f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}"
            
            for team_type in ['home_team', 'away_team']:
                team_name = game.get(team_type, '')
                
                if not team_name or len(team_name.strip()) < 2:
                    anomalies.append({
                        'type': 'invalid_team_name',
                        'description': f"Empty or too short {team_type}: '{team_name}'",
                        'game_info': {
                            'game_key': game_key,
                            'time': game.get('time', 'Unknown'),
                            'team_type': team_type,
                            'team_name': team_name
                        },
                        'severity': 'high'
                    })
                    continue
                
                # Check for suspicious patterns
                for pattern in suspicious_patterns:
                    if re.search(pattern, team_name):
                        anomalies.append({
                            'type': 'suspicious_team_name',
                            'description': f"Suspicious {team_type} name pattern: '{team_name}'",
                            'game_info': {
                                'game_key': game_key,
                                'time': game.get('time', 'Unknown'),
                                'team_type': team_type,
                                'team_name': team_name,
                                'pattern_matched': pattern
                            },
                            'severity': 'medium'
                        })
                        break
        
        return anomalies
    
    def _detect_date_parsing_issues(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect games with date parsing issues"""
        anomalies = []
        
        for game in games:
            game_key = f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}"
            
            # Check for missing dates
            if not game.get('date') and not game.get('iso_date'):
                anomalies.append({
                    'type': 'missing_date',
                    'description': "Game has no date information",
                    'game_info': {
                        'game_key': game_key,
                        'time': game.get('time', 'Unknown'),
                        'league': game.get('league', 'Unknown')
                    },
                    'severity': 'medium'
                })
            
            # Check for date conversion issues
            elif game.get('date') and not game.get('iso_date'):
                anomalies.append({
                    'type': 'date_parsing_failed',
                    'description': f"Could not parse date: '{game.get('date')}'",
                    'game_info': {
                        'game_key': game_key,
                        'time': game.get('time', 'Unknown'),
                        'original_date': game.get('date')
                    },
                    'severity': 'medium'
                })
        
        return anomalies
    
    def _detect_market_classification_issues(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect issues with market classification"""
        anomalies = []
        
        for game in games:
            game_key = f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}"
            
            # Check for games without main market
            if not game.get('main_market'):
                anomalies.append({
                    'type': 'missing_main_market',
                    'description': "Game has no main 1X2 market",
                    'game_info': {
                        'game_key': game_key,
                        'time': game.get('time', 'Unknown'),
                        'total_markets': game.get('total_markets', 0)
                    },
                    'severity': 'high'
                })
            
            # Check for markets with unknown type
            unknown_markets = []
            for market in game.get('additional_markets', []):
                if market.get('market_type') == 'unknown':
                    unknown_markets.append(market.get('description', 'No description'))
            
            if unknown_markets:
                anomalies.append({
                    'type': 'unknown_market_types',
                    'description': f"Markets with unknown type: {len(unknown_markets)} markets",
                    'game_info': {
                        'game_key': game_key,
                        'time': game.get('time', 'Unknown'),
                        'unknown_markets': unknown_markets[:3]  # Limit to first 3
                    },
                    'severity': 'low'
                })
        
        return anomalies
    
    def _detect_duplicate_games(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect potential duplicate games"""
        anomalies = []
        
        # Group games by key components
        game_signatures = defaultdict(list)
        
        for i, game in enumerate(games):
            # Create signature based on teams, time, and date
            signature = (
                game.get('home_team', '').lower().strip(),
                game.get('away_team', '').lower().strip(),
                game.get('time', ''),
                game.get('iso_date', game.get('date', ''))
            )
            game_signatures[signature].append((i, game))
        
        # Find duplicates
        for signature, game_list in game_signatures.items():
            if len(game_list) > 1:
                game_keys = []
                for idx, game in game_list:
                    game_key = f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}"
                    game_keys.append(f"{game_key} (index {idx})")
                
                anomalies.append({
                    'type': 'duplicate_games',
                    'description': f"Potential duplicate games found: {len(game_list)} instances",
                    'game_info': {
                        'signature': signature,
                        'games': game_keys,
                        'count': len(game_list)
                    },
                    'severity': 'medium'
                })
        
        return anomalies
    
    def _detect_unusual_odds_ranges(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect games with unusual odds ranges"""
        anomalies = []
        
        for game in games:
            game_key = f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}"
            
            # Check main market odds
            main_market = game.get('main_market', {})
            if main_market:
                odds = main_market.get('odds', {})
                home_odds = odds.get('home_odds', 0)
                draw_odds = odds.get('draw_odds', 0)
                away_odds = odds.get('away_odds', 0)
                
                # Check for extremely high or low odds
                all_odds = [home_odds, draw_odds, away_odds]
                valid_odds = [odd for odd in all_odds if odd and odd > 0]
                
                if valid_odds:
                    min_odd = min(valid_odds)
                    max_odd = max(valid_odds)
                    
                    if min_odd < 1.01:
                        anomalies.append({
                            'type': 'unusual_odds',
                            'description': f"Extremely low odds detected: {min_odd}",
                            'game_info': {
                                'game_key': game_key,
                                'time': game.get('time', 'Unknown'),
                                'odds': odds,
                                'min_odd': min_odd
                            },
                            'severity': 'medium'
                        })
                    
                    if max_odd > 100:
                        anomalies.append({
                            'type': 'unusual_odds',
                            'description': f"Extremely high odds detected: {max_odd}",
                            'game_info': {
                                'game_key': game_key,
                                'time': game.get('time', 'Unknown'),
                                'odds': odds,
                                'max_odd': max_odd
                            },
                            'severity': 'medium'
                        })
        
        return anomalies
    
    def _create_daily_breakdown(self, games: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Create daily breakdown statistics"""
        daily_stats = defaultdict(lambda: {
            'games_count': 0,
            'markets_count': 0,
            'leagues': set(),
            'teams': set()
        })
        
        for game in games:
            date = game.get('iso_date', 'undated')
            
            daily_stats[date]['games_count'] += 1
            daily_stats[date]['markets_count'] += game.get('total_markets', 0)
            
            if game.get('league'):
                daily_stats[date]['leagues'].add(game['league'])
            
            if game.get('home_team'):
                daily_stats[date]['teams'].add(game['home_team'])
            if game.get('away_team'):
                daily_stats[date]['teams'].add(game['away_team'])
        
        # Convert sets to lists and counts for JSON serialization
        result = {}
        for date, stats in daily_stats.items():
            result[date] = {
                'games_count': stats['games_count'],
                'markets_count': stats['markets_count'],
                'leagues': sorted(list(stats['leagues'])),
                'leagues_count': len(stats['leagues']),
                'teams_count': len(stats['teams'])
            }
        
        return result
    
    def _generate_json_report(self, data: Dict[str, Any], output_path: str) -> None:
        """Generate JSON report file"""
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"JSON report saved to {output_path}")
        except Exception as e:
            logger.error(f"Error saving JSON report to {output_path}: {e}")
            raise
    
    def _generate_csv_reports(self, data: Dict[str, Any], output_dir: Path, timestamp: str) -> Dict[str, str]:
        """Generate multiple CSV reports"""
        csv_files = {}
        
        try:
            # Summary CSV
            summary_file = output_dir / f"summary_{timestamp}.csv"
            self._write_summary_csv(data['summary'], str(summary_file))
            csv_files['summary_csv'] = str(summary_file)
            
            # Anomalies CSV
            if data['anomalies']:
                anomalies_file = output_dir / f"anomalies_{timestamp}.csv"
                self._write_anomalies_csv(data['anomalies'], str(anomalies_file))
                csv_files['anomalies_csv'] = str(anomalies_file)
            
            # Daily breakdown CSV
            if data['daily_breakdown']:
                daily_file = output_dir / f"daily_breakdown_{timestamp}.csv"
                self._write_daily_breakdown_csv(data['daily_breakdown'], str(daily_file))
                csv_files['daily_csv'] = str(daily_file)
            
            # Normalization mapping CSV
            if data['normalization_mapping']:
                mapping_file = output_dir / f"normalization_mapping_{timestamp}.csv"
                self._write_normalization_csv(data['normalization_mapping'], str(mapping_file))
                csv_files['normalization_csv'] = str(mapping_file)
            
        except Exception as e:
            logger.error(f"Error generating CSV reports: {e}")
            raise
        
        return csv_files
    
    def _write_summary_csv(self, summary: Dict[str, Any], file_path: str) -> None:
        """Write summary statistics to CSV"""
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Metric', 'Value'])
            
            # Basic statistics
            writer.writerow(['Total Games', summary.get('total_games', 0)])
            writer.writerow(['Total Markets', summary.get('total_markets', 0)])
            writer.writerow(['Main Markets', summary.get('main_markets', 0)])
            writer.writerow(['Additional Markets', summary.get('additional_markets', 0)])
            writer.writerow(['Leagues Count', summary.get('leagues_count', 0)])
            writer.writerow(['Teams Count', summary.get('teams_count', 0)])
            writer.writerow(['Average Markets per Game', summary.get('average_markets_per_game', 0)])
            
            # Date range
            date_range = summary.get('date_range', {})
            writer.writerow(['Earliest Date', date_range.get('earliest', 'N/A')])
            writer.writerow(['Latest Date', date_range.get('latest', 'N/A')])
            writer.writerow(['Total Days', date_range.get('total_days', 0)])
            
            # Processing summary
            processing = summary.get('processing_summary', {})
            writer.writerow(['Teams Normalized', processing.get('teams_normalized', 0)])
            writer.writerow(['Games with Capped Markets', processing.get('games_with_capped_markets', 0)])
            writer.writerow(['Total Duplicates Removed', processing.get('total_duplicates_removed', 0)])
    
    def _write_anomalies_csv(self, anomalies: List[Dict[str, Any]], file_path: str) -> None:
        """Write anomalies to CSV"""
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Type', 'Severity', 'Description', 'Game Key', 'Time', 'Additional Info'])
            
            for anomaly in anomalies:
                game_info = anomaly.get('game_info', {})
                additional_info = json.dumps({k: v for k, v in game_info.items() 
                                            if k not in ['game_key', 'time']})
                
                writer.writerow([
                    anomaly.get('type', ''),
                    anomaly.get('severity', ''),
                    anomaly.get('description', ''),
                    game_info.get('game_key', ''),
                    game_info.get('time', ''),
                    additional_info
                ])
    
    def _write_daily_breakdown_csv(self, daily_breakdown: Dict[str, Dict[str, Any]], file_path: str) -> None:
        """Write daily breakdown to CSV"""
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Date', 'Games Count', 'Markets Count', 'Leagues Count', 'Teams Count', 'Leagues'])
            
            for date, stats in sorted(daily_breakdown.items()):
                leagues_str = ', '.join(stats.get('leagues', []))
                writer.writerow([
                    date,
                    stats.get('games_count', 0),
                    stats.get('markets_count', 0),
                    stats.get('leagues_count', 0),
                    stats.get('teams_count', 0),
                    leagues_str
                ])
    
    def _write_normalization_csv(self, normalization_mapping: Dict[str, str], file_path: str) -> None:
        """Write normalization mapping to CSV"""
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Original Team Name', 'Normalized Team Name'])
            
            for original, normalized in sorted(normalization_mapping.items()):
                writer.writerow([original, normalized])
    
    def get_report_stats(self) -> Dict[str, Any]:
        """Get report generation statistics"""
        return self.report_stats.copy()


# Import re module for pattern matching
import re
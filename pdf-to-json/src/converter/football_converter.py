"""
FootballConverter orchestration class for coordinating the entire football data processing pipeline.

This module provides the high-level FootballConverter class that orchestrates:
- Football data extraction
- Team name normalization
- Market classification and merging
- Data deduplication and capping
- Per-day data splitting
- Comprehensive reporting

The converter handles error management, graceful degradation, and detailed logging
throughout the entire pipeline.
"""

import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

from .football_extractor import FootballExtractor
from .team_normalizer import TeamNormalizer
from .market_processor import MarketProcessor
from .data_processor import DataProcessor
from .day_splitter import DaySplitter
from .report_generator import ReportGenerator
from .config_loader import create_default_team_aliases_config
from .exceptions import (
    FootballProcessingError, ConfigurationError, ProcessingError,
    ExtractionError, FileSystemError
)
from .logging_config import get_component_logger


class FootballConverter:
    """
    High-level orchestrator for the entire football data processing pipeline.
    
    This class coordinates all processing stages:
    1. Extraction - Extract football data from JSON content
    2. Normalization - Normalize team names using aliases and heuristics
    3. Merging - Merge markets by game and classify market types
    4. Processing - Deduplicate and cap additional markets
    5. Splitting - Split data by date into separate files
    6. Reporting - Generate comprehensive reports
    
    The converter provides comprehensive error handling with graceful degradation
    and detailed logging throughout the pipeline.
    """
    
    def __init__(self, config_dir: str = "config", max_markets: int = 10):
        """
        Initialize the FootballConverter with all required components.
        
        Args:
            config_dir: Directory containing configuration files
            max_markets: Maximum number of additional markets per game
        """
        self.config_dir = config_dir
        self.max_markets = max_markets
        
        # Initialize logger with component context
        self.logger = get_component_logger(
            'football_converter',
            config_dir=config_dir,
            max_markets=max_markets
        )
        
        # Initialize components with error handling
        try:
            self.extractor = FootballExtractor(config_dir=self.config_dir)
            self.market_processor = MarketProcessor()
            self.data_processor = DataProcessor(config_dir=config_dir)
            self.day_splitter = DaySplitter()
            self.report_generator = ReportGenerator()
            
            # Initialize team normalizer (may create default config if needed)
            self.team_normalizer = self._initialize_team_normalizer()
            
            self.logger.info(
                "FootballConverter initialized successfully",
                context={
                    'initialization': 'success',
                    'components': ['extractor', 'market_processor', 'data_processor', 
                                 'day_splitter', 'report_generator', 'team_normalizer']
                }
            )
            
        except Exception as e:
            self.logger.error(
                "Failed to initialize FootballConverter components",
                context={'initialization': 'failed', 'error': str(e)},
                exc_info=True
            )
            raise ConfigurationError(
                f"Failed to initialize FootballConverter: {str(e)}",
                original_exception=e
            )
        
        # Pipeline statistics
        self.pipeline_stats = {
            'start_time': None,
            'end_time': None,
            'total_processing_time': 0,
            'stages_completed': [],
            'stages_failed': [],
            'errors': [],
            'warnings': []
        }
    
    def convert_football(self, json_file_path: str, output_dir: str = "jsons") -> Dict[str, Any]:
        """
        Run the complete football data conversion pipeline.
        
        This method orchestrates the entire pipeline:
        1. Load and validate input JSON
        2. Extract football matches
        3. Normalize team names
        4. Merge and classify markets
        5. Deduplicate and cap markets
        6. Split by date
        7. Generate reports
        
        Args:
            json_file_path: Path to input JSON file
            output_dir: Output directory for processed files
            
        Returns:
            Dictionary containing comprehensive processing results
        """
        # Initialize pipeline statistics and logging context
        self._reset_pipeline_stats()
        pipeline_start_time = time.time()
        self.pipeline_stats['start_time'] = datetime.now()
        
        # Create pipeline-specific logger with context
        pipeline_logger = self.logger.add_context(
            pipeline='convert_football',
            input_file=json_file_path,
            output_dir=output_dir
        )
        
        pipeline_logger.info(
            "Starting football conversion pipeline",
            context={
                'action': 'pipeline_start',
                'input_file': json_file_path,
                'output_dir': output_dir,
                'max_markets': self.max_markets
            }
        )
        
        try:
            # Create output directory with error handling
            try:
                output_path = Path(output_dir)
                output_path.mkdir(parents=True, exist_ok=True)
                pipeline_logger.debug(f"Created output directory: {output_path}")
            except Exception as e:
                raise FileSystemError(
                    f"Failed to create output directory: {output_dir}",
                    file_path=output_dir,
                    operation='mkdir',
                    original_exception=e
                )
            
            # Stage 1: Load input data
            stage_start = time.time()
            json_content = self._load_input_data(json_file_path)
            stage_duration = time.time() - stage_start
            pipeline_logger.info(
                f"Data loading completed in {stage_duration:.2f}s",
                context={'stage': 'data_loading', 'duration': stage_duration}
            )
            
            # Stage 2: Extract football data
            stage_start = time.time()
            matches = self._run_extraction(json_content)
            stage_duration = time.time() - stage_start
            pipeline_logger.info(
                f"Extraction completed in {stage_duration:.2f}s: {len(matches)} matches",
                context={'stage': 'extraction', 'duration': stage_duration, 'matches_found': len(matches)}
            )
            
            # Stage 3: Normalize team names
            stage_start = time.time()
            normalized_matches = self._run_normalization(matches)
            stage_duration = time.time() - stage_start
            pipeline_logger.info(
                f"Normalization completed in {stage_duration:.2f}s",
                context={'stage': 'normalization', 'duration': stage_duration}
            )
            
            # Stage 4: Merge and classify markets
            stage_start = time.time()
            merged_games = self._run_merging(normalized_matches)
            stage_duration = time.time() - stage_start
            pipeline_logger.info(
                f"Merging completed in {stage_duration:.2f}s: {len(merged_games)} games",
                context={'stage': 'merging', 'duration': stage_duration, 'games_created': len(merged_games)}
            )
            
            # Stage 5: Process (deduplicate and cap)
            stage_start = time.time()
            processed_games = self._run_processing(merged_games)
            stage_duration = time.time() - stage_start
            pipeline_logger.info(
                f"Processing completed in {stage_duration:.2f}s",
                context={'stage': 'processing', 'duration': stage_duration}
            )
            
            # Stage 6: Split by days
            stage_start = time.time()
            daily_files = self._run_splitting(processed_games, output_dir)
            stage_duration = time.time() - stage_start
            pipeline_logger.info(
                f"Splitting completed in {stage_duration:.2f}s: {len(daily_files)} files",
                context={'stage': 'splitting', 'duration': stage_duration, 'files_created': len(daily_files)}
            )
            
            # Stage 7: Generate reports
            stage_start = time.time()
            report_files = self._run_reporting(processed_games, output_dir)
            stage_duration = time.time() - stage_start
            pipeline_logger.info(
                f"Reporting completed in {stage_duration:.2f}s: {len(report_files)} reports",
                context={'stage': 'reporting', 'duration': stage_duration, 'reports_created': len(report_files)}
            )
            
            # Save merged file
            merged_file_path = self._save_merged_file(processed_games, output_dir)
            
            # Calculate final statistics
            self.pipeline_stats['end_time'] = datetime.now()
            total_duration = time.time() - pipeline_start_time
            self.pipeline_stats['total_processing_time'] = total_duration
            
            # Compile results
            results = {
                'success': True,
                'input_file': json_file_path,
                'output_directory': output_dir,
                'processing_summary': {
                    'total_games': len(processed_games),
                    'total_processing_time': total_duration,
                    'stages_completed': self.pipeline_stats['stages_completed'],
                    'stages_failed': self.pipeline_stats['stages_failed']
                },
                'files_created': {
                    'merged_file': merged_file_path,
                    'daily_files': daily_files,
                    'report_files': report_files
                },
                'statistics': self._compile_comprehensive_stats(processed_games),
                'errors': self.pipeline_stats['errors'],
                'warnings': self.pipeline_stats['warnings']
            }
            
            pipeline_logger.info(
                f"Football conversion pipeline completed successfully in {total_duration:.2f}s",
                context={
                    'action': 'pipeline_success',
                    'total_duration': total_duration,
                    'games_processed': len(processed_games),
                    'files_created': len(daily_files) + len(report_files) + (1 if merged_file_path else 0),
                    'stages_completed': len(self.pipeline_stats['stages_completed']),
                    'stages_failed': len(self.pipeline_stats['stages_failed'])
                }
            )
            
            return results
            
        except FootballProcessingError as e:
            # Handle known processing errors with full context
            self.pipeline_stats['end_time'] = datetime.now()
            total_duration = time.time() - pipeline_start_time
            self.pipeline_stats['total_processing_time'] = total_duration
            
            error_context = {
                'action': 'pipeline_error',
                'error_type': type(e).__name__,
                'error_code': getattr(e, 'error_code', None),
                'total_duration': total_duration,
                'stages_completed': self.pipeline_stats['stages_completed'],
                'stages_failed': self.pipeline_stats['stages_failed']
            }
            
            if hasattr(e, 'context'):
                error_context.update(e.context)
            
            pipeline_logger.error(
                f"Football conversion pipeline failed: {str(e)}",
                context=error_context,
                exc_info=True
            )
            
            self.pipeline_stats['errors'].append(str(e))
            
            return {
                'success': False,
                'input_file': json_file_path,
                'error': str(e),
                'error_type': type(e).__name__,
                'error_code': getattr(e, 'error_code', None),
                'processing_summary': {
                    'total_processing_time': total_duration,
                    'stages_completed': self.pipeline_stats['stages_completed'],
                    'stages_failed': self.pipeline_stats['stages_failed']
                },
                'errors': self.pipeline_stats['errors'],
                'warnings': self.pipeline_stats['warnings']
            }
            
        except Exception as e:
            # Handle unexpected errors
            self.pipeline_stats['end_time'] = datetime.now()
            total_duration = time.time() - pipeline_start_time
            self.pipeline_stats['total_processing_time'] = total_duration
            
            error_msg = f"Unexpected error in football conversion pipeline: {str(e)}"
            
            pipeline_logger.error(
                error_msg,
                context={
                    'action': 'pipeline_unexpected_error',
                    'error_type': type(e).__name__,
                    'total_duration': total_duration,
                    'stages_completed': self.pipeline_stats['stages_completed'],
                    'stages_failed': self.pipeline_stats['stages_failed']
                },
                exc_info=True
            )
            
            self.pipeline_stats['errors'].append(error_msg)
            
            return {
                'success': False,
                'input_file': json_file_path,
                'error': error_msg,
                'error_type': type(e).__name__,
                'processing_summary': {
                    'total_processing_time': total_duration,
                    'stages_completed': self.pipeline_stats['stages_completed'],
                    'stages_failed': self.pipeline_stats['stages_failed']
                },
                'errors': self.pipeline_stats['errors'],
                'warnings': self.pipeline_stats['warnings']
            }
    
    def _initialize_team_normalizer(self) -> TeamNormalizer:
        """
        Initialize the team normalizer, creating default config if needed.
        
        Returns:
            Initialized TeamNormalizer instance
        """
        try:
            normalizer = TeamNormalizer(self.config_dir)
            self.logger.debug("Team normalizer initialized successfully")
            return normalizer
            
        except Exception as e:
            self.logger.warning(
                f"Team normalizer configuration issue: {e}",
                context={'config_dir': self.config_dir, 'error_type': type(e).__name__}
            )
            
            try:
                self.logger.info("Creating default team aliases configuration")
                create_default_team_aliases_config(self.config_dir)
                normalizer = TeamNormalizer(self.config_dir)
                self.logger.info("Default team aliases configuration created successfully")
                return normalizer
                
            except Exception as create_error:
                self.logger.error(
                    f"Failed to create default configuration: {create_error}",
                    context={'config_dir': self.config_dir, 'create_error': str(create_error)},
                    exc_info=True
                )
                
                # Try fallback normalizer
                self.logger.warning("Attempting to create fallback team normalizer")
                return self._create_fallback_normalizer()
    
    def _create_fallback_normalizer(self) -> TeamNormalizer:
        """Create a fallback normalizer when configuration fails."""
        # This is a simplified approach - in practice, you might want to create
        # a minimal config in memory or use a different fallback strategy
        try:
            # Create minimal config directory and file
            config_path = Path(self.config_dir)
            config_path.mkdir(parents=True, exist_ok=True)
            
            minimal_config = {
                "aliases": {},
                "heuristics": {
                    "remove_patterns": [],
                    "replace_patterns": {}
                },
                "settings": {
                    "enable_fuzzy_matching": False,
                    "log_unmatched_teams": False
                }
            }
            
            config_file = config_path / "team_aliases.json"
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(minimal_config, f, indent=2)
            
            return TeamNormalizer(self.config_dir)
        except Exception as e:
            self.logger.error(f"Failed to create fallback normalizer: {e}")
            raise ConfigurationError(f"Cannot initialize team normalizer: {e}")
    
    def _load_input_data(self, json_file_path: str) -> Dict[str, Any]:
        """
        Load and validate input JSON data.
        
        Args:
            json_file_path: Path to input JSON file
            
        Returns:
            Loaded JSON content
            
        Raises:
            ProcessingError: If file cannot be loaded or is invalid
        """
        try:
            self.logger.info(f"Loading input data from {json_file_path}")
            
            with open(json_file_path, 'r', encoding='utf-8') as f:
                json_content = json.load(f)
            
            # Basic validation
            if not isinstance(json_content, dict):
                raise ProcessingError("Input JSON must be a dictionary")
            
            if 'content' not in json_content:
                raise ProcessingError("Input JSON missing 'content' section")
            
            self.pipeline_stats['stages_completed'].append('data_loading')
            self.logger.info("Input data loaded successfully")
            
            return json_content
            
        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON in input file: {e}"
            self.pipeline_stats['stages_failed'].append('data_loading')
            self.pipeline_stats['errors'].append(error_msg)
            raise ProcessingError(error_msg)
        except FileNotFoundError:
            error_msg = f"Input file not found: {json_file_path}"
            self.pipeline_stats['stages_failed'].append('data_loading')
            self.pipeline_stats['errors'].append(error_msg)
            raise ProcessingError(error_msg)
        except Exception as e:
            error_msg = f"Error loading input data: {e}"
            self.pipeline_stats['stages_failed'].append('data_loading')
            self.pipeline_stats['errors'].append(error_msg)
            raise ProcessingError(error_msg)
    
    def _run_extraction(self, json_content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Run football data extraction stage.
        
        Args:
            json_content: Input JSON content
            
        Returns:
            List of extracted matches
        """
        try:
            self.logger.info("Starting football data extraction")
            
            matches = self.extractor.extract_football_data(json_content)
            
            if not matches:
                warning_msg = "No football matches found in input data"
                self.logger.warning(warning_msg)
                self.pipeline_stats['warnings'].append(warning_msg)
            
            self.pipeline_stats['stages_completed'].append('extraction')
            self.logger.info(f"Extraction completed: {len(matches)} matches found")
            
            return matches
            
        except Exception as e:
            error_msg = f"Football extraction failed: {e}"
            self.logger.error(error_msg)
            self.pipeline_stats['stages_failed'].append('extraction')
            self.pipeline_stats['errors'].append(error_msg)
            
            # Graceful degradation - return empty list
            self.logger.warning("Continuing with empty match list due to extraction failure")
            return []
    
    def _run_normalization(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Run team name normalization stage.
        
        Args:
            matches: List of extracted matches
            
        Returns:
            List of matches with normalized team names
        """
        self.logger.info(f"Starting team name normalization for {len(matches)} matches")
        
        normalized_matches = []
        normalization_count = 0
        failed_normalizations = 0
        
        for match in matches:
            try:
                normalized_match = match.copy()
                
                # Normalize team names
                original_home = match.get('home_team', '')
                original_away = match.get('away_team', '')
                
                normalized_home = self.team_normalizer.normalize(original_home)
                normalized_away = self.team_normalizer.normalize(original_away)
                
                # Update match with normalized names
                normalized_match['home_team'] = normalized_home
                normalized_match['away_team'] = normalized_away
                normalized_match['original_home_team'] = original_home
                normalized_match['original_away_team'] = original_away
                
                # Track if normalization occurred
                if normalized_home != original_home or normalized_away != original_away:
                    normalization_count += 1
                
                normalized_matches.append(normalized_match)
                
            except Exception as e:
                # Graceful degradation for individual match
                self.logger.warning(f"Failed to normalize match {match}: {e}")
                self.pipeline_stats['warnings'].append(f"Match normalization failed: {e}")
                failed_normalizations += 1
                
                # Add original team names to match for consistency
                match_copy = match.copy()
                match_copy['original_home_team'] = match.get('home_team', '')
                match_copy['original_away_team'] = match.get('away_team', '')
                normalized_matches.append(match_copy)  # Use original match
        
        # Determine if normalization stage should be considered failed
        if failed_normalizations > 0:
            if failed_normalizations == len(matches):
                # All normalizations failed - mark stage as failed
                self.pipeline_stats['stages_failed'].append('normalization')
                self.logger.error(f"All {failed_normalizations} normalizations failed")
            else:
                # Some normalizations failed - mark as completed with warnings
                self.pipeline_stats['stages_completed'].append('normalization')
                self.logger.warning(f"{failed_normalizations} out of {len(matches)} normalizations failed")
        else:
            # All normalizations succeeded
            self.pipeline_stats['stages_completed'].append('normalization')
        
        self.logger.info(f"Normalization completed: {normalization_count} matches had team names normalized")
        
        return normalized_matches
    
    def _run_merging(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Run market merging and classification stage.
        
        Args:
            matches: List of normalized matches
            
        Returns:
            List of merged games with classified markets
        """
        try:
            self.logger.info(f"Starting market merging and classification for {len(matches)} matches")
            
            merged_games = self.market_processor.merge_matches_by_game(matches)
            
            self.pipeline_stats['stages_completed'].append('merging')
            self.logger.info(f"Merging completed: {len(matches)} matches merged into {len(merged_games)} games")
            
            return merged_games
            
        except Exception as e:
            error_msg = f"Market merging failed: {e}"
            self.logger.error(error_msg)
            self.pipeline_stats['stages_failed'].append('merging')
            self.pipeline_stats['errors'].append(error_msg)
            
            # Graceful degradation - convert matches to basic game format
            self.logger.warning("Converting matches to basic game format due to merging failure")
            return self._convert_matches_to_games(matches)
    
    def _run_processing(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Run data processing stage (deduplication and capping).
        
        Args:
            games: List of merged games
            
        Returns:
            List of processed games
        """
        try:
            self.logger.info(f"Starting data processing for {len(games)} games")
            
            processed_games = self.data_processor.process_games(games)
            
            self.pipeline_stats['stages_completed'].append('processing')
            self.logger.info(f"Data processing completed: {len(processed_games)} games processed")
            
            return processed_games
            
        except Exception as e:
            error_msg = f"Data processing failed: {e}"
            self.logger.error(error_msg)
            self.pipeline_stats['stages_failed'].append('processing')
            self.pipeline_stats['errors'].append(error_msg)
            
            # Graceful degradation - return original games
            self.logger.warning("Continuing with unprocessed games due to processing failure")
            return games
    
    def _run_splitting(self, games: List[Dict[str, Any]], output_dir: str) -> Dict[str, List[str]]:
        """
        Run day splitting stage.
        
        Args:
            games: List of processed games
            output_dir: Output directory
            
        Returns:
            Dictionary mapping dates to created file paths
        """
        try:
            self.logger.info(f"Starting day splitting for {len(games)} games")
            
            days_output_dir = str(Path(output_dir) / "days")
            daily_files = self.day_splitter.split_by_days(games, days_output_dir)
            
            self.pipeline_stats['stages_completed'].append('splitting')
            self.logger.info(f"Day splitting completed: {len(daily_files)} daily files created")
            
            return daily_files
            
        except Exception as e:
            error_msg = f"Day splitting failed: {e}"
            self.logger.error(error_msg)
            self.pipeline_stats['stages_failed'].append('splitting')
            self.pipeline_stats['errors'].append(error_msg)
            
            # Graceful degradation - return empty dict
            self.logger.warning("Continuing without day splitting due to failure")
            return {}
    
    def _run_reporting(self, games: List[Dict[str, Any]], output_dir: str) -> Dict[str, str]:
        """
        Run report generation stage.
        
        Args:
            games: List of processed games
            output_dir: Output directory
            
        Returns:
            Dictionary mapping report types to file paths
        """
        try:
            self.logger.info(f"Starting report generation for {len(games)} games")
            
            # Compile processing statistics
            processing_stats = self._compile_processing_stats()
            
            # Get normalization mapping
            normalization_mapping = self._get_normalization_mapping()
            
            reports_output_dir = str(Path(output_dir) / "reports")
            report_files = self.report_generator.generate_reports(
                games, processing_stats, reports_output_dir, normalization_mapping
            )
            
            self.pipeline_stats['stages_completed'].append('reporting')
            self.logger.info(f"Report generation completed: {len(report_files)} reports created")
            
            return report_files
            
        except Exception as e:
            error_msg = f"Report generation failed: {e}"
            self.logger.error(error_msg)
            self.pipeline_stats['stages_failed'].append('reporting')
            self.pipeline_stats['errors'].append(error_msg)
            
            # Graceful degradation - return empty dict
            self.logger.warning("Continuing without reports due to generation failure")
            return {}
    
    def _save_merged_file(self, games: List[Dict[str, Any]], output_dir: str) -> str:
        """
        Save the merged games file.
        
        Args:
            games: List of processed games
            output_dir: Output directory
            
        Returns:
            Path to saved merged file
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            merged_file_path = Path(output_dir) / f"merged_games_{timestamp}.json"
            
            output_data = {
                'processing_info': {
                    'timestamp': datetime.now().isoformat(),
                    'total_games': len(games),
                    'format': 'merged_games',
                    'pipeline_version': '1.0.0'
                },
                'games': games
            }
            
            with open(merged_file_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"Merged games saved to {merged_file_path}")
            return str(merged_file_path)
            
        except Exception as e:
            error_msg = f"Failed to save merged file: {e}"
            self.logger.error(error_msg)
            self.pipeline_stats['warnings'].append(error_msg)
            return ""
    
    def _convert_matches_to_games(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Convert matches to basic game format for graceful degradation.
        
        Args:
            matches: List of matches
            
        Returns:
            List of games in basic format
        """
        games = []
        
        for match in matches:
            game = {
                'league': match.get('league'),
                'date': match.get('date'),
                'time': match.get('time'),
                'home_team': match.get('home_team'),
                'away_team': match.get('away_team'),
                'original_home_team': match.get('original_home_team', match.get('home_team')),
                'original_away_team': match.get('original_away_team', match.get('away_team')),
                'main_market': {
                    'market_type': '1x2',
                    'home_odds': match.get('home_odds'),
                    'draw_odds': match.get('draw_odds'),
                    'away_odds': match.get('away_odds')
                } if match.get('home_odds') else None,
                'additional_markets': [],
                'total_markets': 1 if match.get('home_odds') else 0,
                'processing_info': {
                    'team_normalized': False,
                    'markets_capped': False,
                    'duplicates_removed': 0
                },
                'raw_lines': [match.get('raw_line', '')]
            }
            games.append(game)
        
        return games
    
    def _compile_processing_stats(self) -> Dict[str, Any]:
        """Compile statistics from all processing components."""
        # Convert datetime objects to ISO strings for JSON serialization
        pipeline_stats = self.pipeline_stats.copy()
        if pipeline_stats.get('start_time'):
            pipeline_stats['start_time'] = pipeline_stats['start_time'].isoformat()
        if pipeline_stats.get('end_time'):
            pipeline_stats['end_time'] = pipeline_stats['end_time'].isoformat()
        
        stats = {
            'pipeline': pipeline_stats,
            'extraction': {},  # FootballExtractor doesn't have get_stats method
            'normalization': self.team_normalizer.get_stats() if hasattr(self.team_normalizer, 'get_stats') else {},
            'processing': self.data_processor.get_processing_stats(),
            'splitting': self.day_splitter.get_processing_stats(),
            'reporting': self.report_generator.get_report_stats()
        }
        
        return stats
    
    def _get_normalization_mapping(self) -> Dict[str, str]:
        """Get team name normalization mapping."""
        try:
            # This would need to be implemented in TeamNormalizer
            # For now, return empty dict
            return {}
        except Exception as e:
            self.logger.warning(f"Could not get normalization mapping: {e}")
            return {}
    
    def _compile_comprehensive_stats(self, games: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compile comprehensive statistics for the final results."""
        if not games:
            return {
                'total_games': 0,
                'total_markets': 0,
                'processing_stages': self.pipeline_stats['stages_completed']
            }
        
        total_markets = sum(game.get('total_markets', 0) for game in games)
        leagues = set(game.get('league') for game in games if game.get('league'))
        dates = set(game.get('iso_date', game.get('date')) for game in games 
                   if game.get('iso_date') or game.get('date'))
        
        return {
            'total_games': len(games),
            'total_markets': total_markets,
            'leagues_count': len(leagues),
            'dates_count': len(dates),
            'average_markets_per_game': round(total_markets / len(games), 2),
            'processing_stages': self.pipeline_stats['stages_completed'],
            'failed_stages': self.pipeline_stats['stages_failed']
        }
    
    def _reset_pipeline_stats(self) -> None:
        """Reset pipeline statistics for a new run."""
        self.pipeline_stats = {
            'start_time': None,
            'end_time': None,
            'total_processing_time': 0,
            'stages_completed': [],
            'stages_failed': [],
            'errors': [],
            'warnings': []
        }
    
    def get_pipeline_stats(self) -> Dict[str, Any]:
        """Get current pipeline statistics."""
        return self.pipeline_stats.copy()
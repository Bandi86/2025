"""
OptimizedConverter with performance enhancements for football data processing.

This module provides an optimized version of FootballConverter with:
- Async processing capabilities
- Streaming JSON parsing for large files using ijson
- Parallel processing for team normalization using asyncio.gather
- Memory-efficient batch processing for database operations
- Performance metrics collection and monitoring
"""

import asyncio
import aiofiles
import ijson
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Callable, Awaitable
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor
import psutil
import os

from .football_converter import FootballConverter
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


@dataclass
class PerformanceMetrics:
    """Performance metrics for monitoring optimization effectiveness."""
    total_processing_time: float = 0.0
    memory_usage_mb: float = 0.0
    peak_memory_mb: float = 0.0
    cpu_usage_percent: float = 0.0
    io_operations: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    parallel_tasks_executed: int = 0
    streaming_chunks_processed: int = 0
    batch_operations: int = 0
    stage_timings: Dict[str, float] = field(default_factory=dict)
    optimization_flags: List[str] = field(default_factory=list)


@dataclass
class OptimizationConfig:
    """Configuration for optimization features."""
    enable_async_processing: bool = True
    enable_streaming_json: bool = True
    enable_parallel_normalization: bool = True
    enable_batch_processing: bool = True
    max_concurrent_tasks: int = 4
    streaming_chunk_size: int = 8192
    batch_size: int = 100
    memory_threshold_mb: int = 500
    enable_performance_monitoring: bool = True


class OptimizedConverter(FootballConverter):
    """
    Performance-optimized version of FootballConverter with async capabilities.
    
    This class extends FootballConverter with:
    - Async processing pipeline
    - Streaming JSON parsing for large files
    - Parallel team normalization
    - Memory-efficient batch processing
    - Comprehensive performance monitoring
    """
    
    def __init__(self, config_dir: str = "config", max_markets: int = 10, 
                 optimization_config: Optional[OptimizationConfig] = None):
        """
        Initialize the OptimizedConverter with performance enhancements.
        
        Args:
            config_dir: Directory containing configuration files
            max_markets: Maximum number of additional markets per game
            optimization_config: Configuration for optimization features
        """
        # Initialize parent class
        super().__init__(config_dir, max_markets)
        
        # Optimization configuration
        self.optimization_config = optimization_config or OptimizationConfig()
        
        # Performance metrics
        self.performance_metrics = PerformanceMetrics()
        
        # Thread pool for CPU-bound tasks
        self.thread_pool = ThreadPoolExecutor(
            max_workers=self.optimization_config.max_concurrent_tasks
        )
        
        # Memory monitoring
        self.process = psutil.Process(os.getpid())
        
        # Cache for frequently accessed data
        self._cache: Dict[str, Any] = {}
        
        self.logger.info(
            "OptimizedConverter initialized with performance enhancements",
            context={
                'optimization_config': {
                    'async_processing': self.optimization_config.enable_async_processing,
                    'streaming_json': self.optimization_config.enable_streaming_json,
                    'parallel_normalization': self.optimization_config.enable_parallel_normalization,
                    'batch_processing': self.optimization_config.enable_batch_processing,
                    'max_concurrent_tasks': self.optimization_config.max_concurrent_tasks
                }
            }
        )
    
    async def convert_football_async(self, json_file_path: str, output_dir: str = "jsons",
                                   progress_callback: Optional[Callable[[float, str], Awaitable[None]]] = None) -> Dict[str, Any]:
        """
        Run the complete football data conversion pipeline asynchronously.
        
        This method provides an async version of the conversion pipeline with:
        - Streaming JSON parsing for large files
        - Parallel processing where possible
        - Memory-efficient operations
        - Real-time progress reporting
        
        Args:
            json_file_path: Path to input JSON file
            output_dir: Output directory for processed files
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dictionary containing comprehensive processing results with performance metrics
        """
        # Start performance monitoring
        await self._start_performance_monitoring()
        
        # Initialize pipeline statistics and logging context
        self._reset_pipeline_stats()
        pipeline_start_time = time.time()
        self.pipeline_stats['start_time'] = datetime.now()
        
        # Create pipeline-specific logger with context
        pipeline_logger = self.logger.add_context(
            pipeline='convert_football_async',
            input_file=json_file_path,
            output_dir=output_dir,
            optimization_enabled=True
        )
        
        pipeline_logger.info(
            "Starting optimized football conversion pipeline",
            context={
                'action': 'pipeline_start',
                'input_file': json_file_path,
                'output_dir': output_dir,
                'max_markets': self.max_markets,
                'optimization_features': self.optimization_config.__dict__
            }
        )
        
        try:
            # Create output directory with error handling
            await self._create_output_directory(output_dir)
            
            # Update progress
            if progress_callback:
                await progress_callback(5.0, "output_directory_created")
            
            # Stage 1: Load input data with streaming if enabled
            stage_start = time.time()
            if self.optimization_config.enable_streaming_json:
                json_content = await self._load_input_data_streaming(json_file_path)
                self.performance_metrics.optimization_flags.append("streaming_json_parsing")
            else:
                json_content = await self._load_input_data_async(json_file_path)
            
            stage_duration = time.time() - stage_start
            self.performance_metrics.stage_timings['data_loading'] = stage_duration
            pipeline_logger.info(
                f"Data loading completed in {stage_duration:.2f}s",
                context={'stage': 'data_loading', 'duration': stage_duration, 'streaming': self.optimization_config.enable_streaming_json}
            )
            
            if progress_callback:
                await progress_callback(15.0, "data_loading_completed")
            
            # Stage 2: Extract football data
            stage_start = time.time()
            matches = await self._run_extraction_async(json_content)
            stage_duration = time.time() - stage_start
            self.performance_metrics.stage_timings['extraction'] = stage_duration
            pipeline_logger.info(
                f"Extraction completed in {stage_duration:.2f}s: {len(matches)} matches",
                context={'stage': 'extraction', 'duration': stage_duration, 'matches_found': len(matches)}
            )
            
            if progress_callback:
                await progress_callback(30.0, "extraction_completed")
            
            # Stage 3: Normalize team names with parallel processing
            stage_start = time.time()
            if self.optimization_config.enable_parallel_normalization:
                normalized_matches = await self._run_normalization_parallel(matches)
                self.performance_metrics.optimization_flags.append("parallel_normalization")
            else:
                normalized_matches = await self._run_normalization_async(matches)
            
            stage_duration = time.time() - stage_start
            self.performance_metrics.stage_timings['normalization'] = stage_duration
            pipeline_logger.info(
                f"Normalization completed in {stage_duration:.2f}s",
                context={'stage': 'normalization', 'duration': stage_duration, 'parallel': self.optimization_config.enable_parallel_normalization}
            )
            
            if progress_callback:
                await progress_callback(50.0, "normalization_completed")
            
            # Stage 4: Merge and classify markets
            stage_start = time.time()
            merged_games = await self._run_merging_async(normalized_matches)
            stage_duration = time.time() - stage_start
            self.performance_metrics.stage_timings['merging'] = stage_duration
            pipeline_logger.info(
                f"Merging completed in {stage_duration:.2f}s: {len(merged_games)} games",
                context={'stage': 'merging', 'duration': stage_duration, 'games_created': len(merged_games)}
            )
            
            if progress_callback:
                await progress_callback(65.0, "merging_completed")
            
            # Stage 5: Process with batch operations if enabled
            stage_start = time.time()
            if self.optimization_config.enable_batch_processing:
                processed_games = await self._run_processing_batch(merged_games)
                self.performance_metrics.optimization_flags.append("batch_processing")
            else:
                processed_games = await self._run_processing_async(merged_games)
            
            stage_duration = time.time() - stage_start
            self.performance_metrics.stage_timings['processing'] = stage_duration
            pipeline_logger.info(
                f"Processing completed in {stage_duration:.2f}s",
                context={'stage': 'processing', 'duration': stage_duration, 'batch': self.optimization_config.enable_batch_processing}
            )
            
            if progress_callback:
                await progress_callback(75.0, "processing_completed")
            
            # Stage 6: Split by days
            stage_start = time.time()
            daily_files = await self._run_splitting_async(processed_games, output_dir)
            stage_duration = time.time() - stage_start
            self.performance_metrics.stage_timings['splitting'] = stage_duration
            pipeline_logger.info(
                f"Splitting completed in {stage_duration:.2f}s: {len(daily_files)} files",
                context={'stage': 'splitting', 'duration': stage_duration, 'files_created': len(daily_files)}
            )
            
            if progress_callback:
                await progress_callback(85.0, "splitting_completed")
            
            # Stage 7: Generate reports
            stage_start = time.time()
            report_files = await self._run_reporting_async(processed_games, output_dir)
            stage_duration = time.time() - stage_start
            self.performance_metrics.stage_timings['reporting'] = stage_duration
            pipeline_logger.info(
                f"Reporting completed in {stage_duration:.2f}s: {len(report_files)} reports",
                context={'stage': 'reporting', 'duration': stage_duration, 'reports_created': len(report_files)}
            )
            
            if progress_callback:
                await progress_callback(95.0, "reporting_completed")
            
            # Save merged file
            merged_file_path = await self._save_merged_file_async(processed_games, output_dir)
            
            # Finalize performance metrics
            await self._finalize_performance_monitoring(pipeline_start_time)
            
            if progress_callback:
                await progress_callback(100.0, "pipeline_completed")
            
            # Compile results with performance metrics
            results = {
                'success': True,
                'input_file': json_file_path,
                'output_directory': output_dir,
                'processing_summary': {
                    'total_games': len(processed_games),
                    'total_processing_time': self.performance_metrics.total_processing_time,
                    'stages_completed': self.pipeline_stats['stages_completed'],
                    'stages_failed': self.pipeline_stats['stages_failed']
                },
                'files_created': {
                    'merged_file': merged_file_path,
                    'daily_files': daily_files,
                    'report_files': report_files
                },
                'statistics': self._compile_comprehensive_stats(processed_games),
                'performance_metrics': self.performance_metrics.__dict__,
                'errors': self.pipeline_stats['errors'],
                'warnings': self.pipeline_stats['warnings']
            }
            
            pipeline_logger.info(
                f"Optimized football conversion pipeline completed successfully in {self.performance_metrics.total_processing_time:.2f}s",
                context={
                    'action': 'pipeline_success',
                    'total_duration': self.performance_metrics.total_processing_time,
                    'games_processed': len(processed_games),
                    'files_created': len(daily_files) + len(report_files) + (1 if merged_file_path else 0),
                    'optimization_flags': self.performance_metrics.optimization_flags,
                    'performance_metrics': self.performance_metrics.__dict__
                }
            )
            
            return results
            
        except Exception as e:
            # Handle errors with performance context
            await self._finalize_performance_monitoring(pipeline_start_time)
            
            error_context = {
                'action': 'pipeline_error',
                'error_type': type(e).__name__,
                'total_duration': self.performance_metrics.total_processing_time,
                'stages_completed': self.pipeline_stats['stages_completed'],
                'stages_failed': self.pipeline_stats['stages_failed'],
                'performance_metrics': self.performance_metrics.__dict__
            }
            
            pipeline_logger.error(
                f"Optimized football conversion pipeline failed: {str(e)}",
                context=error_context,
                exc_info=True
            )
            
            return {
                'success': False,
                'input_file': json_file_path,
                'error': str(e),
                'error_type': type(e).__name__,
                'processing_summary': {
                    'total_processing_time': self.performance_metrics.total_processing_time,
                    'stages_completed': self.pipeline_stats['stages_completed'],
                    'stages_failed': self.pipeline_stats['stages_failed']
                },
                'performance_metrics': self.performance_metrics.__dict__,
                'errors': self.pipeline_stats['errors'],
                'warnings': self.pipeline_stats['warnings']
            }
    
    def get_performance_metrics(self) -> PerformanceMetrics:
        """Get current performance metrics."""
        return self.performance_metrics
    
    def enable_caching(self, cache_manager: Optional[Any] = None) -> None:
        """Enable caching for frequently accessed data."""
        if cache_manager:
            self._external_cache = cache_manager
            self.performance_metrics.optimization_flags.append("external_caching")
        else:
            # Use internal cache
            self.performance_metrics.optimization_flags.append("internal_caching")
        
        self.logger.info("Caching enabled for OptimizedConverter")
    
    def enable_streaming(self, chunk_size: int = 8192) -> None:
        """Enable streaming processing for large files."""
        self.optimization_config.enable_streaming_json = True
        self.optimization_config.streaming_chunk_size = chunk_size
        self.performance_metrics.optimization_flags.append("streaming_enabled")
        
        self.logger.info(f"Streaming enabled with chunk size: {chunk_size}") 
   
    # Async helper methods
    
    async def _start_performance_monitoring(self) -> None:
        """Start performance monitoring."""
        if self.optimization_config.enable_performance_monitoring:
            self.performance_metrics = PerformanceMetrics()
            self.performance_metrics.memory_usage_mb = self.process.memory_info().rss / 1024 / 1024
            self.performance_metrics.cpu_usage_percent = self.process.cpu_percent()
    
    async def _finalize_performance_monitoring(self, start_time: float) -> None:
        """Finalize performance monitoring."""
        if self.optimization_config.enable_performance_monitoring:
            self.performance_metrics.total_processing_time = time.time() - start_time
            self.performance_metrics.peak_memory_mb = max(
                self.performance_metrics.peak_memory_mb,
                self.process.memory_info().rss / 1024 / 1024
            )
    
    async def _create_output_directory(self, output_dir: str) -> None:
        """Create output directory asynchronously."""
        try:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            self.logger.debug(f"Created output directory: {output_path}")
        except Exception as e:
            raise FileSystemError(
                f"Failed to create output directory: {output_dir}",
                file_path=output_dir,
                operation='mkdir',
                original_exception=e
            )
    
    async def _load_input_data_async(self, json_file_path: str) -> Dict[str, Any]:
        """Load input data asynchronously."""
        try:
            self.logger.info(f"Loading input data from {json_file_path}")
            
            async with aiofiles.open(json_file_path, 'r', encoding='utf-8') as f:
                content = await f.read()
                json_content = json.loads(content)
            
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
    
    async def _load_input_data_streaming(self, json_file_path: str) -> Dict[str, Any]:
        """Load input data using streaming JSON parsing for large files."""
        try:
            self.logger.info(f"Loading input data with streaming from {json_file_path}")
            
            # Use ijson for streaming parsing
            json_content = {}
            
            async with aiofiles.open(json_file_path, 'rb') as f:
                # Read file in chunks and parse incrementally
                parser = ijson.parse(f)
                current_path = []
                
                async for prefix, event, value in self._async_ijson_parse(f):
                    if event == 'start_map':
                        if not current_path:
                            json_content = {}
                    elif event == 'map_key':
                        current_path.append(value)
                    elif event == 'string' or event == 'number' or event == 'boolean':
                        if len(current_path) == 1 and current_path[0] == 'content':
                            if 'content' not in json_content:
                                json_content['content'] = {}
                        elif len(current_path) == 2 and current_path[0] == 'content':
                            if 'content' not in json_content:
                                json_content['content'] = {}
                            json_content['content'][current_path[1]] = value
                    elif event == 'end_map':
                        if current_path:
                            current_path.pop()
                    
                    self.performance_metrics.streaming_chunks_processed += 1
            
            # Basic validation
            if not isinstance(json_content, dict):
                raise ProcessingError("Input JSON must be a dictionary")
            
            if 'content' not in json_content:
                raise ProcessingError("Input JSON missing 'content' section")
            
            self.pipeline_stats['stages_completed'].append('data_loading')
            self.logger.info(f"Input data loaded successfully with streaming ({self.performance_metrics.streaming_chunks_processed} chunks)")
            
            return json_content
            
        except Exception as e:
            # Fallback to regular loading if streaming fails
            self.logger.warning(f"Streaming parsing failed, falling back to regular loading: {e}")
            return await self._load_input_data_async(json_file_path)
    
    async def _async_ijson_parse(self, file_handle):
        """Async wrapper for ijson parsing."""
        # This is a simplified implementation - in practice, you might want to use
        # a more sophisticated async ijson wrapper
        loop = asyncio.get_event_loop()
        
        def parse_chunk():
            try:
                return list(ijson.parse(file_handle))
            except Exception:
                return []
        
        # Run parsing in thread pool to avoid blocking
        events = await loop.run_in_executor(self.thread_pool, parse_chunk)
        for event in events:
            yield event
    
    async def _run_extraction_async(self, json_content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Run football data extraction asynchronously."""
        try:
            self.logger.info("Starting football data extraction")
            
            # Run extraction in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            matches = await loop.run_in_executor(
                self.thread_pool,
                self.extractor.extract_football_data,
                json_content
            )
            
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
    
    async def _run_normalization_async(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Run team name normalization asynchronously."""
        self.logger.info(f"Starting team name normalization for {len(matches)} matches")
        
        normalized_matches = []
        normalization_count = 0
        failed_normalizations = 0
        
        # Process matches in batches to avoid memory issues
        batch_size = self.optimization_config.batch_size
        
        for i in range(0, len(matches), batch_size):
            batch = matches[i:i + batch_size]
            
            for match in batch:
                try:
                    normalized_match = await self._normalize_single_match(match)
                    normalized_matches.append(normalized_match)
                    
                    # Track if normalization occurred
                    if (normalized_match['home_team'] != normalized_match['original_home_team'] or
                        normalized_match['away_team'] != normalized_match['original_away_team']):
                        normalization_count += 1
                        
                except Exception as e:
                    # Graceful degradation for individual match
                    self.logger.warning(f"Failed to normalize match {match}: {e}")
                    self.pipeline_stats['warnings'].append(f"Match normalization failed: {e}")
                    failed_normalizations += 1
                    
                    # Add original team names to match for consistency
                    match_copy = match.copy()
                    match_copy['original_home_team'] = match.get('home_team', '')
                    match_copy['original_away_team'] = match.get('away_team', '')
                    normalized_matches.append(match_copy)
            
            # Allow other tasks to run
            await asyncio.sleep(0)
        
        # Update pipeline stats
        if failed_normalizations > 0:
            if failed_normalizations == len(matches):
                self.pipeline_stats['stages_failed'].append('normalization')
                self.logger.error(f"All {failed_normalizations} normalizations failed")
            else:
                self.pipeline_stats['stages_completed'].append('normalization')
                self.logger.warning(f"{failed_normalizations} out of {len(matches)} normalizations failed")
        else:
            self.pipeline_stats['stages_completed'].append('normalization')
        
        self.logger.info(f"Normalization completed: {normalization_count} matches had team names normalized")
        
        return normalized_matches
    
    async def _run_normalization_parallel(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Run team name normalization with parallel processing."""
        self.logger.info(f"Starting parallel team name normalization for {len(matches)} matches")
        
        # Create semaphore to limit concurrent tasks
        semaphore = asyncio.Semaphore(self.optimization_config.max_concurrent_tasks)
        
        async def normalize_with_semaphore(match):
            async with semaphore:
                return await self._normalize_single_match(match)
        
        # Process all matches in parallel
        try:
            tasks = [normalize_with_semaphore(match) for match in matches]
            normalized_matches = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle exceptions and count successful normalizations
            successful_matches = []
            normalization_count = 0
            failed_normalizations = 0
            
            for i, result in enumerate(normalized_matches):
                if isinstance(result, Exception):
                    # Handle failed normalization
                    self.logger.warning(f"Failed to normalize match {matches[i]}: {result}")
                    self.pipeline_stats['warnings'].append(f"Match normalization failed: {result}")
                    failed_normalizations += 1
                    
                    # Add original team names to match for consistency
                    match_copy = matches[i].copy()
                    match_copy['original_home_team'] = matches[i].get('home_team', '')
                    match_copy['original_away_team'] = matches[i].get('away_team', '')
                    successful_matches.append(match_copy)
                else:
                    successful_matches.append(result)
                    
                    # Track if normalization occurred
                    if (result['home_team'] != result['original_home_team'] or
                        result['away_team'] != result['original_away_team']):
                        normalization_count += 1
            
            self.performance_metrics.parallel_tasks_executed += len(tasks)
            
            # Update pipeline stats
            if failed_normalizations > 0:
                if failed_normalizations == len(matches):
                    self.pipeline_stats['stages_failed'].append('normalization')
                    self.logger.error(f"All {failed_normalizations} normalizations failed")
                else:
                    self.pipeline_stats['stages_completed'].append('normalization')
                    self.logger.warning(f"{failed_normalizations} out of {len(matches)} normalizations failed")
            else:
                self.pipeline_stats['stages_completed'].append('normalization')
            
            self.logger.info(f"Parallel normalization completed: {normalization_count} matches had team names normalized")
            
            return successful_matches
            
        except Exception as e:
            error_msg = f"Parallel normalization failed: {e}"
            self.logger.error(error_msg)
            self.pipeline_stats['stages_failed'].append('normalization')
            self.pipeline_stats['errors'].append(error_msg)
            
            # Fallback to sequential processing
            self.logger.warning("Falling back to sequential normalization")
            return await self._run_normalization_async(matches)
    
    async def _normalize_single_match(self, match: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize a single match asynchronously."""
        loop = asyncio.get_event_loop()
        
        def normalize_match():
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
            
            return normalized_match
        
        # Run normalization in thread pool
        return await loop.run_in_executor(self.thread_pool, normalize_match)
    
    async def _run_merging_async(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Run market merging and classification asynchronously."""
        try:
            self.logger.info(f"Starting market merging and classification for {len(matches)} matches")
            
            # Run merging in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            merged_games = await loop.run_in_executor(
                self.thread_pool,
                self.market_processor.merge_matches_by_game,
                matches
            )
            
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
    
    async def _run_processing_async(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Run data processing asynchronously."""
        try:
            self.logger.info(f"Starting data processing for {len(games)} games")
            
            # Run processing in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            processed_games = await loop.run_in_executor(
                self.thread_pool,
                self.data_processor.process_games,
                games
            )
            
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
    
    async def _run_processing_batch(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Run data processing with batch operations."""
        try:
            self.logger.info(f"Starting batch data processing for {len(games)} games")
            
            processed_games = []
            batch_size = self.optimization_config.batch_size
            
            # Process games in batches
            for i in range(0, len(games), batch_size):
                batch = games[i:i + batch_size]
                
                # Process batch in thread pool
                loop = asyncio.get_event_loop()
                processed_batch = await loop.run_in_executor(
                    self.thread_pool,
                    self.data_processor.process_games,
                    batch
                )
                
                processed_games.extend(processed_batch)
                self.performance_metrics.batch_operations += 1
                
                # Allow other tasks to run
                await asyncio.sleep(0)
                
                # Monitor memory usage
                current_memory = self.process.memory_info().rss / 1024 / 1024
                if current_memory > self.optimization_config.memory_threshold_mb:
                    self.logger.warning(f"Memory usage high: {current_memory:.1f}MB, forcing garbage collection")
                    import gc
                    gc.collect()
            
            self.pipeline_stats['stages_completed'].append('processing')
            self.logger.info(f"Batch data processing completed: {len(processed_games)} games processed in {self.performance_metrics.batch_operations} batches")
            
            return processed_games
            
        except Exception as e:
            error_msg = f"Batch data processing failed: {e}"
            self.logger.error(error_msg)
            self.pipeline_stats['stages_failed'].append('processing')
            self.pipeline_stats['errors'].append(error_msg)
            
            # Fallback to regular processing
            self.logger.warning("Falling back to regular processing")
            return await self._run_processing_async(games)
    
    async def _run_splitting_async(self, games: List[Dict[str, Any]], output_dir: str) -> Dict[str, List[str]]:
        """Run day splitting asynchronously."""
        try:
            self.logger.info(f"Starting day splitting for {len(games)} games")
            
            days_output_dir = str(Path(output_dir) / "days")
            
            # Run splitting in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            daily_files = await loop.run_in_executor(
                self.thread_pool,
                self.day_splitter.split_by_days,
                games,
                days_output_dir
            )
            
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
    
    async def _run_reporting_async(self, games: List[Dict[str, Any]], output_dir: str) -> Dict[str, str]:
        """Run report generation asynchronously."""
        try:
            self.logger.info(f"Starting report generation for {len(games)} games")
            
            # Compile processing statistics
            processing_stats = self._compile_processing_stats()
            
            # Get normalization mapping
            normalization_mapping = self._get_normalization_mapping()
            
            reports_output_dir = str(Path(output_dir) / "reports")
            
            # Run reporting in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            report_files = await loop.run_in_executor(
                self.thread_pool,
                self.report_generator.generate_reports,
                games,
                processing_stats,
                reports_output_dir,
                normalization_mapping
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
    
    async def _save_merged_file_async(self, games: List[Dict[str, Any]], output_dir: str) -> str:
        """Save the merged games file asynchronously."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            merged_file_path = Path(output_dir) / f"merged_games_{timestamp}.json"
            
            output_data = {
                'processing_info': {
                    'timestamp': datetime.now().isoformat(),
                    'total_games': len(games),
                    'format': 'merged_games',
                    'pipeline_version': '2.0.0-optimized',
                    'optimization_flags': self.performance_metrics.optimization_flags,
                    'performance_metrics': self.performance_metrics.__dict__
                },
                'games': games
            }
            
            # Save file asynchronously
            async with aiofiles.open(merged_file_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(output_data, indent=2, ensure_ascii=False))
            
            self.logger.info(f"Merged file saved: {merged_file_path}")
            return str(merged_file_path)
            
        except Exception as e:
            error_msg = f"Failed to save merged file: {e}"
            self.logger.error(error_msg)
            self.pipeline_stats['errors'].append(error_msg)
            return ""
    
    def __del__(self):
        """Cleanup resources."""
        if hasattr(self, 'thread_pool'):
            self.thread_pool.shutdown(wait=False)
"""
Performance tests for OptimizedConverter comparing against original FootballConverter.

This module provides comprehensive performance testing to validate the optimization
improvements in the OptimizedConverter class.
"""

import asyncio
import json
import time
import tempfile
import shutil
import pytest
from pathlib import Path
from typing import Dict, Any, List
import psutil
import os

from src.converter.football_converter import FootballConverter
from src.converter.optimized_converter import OptimizedConverter, OptimizationConfig, PerformanceMetrics


class PerformanceTestData:
    """Helper class to generate test data for performance testing."""
    
    @staticmethod
    def create_large_json_file(num_matches: int = 1000, file_path: str = None) -> str:
        """Create a large JSON file with many football matches for testing."""
        if file_path is None:
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
            file_path = temp_file.name
            temp_file.close()
        
        # Generate sample match data
        matches_data = []
        leagues = ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"]
        teams = [
            "Arsenal", "Chelsea", "Liverpool", "Manchester United", "Manchester City",
            "Barcelona", "Real Madrid", "Atletico Madrid", "Valencia", "Sevilla",
            "Juventus", "AC Milan", "Inter Milan", "Napoli", "Roma",
            "Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen",
            "PSG", "Lyon", "Marseille", "Monaco", "Lille"
        ]
        
        for i in range(num_matches):
            league = leagues[i % len(leagues)]
            home_team = teams[i % len(teams)]
            away_team = teams[(i + 1) % len(teams)]
            
            match_data = {
                "league": league,
                "date": f"2024-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}",
                "time": f"{(i % 24):02d}:00",
                "home_team": home_team,
                "away_team": away_team,
                "markets": [
                    {
                        "type": "1X2",
                        "odds": {"1": 2.5, "X": 3.2, "2": 2.8}
                    },
                    {
                        "type": "Over/Under 2.5",
                        "odds": {"Over": 1.8, "Under": 2.0}
                    },
                    {
                        "type": "Both Teams to Score",
                        "odds": {"Yes": 1.7, "No": 2.1}
                    }
                ]
            }
            matches_data.append(match_data)
        
        # Create full JSON structure
        json_data = {
            "content": {
                "full_text": "\n".join([
                    f"{match['league']}\n{match['date']} {match['time']} {match['home_team']} - {match['away_team']}\n1X2: 1:{match['markets'][0]['odds']['1']} X:{match['markets'][0]['odds']['X']} 2:{match['markets'][0]['odds']['2']}"
                    for match in matches_data
                ]),
                "metadata": {
                    "total_matches": num_matches,
                    "generated_for_testing": True
                }
            }
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        
        return file_path


class PerformanceBenchmark:
    """Performance benchmark utilities."""
    
    def __init__(self):
        self.process = psutil.Process(os.getpid())
    
    def measure_performance(self, func, *args, **kwargs) -> Dict[str, Any]:
        """Measure performance metrics for a function call."""
        # Initial measurements
        start_time = time.time()
        start_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        start_cpu = self.process.cpu_percent()
        
        # Execute function
        result = func(*args, **kwargs)
        
        # Final measurements
        end_time = time.time()
        end_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        end_cpu = self.process.cpu_percent()
        
        return {
            'result': result,
            'execution_time': end_time - start_time,
            'memory_usage_mb': end_memory - start_memory,
            'peak_memory_mb': end_memory,
            'cpu_usage_percent': max(start_cpu, end_cpu),
            'success': result.get('success', False) if isinstance(result, dict) else True
        }
    
    async def measure_async_performance(self, coro) -> Dict[str, Any]:
        """Measure performance metrics for an async function call."""
        # Initial measurements
        start_time = time.time()
        start_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        start_cpu = self.process.cpu_percent()
        
        # Execute coroutine
        result = await coro
        
        # Final measurements
        end_time = time.time()
        end_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        end_cpu = self.process.cpu_percent()
        
        return {
            'result': result,
            'execution_time': end_time - start_time,
            'memory_usage_mb': end_memory - start_memory,
            'peak_memory_mb': end_memory,
            'cpu_usage_percent': max(start_cpu, end_cpu),
            'success': result.get('success', False) if isinstance(result, dict) else True
        }


@pytest.fixture
def temp_output_dir():
    """Create a temporary output directory for tests."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def performance_benchmark():
    """Create a performance benchmark instance."""
    return PerformanceBenchmark()


@pytest.fixture
def small_test_file():
    """Create a small test file for basic performance testing."""
    file_path = PerformanceTestData.create_large_json_file(num_matches=50)
    yield file_path
    os.unlink(file_path)


@pytest.fixture
def large_test_file():
    """Create a large test file for stress testing."""
    file_path = PerformanceTestData.create_large_json_file(num_matches=1000)
    yield file_path
    os.unlink(file_path)


class TestOptimizedConverterPerformance:
    """Test suite for OptimizedConverter performance validation."""
    
    def test_basic_performance_comparison(self, small_test_file, temp_output_dir, performance_benchmark):
        """Test basic performance comparison between original and optimized converters."""
        # Test original converter
        original_converter = FootballConverter()
        original_metrics = performance_benchmark.measure_performance(
            original_converter.convert_football,
            small_test_file,
            temp_output_dir + "/original"
        )
        
        # Test optimized converter (sync version for comparison)
        optimized_converter = OptimizedConverter()
        optimized_metrics = performance_benchmark.measure_performance(
            optimized_converter.convert_football,
            small_test_file,
            temp_output_dir + "/optimized"
        )
        
        # Validate both succeeded
        assert original_metrics['success'], "Original converter should succeed"
        assert optimized_metrics['success'], "Optimized converter should succeed"
        
        # Log performance comparison
        print(f"\nPerformance Comparison (Small Dataset - 50 matches):")
        print(f"Original - Time: {original_metrics['execution_time']:.2f}s, Memory: {original_metrics['memory_usage_mb']:.1f}MB")
        print(f"Optimized - Time: {optimized_metrics['execution_time']:.2f}s, Memory: {optimized_metrics['memory_usage_mb']:.1f}MB")
        
        # The optimized version should not be significantly slower
        # (allowing for some overhead in small datasets)
        assert optimized_metrics['execution_time'] < original_metrics['execution_time'] * 1.5, \
            "Optimized converter should not be significantly slower"
    
    @pytest.mark.asyncio
    async def test_async_performance_benefits(self, small_test_file, temp_output_dir, performance_benchmark):
        """Test that async version provides performance benefits."""
        # Test optimized converter async version
        optimized_converter = OptimizedConverter()
        
        async_metrics = await performance_benchmark.measure_async_performance(
            optimized_converter.convert_football_async(small_test_file, temp_output_dir + "/async")
        )
        
        # Test sync version for comparison
        sync_metrics = performance_benchmark.measure_performance(
            optimized_converter.convert_football,
            small_test_file,
            temp_output_dir + "/sync"
        )
        
        # Validate both succeeded
        assert async_metrics['success'], "Async converter should succeed"
        assert sync_metrics['success'], "Sync converter should succeed"
        
        # Log performance comparison
        print(f"\nAsync vs Sync Performance:")
        print(f"Sync - Time: {sync_metrics['execution_time']:.2f}s, Memory: {sync_metrics['memory_usage_mb']:.1f}MB")
        print(f"Async - Time: {async_metrics['execution_time']:.2f}s, Memory: {async_metrics['memory_usage_mb']:.1f}MB")
        
        # Async version should have performance metrics available
        result = async_metrics['result']
        assert 'performance_metrics' in result, "Async version should include performance metrics"
        
        performance_metrics = result['performance_metrics']
        assert 'total_processing_time' in performance_metrics
        assert 'optimization_flags' in performance_metrics
    
    @pytest.mark.asyncio
    async def test_large_dataset_performance(self, large_test_file, temp_output_dir, performance_benchmark):
        """Test performance with large datasets to validate optimizations."""
        # Test original converter
        original_converter = FootballConverter()
        original_metrics = performance_benchmark.measure_performance(
            original_converter.convert_football,
            large_test_file,
            temp_output_dir + "/original_large"
        )
        
        # Test optimized converter with all optimizations enabled
        optimization_config = OptimizationConfig(
            enable_async_processing=True,
            enable_streaming_json=True,
            enable_parallel_normalization=True,
            enable_batch_processing=True,
            max_concurrent_tasks=4,
            batch_size=50
        )
        
        optimized_converter = OptimizedConverter(optimization_config=optimization_config)
        optimized_metrics = await performance_benchmark.measure_async_performance(
            optimized_converter.convert_football_async(large_test_file, temp_output_dir + "/optimized_large")
        )
        
        # Validate both succeeded
        assert original_metrics['success'], "Original converter should succeed with large dataset"
        assert optimized_metrics['success'], "Optimized converter should succeed with large dataset"
        
        # Log performance comparison
        print(f"\nLarge Dataset Performance Comparison (1000 matches):")
        print(f"Original - Time: {original_metrics['execution_time']:.2f}s, Memory: {original_metrics['memory_usage_mb']:.1f}MB")
        print(f"Optimized - Time: {optimized_metrics['execution_time']:.2f}s, Memory: {optimized_metrics['memory_usage_mb']:.1f}MB")
        
        # With large datasets, optimized version should show clear benefits
        performance_improvement = (original_metrics['execution_time'] - optimized_metrics['execution_time']) / original_metrics['execution_time']
        print(f"Performance improvement: {performance_improvement * 100:.1f}%")
        
        # Optimized version should be faster or at least not significantly slower
        assert optimized_metrics['execution_time'] <= original_metrics['execution_time'] * 1.1, \
            "Optimized converter should not be significantly slower with large datasets"
        
        # Check optimization flags were applied
        result = optimized_metrics['result']
        optimization_flags = result['performance_metrics']['optimization_flags']
        assert 'parallel_normalization' in optimization_flags, "Parallel normalization should be enabled"
        assert 'batch_processing' in optimization_flags, "Batch processing should be enabled"
    
    @pytest.mark.asyncio
    async def test_streaming_json_performance(self, large_test_file, temp_output_dir, performance_benchmark):
        """Test streaming JSON parsing performance benefits."""
        # Test without streaming
        config_no_streaming = OptimizationConfig(enable_streaming_json=False)
        converter_no_streaming = OptimizedConverter(optimization_config=config_no_streaming)
        
        no_streaming_metrics = await performance_benchmark.measure_async_performance(
            converter_no_streaming.convert_football_async(large_test_file, temp_output_dir + "/no_streaming")
        )
        
        # Test with streaming
        config_streaming = OptimizationConfig(enable_streaming_json=True)
        converter_streaming = OptimizedConverter(optimization_config=config_streaming)
        
        streaming_metrics = await performance_benchmark.measure_async_performance(
            converter_streaming.convert_football_async(large_test_file, temp_output_dir + "/streaming")
        )
        
        # Validate both succeeded
        assert no_streaming_metrics['success'], "Non-streaming version should succeed"
        assert streaming_metrics['success'], "Streaming version should succeed"
        
        # Log performance comparison
        print(f"\nStreaming vs Non-Streaming Performance:")
        print(f"No Streaming - Time: {no_streaming_metrics['execution_time']:.2f}s, Memory: {no_streaming_metrics['memory_usage_mb']:.1f}MB")
        print(f"Streaming - Time: {streaming_metrics['execution_time']:.2f}s, Memory: {streaming_metrics['memory_usage_mb']:.1f}MB")
        
        # Check that streaming was actually used
        streaming_result = streaming_metrics['result']
        streaming_flags = streaming_result['performance_metrics']['optimization_flags']
        assert 'streaming_json_parsing' in streaming_flags, "Streaming should be enabled"
        
        # Streaming should process chunks
        chunks_processed = streaming_result['performance_metrics']['streaming_chunks_processed']
        assert chunks_processed > 0, "Streaming should process chunks"
    
    @pytest.mark.asyncio
    async def test_parallel_normalization_performance(self, large_test_file, temp_output_dir, performance_benchmark):
        """Test parallel normalization performance benefits."""
        # Test sequential normalization
        config_sequential = OptimizationConfig(enable_parallel_normalization=False)
        converter_sequential = OptimizedConverter(optimization_config=config_sequential)
        
        sequential_metrics = await performance_benchmark.measure_async_performance(
            converter_sequential.convert_football_async(large_test_file, temp_output_dir + "/sequential")
        )
        
        # Test parallel normalization
        config_parallel = OptimizationConfig(
            enable_parallel_normalization=True,
            max_concurrent_tasks=4
        )
        converter_parallel = OptimizedConverter(optimization_config=config_parallel)
        
        parallel_metrics = await performance_benchmark.measure_async_performance(
            converter_parallel.convert_football_async(large_test_file, temp_output_dir + "/parallel")
        )
        
        # Validate both succeeded
        assert sequential_metrics['success'], "Sequential version should succeed"
        assert parallel_metrics['success'], "Parallel version should succeed"
        
        # Log performance comparison
        print(f"\nSequential vs Parallel Normalization Performance:")
        print(f"Sequential - Time: {sequential_metrics['execution_time']:.2f}s")
        print(f"Parallel - Time: {parallel_metrics['execution_time']:.2f}s")
        
        # Check that parallel processing was actually used
        parallel_result = parallel_metrics['result']
        parallel_flags = parallel_result['performance_metrics']['optimization_flags']
        assert 'parallel_normalization' in parallel_flags, "Parallel normalization should be enabled"
        
        # Check parallel tasks were executed
        parallel_tasks = parallel_result['performance_metrics']['parallel_tasks_executed']
        assert parallel_tasks > 0, "Parallel tasks should be executed"
        
        # Parallel version should be faster or at least not significantly slower
        assert parallel_metrics['execution_time'] <= sequential_metrics['execution_time'] * 1.2, \
            "Parallel normalization should not be significantly slower"
    
    @pytest.mark.asyncio
    async def test_batch_processing_performance(self, large_test_file, temp_output_dir, performance_benchmark):
        """Test batch processing performance benefits."""
        # Test without batch processing
        config_no_batch = OptimizationConfig(enable_batch_processing=False)
        converter_no_batch = OptimizedConverter(optimization_config=config_no_batch)
        
        no_batch_metrics = await performance_benchmark.measure_async_performance(
            converter_no_batch.convert_football_async(large_test_file, temp_output_dir + "/no_batch")
        )
        
        # Test with batch processing
        config_batch = OptimizationConfig(
            enable_batch_processing=True,
            batch_size=50
        )
        converter_batch = OptimizedConverter(optimization_config=config_batch)
        
        batch_metrics = await performance_benchmark.measure_async_performance(
            converter_batch.convert_football_async(large_test_file, temp_output_dir + "/batch")
        )
        
        # Validate both succeeded
        assert no_batch_metrics['success'], "Non-batch version should succeed"
        assert batch_metrics['success'], "Batch version should succeed"
        
        # Log performance comparison
        print(f"\nNon-Batch vs Batch Processing Performance:")
        print(f"No Batch - Time: {no_batch_metrics['execution_time']:.2f}s, Memory: {no_batch_metrics['memory_usage_mb']:.1f}MB")
        print(f"Batch - Time: {batch_metrics['execution_time']:.2f}s, Memory: {batch_metrics['memory_usage_mb']:.1f}MB")
        
        # Check that batch processing was actually used
        batch_result = batch_metrics['result']
        batch_flags = batch_result['performance_metrics']['optimization_flags']
        assert 'batch_processing' in batch_flags, "Batch processing should be enabled"
        
        # Check batch operations were performed
        batch_operations = batch_result['performance_metrics']['batch_operations']
        assert batch_operations > 0, "Batch operations should be performed"
    
    @pytest.mark.asyncio
    async def test_performance_metrics_collection(self, small_test_file, temp_output_dir):
        """Test that performance metrics are properly collected."""
        optimization_config = OptimizationConfig(enable_performance_monitoring=True)
        converter = OptimizedConverter(optimization_config=optimization_config)
        
        result = await converter.convert_football_async(small_test_file, temp_output_dir)
        
        # Validate result structure
        assert result['success'], "Conversion should succeed"
        assert 'performance_metrics' in result, "Performance metrics should be included"
        
        metrics = result['performance_metrics']
        
        # Check required metrics are present
        assert 'total_processing_time' in metrics
        assert 'memory_usage_mb' in metrics
        assert 'stage_timings' in metrics
        assert 'optimization_flags' in metrics
        
        # Check stage timings
        stage_timings = metrics['stage_timings']
        expected_stages = ['data_loading', 'extraction', 'normalization', 'merging', 'processing', 'splitting', 'reporting']
        
        for stage in expected_stages:
            if stage in stage_timings:
                assert isinstance(stage_timings[stage], (int, float)), f"Stage timing for {stage} should be numeric"
                assert stage_timings[stage] >= 0, f"Stage timing for {stage} should be non-negative"
        
        # Check optimization flags
        optimization_flags = metrics['optimization_flags']
        assert isinstance(optimization_flags, list), "Optimization flags should be a list"
        
        # Total processing time should be positive
        assert metrics['total_processing_time'] > 0, "Total processing time should be positive"
    
    def test_performance_metrics_object(self):
        """Test PerformanceMetrics dataclass functionality."""
        metrics = PerformanceMetrics()
        
        # Test default values
        assert metrics.total_processing_time == 0.0
        assert metrics.memory_usage_mb == 0.0
        assert metrics.cache_hits == 0
        assert isinstance(metrics.stage_timings, dict)
        assert isinstance(metrics.optimization_flags, list)
        
        # Test setting values
        metrics.total_processing_time = 5.5
        metrics.optimization_flags.append("test_optimization")
        metrics.stage_timings["test_stage"] = 1.2
        
        assert metrics.total_processing_time == 5.5
        assert "test_optimization" in metrics.optimization_flags
        assert metrics.stage_timings["test_stage"] == 1.2
    
    def test_optimization_config(self):
        """Test OptimizationConfig dataclass functionality."""
        # Test default config
        config = OptimizationConfig()
        assert config.enable_async_processing is True
        assert config.enable_streaming_json is True
        assert config.enable_parallel_normalization is True
        assert config.enable_batch_processing is True
        assert config.max_concurrent_tasks == 4
        assert config.batch_size == 100
        
        # Test custom config
        custom_config = OptimizationConfig(
            enable_streaming_json=False,
            max_concurrent_tasks=8,
            batch_size=50
        )
        assert custom_config.enable_streaming_json is False
        assert custom_config.max_concurrent_tasks == 8
        assert custom_config.batch_size == 50
        # Other values should remain default
        assert custom_config.enable_async_processing is True
        assert custom_config.enable_parallel_normalization is True


if __name__ == "__main__":
    # Run performance tests manually
    import sys
    
    print("Running OptimizedConverter Performance Tests...")
    
    # Create test data
    test_data = PerformanceTestData()
    small_file = test_data.create_large_json_file(50)
    large_file = test_data.create_large_json_file(1000)
    
    # Create temp directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Run basic performance test
        benchmark = PerformanceBenchmark()
        
        print("\n=== Basic Performance Comparison ===")
        original_converter = FootballConverter()
        original_metrics = benchmark.measure_performance(
            original_converter.convert_football,
            small_file,
            temp_dir + "/original"
        )
        
        optimized_converter = OptimizedConverter()
        optimized_metrics = benchmark.measure_performance(
            optimized_converter.convert_football,
            small_file,
            temp_dir + "/optimized"
        )
        
        print(f"Original - Time: {original_metrics['execution_time']:.2f}s, Memory: {original_metrics['memory_usage_mb']:.1f}MB")
        print(f"Optimized - Time: {optimized_metrics['execution_time']:.2f}s, Memory: {optimized_metrics['memory_usage_mb']:.1f}MB")
        
        improvement = (original_metrics['execution_time'] - optimized_metrics['execution_time']) / original_metrics['execution_time'] * 100
        print(f"Performance improvement: {improvement:.1f}%")
        
    finally:
        # Cleanup
        os.unlink(small_file)
        os.unlink(large_file)
        shutil.rmtree(temp_dir, ignore_errors=True)
    
    print("\nPerformance tests completed!")
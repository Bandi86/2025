"""
Integration tests for OptimizedConverter with the existing football processing system.

This module tests the integration of OptimizedConverter with the existing
football data processing pipeline to ensure compatibility and correctness.
"""

import asyncio
import json
import tempfile
import shutil
import pytest
from pathlib import Path

from src.converter.optimized_converter import OptimizedConverter, OptimizationConfig


class TestOptimizedConverterIntegration:
    """Integration tests for OptimizedConverter."""
    
    @pytest.fixture
    def temp_output_dir(self):
        """Create a temporary output directory for tests."""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir, ignore_errors=True)
    
    def test_optimized_converter_with_real_data(self, temp_output_dir):
        """Test OptimizedConverter with real football data."""
        # Use existing test data
        test_file = "jsons/Web__62sz__K__08-05.json"
        
        # Test with default optimization config
        converter = OptimizedConverter()
        result = converter.convert_football(test_file, temp_output_dir)
        
        # Validate result structure
        assert result['success'], "Conversion should succeed"
        assert 'processing_summary' in result
        assert 'files_created' in result
        assert 'statistics' in result
        
        # Check files were created
        output_path = Path(temp_output_dir)
        assert (output_path / "days").exists(), "Days directory should be created"
        assert (output_path / "reports").exists(), "Reports directory should be created"
        
        # Check merged file exists
        merged_files = list(output_path.glob("merged_games_*.json"))
        assert len(merged_files) > 0, "Merged file should be created"
    
    @pytest.mark.asyncio
    async def test_async_converter_with_real_data(self, temp_output_dir):
        """Test async OptimizedConverter with real football data."""
        # Use existing test data
        test_file = "jsons/Web__62sz__K__08-05.json"
        
        # Test with full optimization config
        optimization_config = OptimizationConfig(
            enable_async_processing=True,
            enable_streaming_json=True,
            enable_parallel_normalization=True,
            enable_batch_processing=True,
            max_concurrent_tasks=2,
            batch_size=25
        )
        
        converter = OptimizedConverter(optimization_config=optimization_config)
        result = await converter.convert_football_async(test_file, temp_output_dir)
        
        # Validate result structure
        assert result['success'], "Async conversion should succeed"
        assert 'performance_metrics' in result, "Performance metrics should be included"
        
        # Check performance metrics
        metrics = result['performance_metrics']
        assert 'total_processing_time' in metrics
        assert 'optimization_flags' in metrics
        assert len(metrics['optimization_flags']) > 0, "Optimization flags should be present"
        
        # Check files were created
        output_path = Path(temp_output_dir)
        assert (output_path / "days").exists(), "Days directory should be created"
        assert (output_path / "reports").exists(), "Reports directory should be created"
        
        # Check merged file exists
        merged_files = list(output_path.glob("merged_games_*.json"))
        assert len(merged_files) > 0, "Merged file should be created"
        
        # Validate merged file content
        with open(merged_files[0], 'r', encoding='utf-8') as f:
            merged_data = json.load(f)
        
        assert 'processing_info' in merged_data
        assert 'games' in merged_data
        assert 'optimization_flags' in merged_data['processing_info']
        assert 'performance_metrics' in merged_data['processing_info']
    
    @pytest.mark.asyncio
    async def test_progress_callback_functionality(self, temp_output_dir):
        """Test that progress callbacks work correctly."""
        test_file = "jsons/Web__62sz__K__08-05.json"
        
        # Track progress updates
        progress_updates = []
        
        async def progress_callback(percent: float, stage: str):
            progress_updates.append((percent, stage))
        
        converter = OptimizedConverter()
        result = await converter.convert_football_async(
            test_file, 
            temp_output_dir,
            progress_callback=progress_callback
        )
        
        # Validate conversion succeeded
        assert result['success'], "Conversion with progress callback should succeed"
        
        # Validate progress updates were received
        assert len(progress_updates) > 0, "Progress updates should be received"
        
        # Check progress values are reasonable
        for percent, stage in progress_updates:
            assert 0 <= percent <= 100, f"Progress percent should be 0-100, got {percent}"
            assert isinstance(stage, str), f"Stage should be string, got {type(stage)}"
        
        # Check final progress is 100%
        final_percent, final_stage = progress_updates[-1]
        assert final_percent == 100.0, "Final progress should be 100%"
        assert final_stage == "pipeline_completed", "Final stage should be pipeline_completed"
    
    def test_optimization_config_variations(self, temp_output_dir):
        """Test different optimization configuration combinations."""
        test_file = "jsons/Web__62sz__K__08-05.json"
        
        # Test configurations
        configs = [
            # Minimal optimizations
            OptimizationConfig(
                enable_async_processing=False,
                enable_streaming_json=False,
                enable_parallel_normalization=False,
                enable_batch_processing=False
            ),
            # Only async
            OptimizationConfig(
                enable_async_processing=True,
                enable_streaming_json=False,
                enable_parallel_normalization=False,
                enable_batch_processing=False
            ),
            # Only parallel normalization
            OptimizationConfig(
                enable_async_processing=False,
                enable_streaming_json=False,
                enable_parallel_normalization=True,
                enable_batch_processing=False,
                max_concurrent_tasks=2
            ),
            # Only batch processing
            OptimizationConfig(
                enable_async_processing=False,
                enable_streaming_json=False,
                enable_parallel_normalization=False,
                enable_batch_processing=True,
                batch_size=25
            )
        ]
        
        for i, config in enumerate(configs):
            output_subdir = f"{temp_output_dir}/config_{i}"
            converter = OptimizedConverter(optimization_config=config)
            
            result = converter.convert_football(test_file, output_subdir)
            
            assert result['success'], f"Configuration {i} should succeed"
            
            # Check basic output structure
            output_path = Path(output_subdir)
            assert (output_path / "days").exists(), f"Config {i}: Days directory should be created"
            assert (output_path / "reports").exists(), f"Config {i}: Reports directory should be created"
    
    def test_error_handling_and_graceful_degradation(self, temp_output_dir):
        """Test error handling and graceful degradation."""
        # Test with non-existent file
        converter = OptimizedConverter()
        result = converter.convert_football("non_existent_file.json", temp_output_dir)
        
        # Should fail gracefully
        assert result['success'] is False, "Should fail with non-existent file"
        assert 'error' in result, "Error information should be provided"
        assert 'error_type' in result, "Error type should be provided"
    
    @pytest.mark.asyncio
    async def test_async_error_handling(self, temp_output_dir):
        """Test async error handling."""
        # Test with non-existent file
        converter = OptimizedConverter()
        result = await converter.convert_football_async("non_existent_file.json", temp_output_dir)
        
        # Should fail gracefully
        assert result['success'] is False, "Should fail with non-existent file"
        assert 'error' in result, "Error information should be provided"
        assert 'performance_metrics' in result, "Performance metrics should still be included"
    
    def test_performance_metrics_accuracy(self, temp_output_dir):
        """Test that performance metrics are accurate and meaningful."""
        test_file = "jsons/Web__62sz__K__08-05.json"
        
        converter = OptimizedConverter()
        result = converter.convert_football(test_file, temp_output_dir)
        
        assert result['success'], "Conversion should succeed"
        
        # Check processing summary has timing information
        processing_summary = result['processing_summary']
        assert 'total_processing_time' in processing_summary
        assert processing_summary['total_processing_time'] > 0, "Processing time should be positive"
        
        # Check stages were tracked
        assert 'stages_completed' in processing_summary
        assert len(processing_summary['stages_completed']) > 0, "Some stages should be completed"
    
    def test_caching_functionality(self, temp_output_dir):
        """Test caching functionality."""
        test_file = "jsons/Web__62sz__K__08-05.json"
        
        converter = OptimizedConverter()
        
        # Enable caching
        converter.enable_caching()
        
        # Check optimization flag was set
        assert 'internal_caching' in converter.performance_metrics.optimization_flags
        
        # Run conversion
        result = converter.convert_football(test_file, temp_output_dir)
        assert result['success'], "Conversion with caching should succeed"
    
    def test_streaming_functionality(self, temp_output_dir):
        """Test streaming functionality."""
        test_file = "jsons/Web__62sz__K__08-05.json"
        
        converter = OptimizedConverter()
        
        # Enable streaming with custom chunk size
        converter.enable_streaming(chunk_size=4096)
        
        # Check configuration was updated
        assert converter.optimization_config.enable_streaming_json is True
        assert converter.optimization_config.streaming_chunk_size == 4096
        assert 'streaming_enabled' in converter.performance_metrics.optimization_flags
        
        # Run conversion
        result = converter.convert_football(test_file, temp_output_dir)
        assert result['success'], "Conversion with streaming should succeed"


if __name__ == "__main__":
    # Run integration tests manually
    import sys
    
    print("Running OptimizedConverter Integration Tests...")
    
    # Create temp directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Test basic functionality
        print("\n=== Basic Integration Test ===")
        converter = OptimizedConverter()
        result = converter.convert_football("jsons/Web__62sz__K__08-05.json", temp_dir)
        
        if result['success']:
            print(f"✓ Basic integration test passed")
            print(f"  - Processing time: {result['processing_summary']['total_processing_time']:.2f}s")
            print(f"  - Games processed: {result['processing_summary']['total_games']}")
            print(f"  - Files created: {len(result['files_created']['daily_files']) + len(result['files_created']['report_files'])}")
        else:
            print(f"✗ Basic integration test failed: {result.get('error', 'Unknown error')}")
        
        # Test async functionality
        print("\n=== Async Integration Test ===")
        
        async def test_async():
            optimization_config = OptimizationConfig(
                enable_async_processing=True,
                enable_parallel_normalization=True,
                enable_batch_processing=True
            )
            
            async_converter = OptimizedConverter(optimization_config=optimization_config)
            async_result = await async_converter.convert_football_async(
                "jsons/Web__62sz__K__08-05.json", 
                temp_dir + "/async"
            )
            
            if async_result['success']:
                print(f"✓ Async integration test passed")
                metrics = async_result['performance_metrics']
                print(f"  - Processing time: {metrics['total_processing_time']:.2f}s")
                print(f"  - Optimization flags: {metrics['optimization_flags']}")
                print(f"  - Parallel tasks: {metrics['parallel_tasks_executed']}")
                print(f"  - Batch operations: {metrics['batch_operations']}")
            else:
                print(f"✗ Async integration test failed: {async_result.get('error', 'Unknown error')}")
        
        asyncio.run(test_async())
        
    finally:
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)
    
    print("\nIntegration tests completed!")
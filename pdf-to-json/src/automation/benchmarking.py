"""
Performance benchmarking and regression testing suite.

This module provides comprehensive benchmarking tools for performance regression
testing, load testing, and performance comparison across different versions.
"""

import asyncio
import json
import time
import statistics
from collections import defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable, Awaitable, Union
import structlog
import psutil
import gc
import tracemalloc

from .performance_monitor import APMCollector, PerformanceMetrics
from .config import PerformanceConfig
from .exceptions import PerformanceError


@dataclass
class BenchmarkResult:
    """Single benchmark execution result."""
    name: str
    timestamp: datetime
    duration: float
    memory_peak: int
    memory_start: int
    memory_end: int
    cpu_usage_avg: float
    iterations: int
    success: bool
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            **asdict(self),
            'timestamp': self.timestamp.isoformat(),
            'memory_delta': self.memory_end - self.memory_start,
            'duration_per_iteration': self.duration / self.iterations if self.iterations > 0 else 0,
        }


@dataclass
class BenchmarkSuite:
    """Collection of benchmark results."""
    name: str
    version: str
    timestamp: datetime
    results: List[BenchmarkResult] = field(default_factory=list)
    system_info: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'name': self.name,
            'version': self.version,
            'timestamp': self.timestamp.isoformat(),
            'results': [r.to_dict() for r in self.results],
            'system_info': self.system_info,
            'summary': self.get_summary()
        }
    
    def get_summary(self) -> Dict[str, Any]:
        """Get benchmark suite summary."""
        if not self.results:
            return {}
        
        successful_results = [r for r in self.results if r.success]
        failed_results = [r for r in self.results if not r.success]
        
        if successful_results:
            durations = [r.duration for r in successful_results]
            memory_deltas = [r.memory_end - r.memory_start for r in successful_results]
            cpu_usages = [r.cpu_usage_avg for r in successful_results]
            
            return {
                'total_benchmarks': len(self.results),
                'successful': len(successful_results),
                'failed': len(failed_results),
                'total_duration': sum(durations),
                'avg_duration': statistics.mean(durations),
                'median_duration': statistics.median(durations),
                'min_duration': min(durations),
                'max_duration': max(durations),
                'avg_memory_delta': statistics.mean(memory_deltas),
                'max_memory_delta': max(memory_deltas),
                'avg_cpu_usage': statistics.mean(cpu_usages),
                'max_cpu_usage': max(cpu_usages),
            }
        
        return {
            'total_benchmarks': len(self.results),
            'successful': 0,
            'failed': len(failed_results),
        }


@dataclass
class RegressionTest:
    """Performance regression test configuration."""
    name: str
    benchmark_function: Callable
    baseline_version: str
    threshold_percent: float = 10.0  # Performance degradation threshold
    iterations: int = 5
    warmup_iterations: int = 2
    timeout: float = 300.0  # seconds
    memory_threshold_mb: int = 50  # Memory increase threshold
    
    def __post_init__(self):
        """Validate configuration."""
        if self.threshold_percent <= 0:
            raise ValueError("Threshold percent must be positive")
        if self.iterations <= 0:
            raise ValueError("Iterations must be positive")
        if self.timeout <= 0:
            raise ValueError("Timeout must be positive")


class BenchmarkRunner:
    """Performance benchmark runner."""
    
    def __init__(self, config: PerformanceConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        self.results_dir = Path("benchmarks/results")
        self.results_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize APM collector for detailed metrics
        self.apm_collector = APMCollector(config)
        
        # Benchmark registry
        self.benchmarks: Dict[str, Callable] = {}
        self.regression_tests: Dict[str, RegressionTest] = {}
        
    def register_benchmark(self, name: str, func: Callable):
        """Register a benchmark function."""
        self.benchmarks[name] = func
        self.logger.info("Benchmark registered", name=name)
    
    def register_regression_test(self, test: RegressionTest):
        """Register a regression test."""
        self.regression_tests[test.name] = test
        self.logger.info("Regression test registered", name=test.name)
    
    async def run_benchmark(
        self, 
        name: str, 
        iterations: int = 5,
        warmup_iterations: int = 2,
        timeout: float = 300.0
    ) -> BenchmarkResult:
        """Run a single benchmark."""
        if name not in self.benchmarks:
            raise PerformanceError(f"Benchmark '{name}' not found")
        
        benchmark_func = self.benchmarks[name]
        
        self.logger.info("Starting benchmark", name=name, iterations=iterations)
        
        try:
            # Warmup runs
            for i in range(warmup_iterations):
                self.logger.debug("Warmup iteration", benchmark=name, iteration=i+1)
                try:
                    if asyncio.iscoroutinefunction(benchmark_func):
                        await asyncio.wait_for(benchmark_func(), timeout=timeout)
                    else:
                        await asyncio.wait_for(
                            asyncio.get_event_loop().run_in_executor(None, benchmark_func),
                            timeout=timeout
                        )
                except asyncio.TimeoutError:
                    self.logger.warning("Warmup iteration timed out", benchmark=name, iteration=i+1)
                except Exception as e:
                    self.logger.warning("Warmup iteration failed", benchmark=name, iteration=i+1, error=str(e))
            
            # Force garbage collection before measurement
            gc.collect()
            
            # Start memory tracking
            tracemalloc.start()
            memory_start = psutil.Process().memory_info().rss
            
            # CPU monitoring setup
            cpu_measurements = []
            
            # Actual benchmark runs
            start_time = time.time()
            
            for i in range(iterations):
                iteration_start = time.time()
                
                try:
                    if asyncio.iscoroutinefunction(benchmark_func):
                        await asyncio.wait_for(benchmark_func(), timeout=timeout)
                    else:
                        await asyncio.wait_for(
                            asyncio.get_event_loop().run_in_executor(None, benchmark_func),
                            timeout=timeout
                        )
                    
                    # Measure CPU usage for this iteration
                    cpu_measurements.append(psutil.cpu_percent(interval=0.1))
                    
                except asyncio.TimeoutError:
                    error_msg = f"Benchmark timed out after {timeout} seconds"
                    self.logger.error("Benchmark timeout", benchmark=name, iteration=i+1)
                    return BenchmarkResult(
                        name=name,
                        timestamp=datetime.now(timezone.utc),
                        duration=time.time() - start_time,
                        memory_peak=0,
                        memory_start=memory_start,
                        memory_end=psutil.Process().memory_info().rss,
                        cpu_usage_avg=0.0,
                        iterations=i,
                        success=False,
                        error_message=error_msg
                    )
                except Exception as e:
                    error_msg = f"Benchmark failed: {str(e)}"
                    self.logger.error("Benchmark error", benchmark=name, iteration=i+1, error=str(e))
                    return BenchmarkResult(
                        name=name,
                        timestamp=datetime.now(timezone.utc),
                        duration=time.time() - start_time,
                        memory_peak=0,
                        memory_start=memory_start,
                        memory_end=psutil.Process().memory_info().rss,
                        cpu_usage_avg=0.0,
                        iterations=i,
                        success=False,
                        error_message=error_msg
                    )
            
            end_time = time.time()
            
            # Get memory measurements
            current_snapshot = tracemalloc.take_snapshot()
            memory_peak = max(stat.size for stat in current_snapshot.statistics('filename'))
            memory_end = psutil.Process().memory_info().rss
            tracemalloc.stop()
            
            # Calculate averages
            total_duration = end_time - start_time
            avg_cpu_usage = statistics.mean(cpu_measurements) if cpu_measurements else 0.0
            
            result = BenchmarkResult(
                name=name,
                timestamp=datetime.now(timezone.utc),
                duration=total_duration,
                memory_peak=memory_peak,
                memory_start=memory_start,
                memory_end=memory_end,
                cpu_usage_avg=avg_cpu_usage,
                iterations=iterations,
                success=True
            )
            
            self.logger.info("Benchmark completed", 
                           name=name, 
                           duration=total_duration,
                           iterations=iterations,
                           avg_duration_per_iteration=total_duration/iterations)
            
            return result
            
        except Exception as e:
            self.logger.error("Benchmark execution failed", benchmark=name, error=str(e))
            return BenchmarkResult(
                name=name,
                timestamp=datetime.now(timezone.utc),
                duration=0.0,
                memory_peak=0,
                memory_start=0,
                memory_end=0,
                cpu_usage_avg=0.0,
                iterations=0,
                success=False,
                error_message=str(e)
            )
    
    async def run_benchmark_suite(
        self, 
        suite_name: str,
        version: str,
        benchmark_names: Optional[List[str]] = None
    ) -> BenchmarkSuite:
        """Run a suite of benchmarks."""
        if benchmark_names is None:
            benchmark_names = list(self.benchmarks.keys())
        
        self.logger.info("Starting benchmark suite", 
                        suite=suite_name, 
                        version=version,
                        benchmarks=benchmark_names)
        
        # Collect system information
        system_info = {
            'cpu_count': psutil.cpu_count(),
            'cpu_freq': psutil.cpu_freq()._asdict() if psutil.cpu_freq() else {},
            'memory_total': psutil.virtual_memory().total,
            'python_version': f"{__import__('sys').version_info.major}.{__import__('sys').version_info.minor}.{__import__('sys').version_info.micro}",
            'platform': __import__('platform').platform(),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        suite = BenchmarkSuite(
            name=suite_name,
            version=version,
            timestamp=datetime.now(timezone.utc),
            system_info=system_info
        )
        
        # Run each benchmark
        for benchmark_name in benchmark_names:
            if benchmark_name in self.benchmarks:
                result = await self.run_benchmark(benchmark_name)
                suite.results.append(result)
            else:
                self.logger.warning("Benchmark not found", name=benchmark_name)
        
        # Save results
        await self.save_benchmark_suite(suite)
        
        self.logger.info("Benchmark suite completed", 
                        suite=suite_name,
                        total_benchmarks=len(suite.results),
                        successful=len([r for r in suite.results if r.success]))
        
        return suite
    
    async def save_benchmark_suite(self, suite: BenchmarkSuite):
        """Save benchmark suite results to file."""
        filename = f"{suite.name}_{suite.version}_{suite.timestamp.strftime('%Y%m%d_%H%M%S')}.json"
        filepath = self.results_dir / filename
        
        try:
            with open(filepath, 'w') as f:
                json.dump(suite.to_dict(), f, indent=2, default=str)
            
            self.logger.info("Benchmark results saved", file=str(filepath))
            
        except Exception as e:
            self.logger.error("Failed to save benchmark results", error=str(e))
            raise PerformanceError(f"Failed to save benchmark results: {e}")
    
    async def load_benchmark_suite(self, filepath: str) -> BenchmarkSuite:
        """Load benchmark suite from file."""
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            # Convert back to objects
            results = []
            for result_data in data.get('results', []):
                result_data['timestamp'] = datetime.fromisoformat(result_data['timestamp'])
                results.append(BenchmarkResult(**{k: v for k, v in result_data.items() if k != 'memory_delta' and k != 'duration_per_iteration'}))
            
            suite = BenchmarkSuite(
                name=data['name'],
                version=data['version'],
                timestamp=datetime.fromisoformat(data['timestamp']),
                results=results,
                system_info=data.get('system_info', {})
            )
            
            return suite
            
        except Exception as e:
            self.logger.error("Failed to load benchmark suite", file=filepath, error=str(e))
            raise PerformanceError(f"Failed to load benchmark suite: {e}")
    
    async def run_regression_tests(self) -> Dict[str, Any]:
        """Run all registered regression tests."""
        self.logger.info("Starting regression tests", count=len(self.regression_tests))
        
        results = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'tests': {},
            'summary': {
                'total': len(self.regression_tests),
                'passed': 0,
                'failed': 0,
                'errors': 0
            }
        }
        
        for test_name, test in self.regression_tests.items():
            try:
                result = await self.run_regression_test(test)
                results['tests'][test_name] = result
                
                if result['status'] == 'passed':
                    results['summary']['passed'] += 1
                elif result['status'] == 'failed':
                    results['summary']['failed'] += 1
                else:
                    results['summary']['errors'] += 1
                    
            except Exception as e:
                self.logger.error("Regression test error", test=test_name, error=str(e))
                results['tests'][test_name] = {
                    'status': 'error',
                    'error': str(e),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                results['summary']['errors'] += 1
        
        # Save regression test results
        await self.save_regression_results(results)
        
        return results
    
    async def run_regression_test(self, test: RegressionTest) -> Dict[str, Any]:
        """Run a single regression test."""
        self.logger.info("Running regression test", name=test.name)
        
        try:
            # Run current benchmark
            current_result = await self.run_benchmark(
                test.name,
                iterations=test.iterations,
                warmup_iterations=test.warmup_iterations,
                timeout=test.timeout
            )
            
            if not current_result.success:
                return {
                    'status': 'error',
                    'error': current_result.error_message,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            
            # Load baseline results
            baseline_result = await self.load_baseline_result(test.name, test.baseline_version)
            
            if not baseline_result:
                # No baseline found, save current as baseline
                await self.save_baseline_result(test.name, test.baseline_version, current_result)
                return {
                    'status': 'baseline_created',
                    'message': 'No baseline found, current result saved as baseline',
                    'current_duration': current_result.duration,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            
            # Compare performance
            duration_change_percent = ((current_result.duration - baseline_result.duration) / baseline_result.duration) * 100
            memory_change_mb = (current_result.memory_end - current_result.memory_start - 
                              (baseline_result.memory_end - baseline_result.memory_start)) / (1024 * 1024)
            
            # Check thresholds
            duration_regression = duration_change_percent > test.threshold_percent
            memory_regression = memory_change_mb > test.memory_threshold_mb
            
            status = 'passed'
            if duration_regression or memory_regression:
                status = 'failed'
            
            result = {
                'status': status,
                'current_duration': current_result.duration,
                'baseline_duration': baseline_result.duration,
                'duration_change_percent': duration_change_percent,
                'duration_regression': duration_regression,
                'current_memory_delta_mb': (current_result.memory_end - current_result.memory_start) / (1024 * 1024),
                'baseline_memory_delta_mb': (baseline_result.memory_end - baseline_result.memory_start) / (1024 * 1024),
                'memory_change_mb': memory_change_mb,
                'memory_regression': memory_regression,
                'threshold_percent': test.threshold_percent,
                'memory_threshold_mb': test.memory_threshold_mb,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            if status == 'failed':
                self.logger.warning("Regression test failed", 
                                  test=test.name,
                                  duration_change=duration_change_percent,
                                  memory_change=memory_change_mb)
            else:
                self.logger.info("Regression test passed", test=test.name)
            
            return result
            
        except Exception as e:
            self.logger.error("Regression test execution failed", test=test.name, error=str(e))
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def load_baseline_result(self, test_name: str, version: str) -> Optional[BenchmarkResult]:
        """Load baseline result for regression test."""
        baseline_dir = self.results_dir / "baselines"
        baseline_file = baseline_dir / f"{test_name}_{version}.json"
        
        if not baseline_file.exists():
            return None
        
        try:
            with open(baseline_file, 'r') as f:
                data = json.load(f)
            
            data['timestamp'] = datetime.fromisoformat(data['timestamp'])
            return BenchmarkResult(**data)
            
        except Exception as e:
            self.logger.error("Failed to load baseline result", 
                            test=test_name, 
                            version=version, 
                            error=str(e))
            return None
    
    async def save_baseline_result(self, test_name: str, version: str, result: BenchmarkResult):
        """Save baseline result for regression test."""
        baseline_dir = self.results_dir / "baselines"
        baseline_dir.mkdir(exist_ok=True)
        
        baseline_file = baseline_dir / f"{test_name}_{version}.json"
        
        try:
            with open(baseline_file, 'w') as f:
                json.dump(result.to_dict(), f, indent=2, default=str)
            
            self.logger.info("Baseline result saved", test=test_name, version=version)
            
        except Exception as e:
            self.logger.error("Failed to save baseline result", 
                            test=test_name, 
                            version=version, 
                            error=str(e))
            raise PerformanceError(f"Failed to save baseline result: {e}")
    
    async def save_regression_results(self, results: Dict[str, Any]):
        """Save regression test results."""
        filename = f"regression_tests_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
        filepath = self.results_dir / filename
        
        try:
            with open(filepath, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            
            self.logger.info("Regression test results saved", file=str(filepath))
            
        except Exception as e:
            self.logger.error("Failed to save regression test results", error=str(e))
            raise PerformanceError(f"Failed to save regression test results: {e}")
    
    def get_benchmark_history(self, benchmark_name: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get benchmark history for trend analysis."""
        history = []
        cutoff_date = datetime.now(timezone.utc) - __import__('datetime').timedelta(days=days)
        
        # Scan results directory for matching files
        for result_file in self.results_dir.glob("*.json"):
            if result_file.name.startswith("regression_tests_"):
                continue  # Skip regression test files
            
            try:
                with open(result_file, 'r') as f:
                    data = json.load(f)
                
                suite_date = datetime.fromisoformat(data['timestamp'])
                if suite_date < cutoff_date:
                    continue
                
                # Find matching benchmark in suite
                for result in data.get('results', []):
                    if result['name'] == benchmark_name and result['success']:
                        history.append({
                            'timestamp': result['timestamp'],
                            'version': data['version'],
                            'duration': result['duration'],
                            'memory_delta': result.get('memory_delta', 0),
                            'cpu_usage': result['cpu_usage_avg'],
                            'iterations': result['iterations']
                        })
                        
            except Exception as e:
                self.logger.warning("Failed to parse result file", file=str(result_file), error=str(e))
        
        # Sort by timestamp
        history.sort(key=lambda x: x['timestamp'])
        return history
    
    def analyze_performance_trends(self, benchmark_name: str, days: int = 30) -> Dict[str, Any]:
        """Analyze performance trends for a benchmark."""
        history = self.get_benchmark_history(benchmark_name, days)
        
        if len(history) < 2:
            return {'error': 'Insufficient data for trend analysis'}
        
        # Calculate trends
        durations = [h['duration'] for h in history]
        memory_deltas = [h['memory_delta'] for h in history]
        
        duration_trend = 'stable'
        if len(durations) >= 3:
            # Simple linear trend detection
            recent_avg = statistics.mean(durations[-3:])
            older_avg = statistics.mean(durations[:3])
            change_percent = ((recent_avg - older_avg) / older_avg) * 100
            
            if change_percent > 10:
                duration_trend = 'degrading'
            elif change_percent < -10:
                duration_trend = 'improving'
        
        return {
            'benchmark_name': benchmark_name,
            'period_days': days,
            'data_points': len(history),
            'duration_stats': {
                'min': min(durations),
                'max': max(durations),
                'avg': statistics.mean(durations),
                'median': statistics.median(durations),
                'std_dev': statistics.stdev(durations) if len(durations) > 1 else 0,
                'trend': duration_trend
            },
            'memory_stats': {
                'min': min(memory_deltas),
                'max': max(memory_deltas),
                'avg': statistics.mean(memory_deltas),
                'median': statistics.median(memory_deltas)
            },
            'latest_result': history[-1],
            'oldest_result': history[0]
        }


# Decorator for easy benchmark registration
def benchmark(name: str = None):
    """Decorator to register a function as a benchmark."""
    def decorator(func):
        benchmark_name = name or func.__name__
        # Store benchmark info for later registration
        if not hasattr(func, '_benchmark_info'):
            func._benchmark_info = {'name': benchmark_name}
        return func
    return decorator


# Context manager for measuring code blocks
@asynccontextmanager
async def measure_performance(name: str, runner: BenchmarkRunner):
    """Context manager for measuring performance of code blocks."""
    start_time = time.time()
    start_memory = psutil.Process().memory_info().rss
    
    try:
        yield
    finally:
        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss
        
        duration = end_time - start_time
        memory_delta = end_memory - start_memory
        
        runner.logger.info("Performance measurement completed",
                         name=name,
                         duration=duration,
                         memory_delta_mb=memory_delta / (1024 * 1024))
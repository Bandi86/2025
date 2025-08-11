"""
Performance monitoring and optimization tools.

This module provides comprehensive application performance monitoring (APM),
profiling tools, memory leak detection, and database performance optimization.
"""

import asyncio
import gc
import logging
import psutil
import time
import tracemalloc
from collections import defaultdict, deque
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable, Awaitable, Union
import cProfile
import pstats
import io
import threading
import weakref
from functools import wraps
import structlog
import sqlalchemy
from sqlalchemy import event, text
from sqlalchemy.engine import Engine
from sqlalchemy.pool import Pool

from .models import SystemMetrics, get_session_factory
from .config import PerformanceConfig
from .exceptions import PerformanceError
from .query_optimizer import QueryOptimizer


@dataclass
class PerformanceMetrics:
    """Performance metrics data structure."""
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    memory_rss: int
    memory_vms: int
    disk_io_read: int
    disk_io_write: int
    network_io_sent: int
    network_io_recv: int
    thread_count: int
    file_descriptors: int
    context_switches: int
    
    # Application-specific metrics
    active_connections: int = 0
    cache_hit_ratio: float = 0.0
    queue_length: int = 0
    processing_time_avg: float = 0.0
    error_rate: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'timestamp': self.timestamp.isoformat(),
            'cpu_usage': self.cpu_usage,
            'memory_usage': self.memory_usage,
            'memory_rss': self.memory_rss,
            'memory_vms': self.memory_vms,
            'disk_io_read': self.disk_io_read,
            'disk_io_write': self.disk_io_write,
            'network_io_sent': self.network_io_sent,
            'network_io_recv': self.network_io_recv,
            'thread_count': self.thread_count,
            'file_descriptors': self.file_descriptors,
            'context_switches': self.context_switches,
            'active_connections': self.active_connections,
            'cache_hit_ratio': self.cache_hit_ratio,
            'queue_length': self.queue_length,
            'processing_time_avg': self.processing_time_avg,
            'error_rate': self.error_rate,
        }


@dataclass
class ProfileResult:
    """Profiling result data structure."""
    function_name: str
    filename: str
    line_number: int
    total_time: float
    cumulative_time: float
    call_count: int
    time_per_call: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'function_name': self.function_name,
            'filename': self.filename,
            'line_number': self.line_number,
            'total_time': self.total_time,
            'cumulative_time': self.cumulative_time,
            'call_count': self.call_count,
            'time_per_call': self.time_per_call,
        }


@dataclass
class MemorySnapshot:
    """Memory usage snapshot."""
    timestamp: datetime
    total_memory: int
    available_memory: int
    used_memory: int
    memory_percent: float
    swap_total: int
    swap_used: int
    swap_percent: float
    
    # Process-specific memory
    process_memory_rss: int
    process_memory_vms: int
    process_memory_percent: float
    
    # Python-specific memory
    python_objects_count: int
    python_memory_usage: int
    gc_collections: Dict[int, int] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'timestamp': self.timestamp.isoformat(),
            'total_memory': self.total_memory,
            'available_memory': self.available_memory,
            'used_memory': self.used_memory,
            'memory_percent': self.memory_percent,
            'swap_total': self.swap_total,
            'swap_used': self.swap_used,
            'swap_percent': self.swap_percent,
            'process_memory_rss': self.process_memory_rss,
            'process_memory_vms': self.process_memory_vms,
            'process_memory_percent': self.process_memory_percent,
            'python_objects_count': self.python_objects_count,
            'python_memory_usage': self.python_memory_usage,
            'gc_collections': self.gc_collections,
        }


@dataclass
class DatabaseMetrics:
    """Database performance metrics."""
    timestamp: datetime
    connection_pool_size: int
    active_connections: int
    idle_connections: int
    query_count: int
    slow_query_count: int
    average_query_time: float
    longest_query_time: float
    deadlock_count: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'timestamp': self.timestamp.isoformat(),
            'connection_pool_size': self.connection_pool_size,
            'active_connections': self.active_connections,
            'idle_connections': self.idle_connections,
            'query_count': self.query_count,
            'slow_query_count': self.slow_query_count,
            'average_query_time': self.average_query_time,
            'longest_query_time': self.longest_query_time,
            'deadlock_count': self.deadlock_count,
        }


class PerformanceProfiler:
    """Performance profiling tools for bottleneck identification."""
    
    def __init__(self, config: PerformanceConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        self.active_profiles: Dict[str, cProfile.Profile] = {}
        self.profile_results: Dict[str, List[ProfileResult]] = defaultdict(list)
        self._lock = threading.Lock()
    
    @contextmanager
    def profile_context(self, name: str):
        """Context manager for profiling code blocks."""
        profiler = cProfile.Profile()
        
        with self._lock:
            self.active_profiles[name] = profiler
        
        try:
            profiler.enable()
            start_time = time.time()
            yield
            end_time = time.time()
            profiler.disable()
            
            # Process results
            self._process_profile_results(name, profiler, end_time - start_time)
            
        finally:
            with self._lock:
                self.active_profiles.pop(name, None)
    
    def profile_function(self, name: Optional[str] = None):
        """Decorator for profiling functions."""
        def decorator(func):
            profile_name = name or f"{func.__module__}.{func.__name__}"
            
            @wraps(func)
            def wrapper(*args, **kwargs):
                with self.profile_context(profile_name):
                    return func(*args, **kwargs)
            return wrapper
        return decorator
    
    def profile_async_function(self, name: Optional[str] = None):
        """Decorator for profiling async functions."""
        def decorator(func):
            profile_name = name or f"{func.__module__}.{func.__name__}"
            
            @wraps(func)
            async def wrapper(*args, **kwargs):
                with self.profile_context(profile_name):
                    return await func(*args, **kwargs)
            return wrapper
        return decorator
    
    def _process_profile_results(self, name: str, profiler: cProfile.Profile, total_time: float):
        """Process profiling results and extract top functions."""
        try:
            # Create string buffer for stats
            stats_buffer = io.StringIO()
            stats = pstats.Stats(profiler, stream=stats_buffer)
            stats.sort_stats('cumulative')
            
            # Get top functions
            results = []
            for func_info, (call_count, total_time_func, cumulative_time) in stats.stats.items():
                filename, line_number, function_name = func_info
                
                if call_count > 0:
                    time_per_call = total_time_func / call_count
                    
                    result = ProfileResult(
                        function_name=function_name,
                        filename=filename,
                        line_number=line_number,
                        total_time=total_time_func,
                        cumulative_time=cumulative_time,
                        call_count=call_count,
                        time_per_call=time_per_call
                    )
                    results.append(result)
            
            # Sort by cumulative time and keep top results
            results.sort(key=lambda x: x.cumulative_time, reverse=True)
            self.profile_results[name] = results[:self.config.max_profile_results]
            
            self.logger.info("Profile completed", 
                           name=name, 
                           total_time=total_time,
                           top_functions=len(results))
            
        except Exception as e:
            self.logger.error("Failed to process profile results", name=name, error=str(e))
    
    def get_profile_results(self, name: str) -> List[ProfileResult]:
        """Get profiling results for a specific profile."""
        return self.profile_results.get(name, [])
    
    def get_all_profile_results(self) -> Dict[str, List[ProfileResult]]:
        """Get all profiling results."""
        return dict(self.profile_results)
    
    def clear_profile_results(self, name: Optional[str] = None):
        """Clear profiling results."""
        if name:
            self.profile_results.pop(name, None)
        else:
            self.profile_results.clear()


class MemoryMonitor:
    """Memory usage monitoring and leak detection."""
    
    def __init__(self, config: PerformanceConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        self.snapshots: deque = deque(maxlen=config.max_memory_snapshots)
        self.tracemalloc_enabled = False
        self.baseline_snapshot = None
        self.object_trackers: Dict[str, weakref.WeakSet] = defaultdict(weakref.WeakSet)
        
        # Start tracemalloc if enabled
        if config.enable_memory_tracking:
            self.start_memory_tracking()
    
    def start_memory_tracking(self):
        """Start memory tracking with tracemalloc."""
        if not self.tracemalloc_enabled:
            tracemalloc.start()
            self.tracemalloc_enabled = True
            self.baseline_snapshot = tracemalloc.take_snapshot()
            self.logger.info("Memory tracking started")
    
    def stop_memory_tracking(self):
        """Stop memory tracking."""
        if self.tracemalloc_enabled:
            tracemalloc.stop()
            self.tracemalloc_enabled = False
            self.baseline_snapshot = None
            self.logger.info("Memory tracking stopped")
    
    def take_snapshot(self) -> MemorySnapshot:
        """Take a memory usage snapshot."""
        try:
            # System memory info
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            # Process memory info
            process = psutil.Process()
            process_memory = process.memory_info()
            
            # Python memory info
            python_objects_count = len(gc.get_objects())
            python_memory_usage = 0
            
            if self.tracemalloc_enabled:
                current_snapshot = tracemalloc.take_snapshot()
                python_memory_usage = sum(stat.size for stat in current_snapshot.statistics('filename'))
            
            # GC statistics
            gc_stats = {}
            for i in range(3):  # Python has 3 GC generations
                gc_stats[i] = gc.get_count()[i]
            
            snapshot = MemorySnapshot(
                timestamp=datetime.now(timezone.utc),
                total_memory=memory.total,
                available_memory=memory.available,
                used_memory=memory.used,
                memory_percent=memory.percent,
                swap_total=swap.total,
                swap_used=swap.used,
                swap_percent=swap.percent,
                process_memory_rss=process_memory.rss,
                process_memory_vms=process_memory.vms,
                process_memory_percent=process.memory_percent(),
                python_objects_count=python_objects_count,
                python_memory_usage=python_memory_usage,
                gc_collections=gc_stats
            )
            
            self.snapshots.append(snapshot)
            return snapshot
            
        except Exception as e:
            self.logger.error("Failed to take memory snapshot", error=str(e))
            raise PerformanceError(f"Failed to take memory snapshot: {e}")
    
    def detect_memory_leaks(self) -> Dict[str, Any]:
        """Detect potential memory leaks."""
        if not self.tracemalloc_enabled or not self.baseline_snapshot:
            return {'error': 'Memory tracking not enabled'}
        
        try:
            current_snapshot = tracemalloc.take_snapshot()
            top_stats = current_snapshot.compare_to(self.baseline_snapshot, 'lineno')
            
            leaks = []
            for stat in top_stats[:10]:  # Top 10 memory increases
                if stat.size_diff > self.config.memory_leak_threshold:
                    leaks.append({
                        'filename': stat.traceback.format()[0] if stat.traceback else 'unknown',
                        'size_diff': stat.size_diff,
                        'size_diff_mb': stat.size_diff / 1024 / 1024,
                        'count_diff': stat.count_diff,
                        'size': stat.size,
                        'count': stat.count
                    })
            
            return {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'potential_leaks': leaks,
                'total_memory_increase': sum(leak['size_diff'] for leak in leaks),
                'baseline_time': self.baseline_snapshot.timestamp if hasattr(self.baseline_snapshot, 'timestamp') else None
            }
            
        except Exception as e:
            self.logger.error("Failed to detect memory leaks", error=str(e))
            return {'error': f'Failed to detect memory leaks: {e}'}
    
    def track_object_creation(self, obj_type: str, obj: Any):
        """Track object creation for leak detection."""
        self.object_trackers[obj_type].add(obj)
    
    def get_object_counts(self) -> Dict[str, int]:
        """Get current object counts by type."""
        return {obj_type: len(tracker) for obj_type, tracker in self.object_trackers.items()}
    
    def get_memory_trend(self, hours: int = 24) -> Dict[str, Any]:
        """Get memory usage trend over time."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        recent_snapshots = [s for s in self.snapshots if s.timestamp >= cutoff_time]
        
        if len(recent_snapshots) < 2:
            return {'error': 'Insufficient data for trend analysis'}
        
        # Calculate trends
        memory_values = [s.memory_percent for s in recent_snapshots]
        process_memory_values = [s.process_memory_percent for s in recent_snapshots]
        
        return {
            'period_hours': hours,
            'snapshots_count': len(recent_snapshots),
            'memory_trend': {
                'start': memory_values[0],
                'end': memory_values[-1],
                'change': memory_values[-1] - memory_values[0],
                'max': max(memory_values),
                'min': min(memory_values),
                'avg': sum(memory_values) / len(memory_values)
            },
            'process_memory_trend': {
                'start': process_memory_values[0],
                'end': process_memory_values[-1],
                'change': process_memory_values[-1] - process_memory_values[0],
                'max': max(process_memory_values),
                'min': min(process_memory_values),
                'avg': sum(process_memory_values) / len(process_memory_values)
            }
        }
    
    def get_recent_snapshots(self, count: int = 10) -> List[MemorySnapshot]:
        """Get recent memory snapshots."""
        return list(self.snapshots)[-count:]


class DatabasePerformanceMonitor:
    """Database performance monitoring and optimization."""
    
    def __init__(self, config: PerformanceConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        self.query_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            'count': 0,
            'total_time': 0.0,
            'max_time': 0.0,
            'min_time': float('inf'),
            'avg_time': 0.0,
            'slow_queries': 0
        })
        self.slow_queries: List[Dict[str, Any]] = []
        self.connection_metrics: List[DatabaseMetrics] = []
        self.engines: List[Engine] = []
        
    def register_engine(self, engine: Engine):
        """Register a SQLAlchemy engine for monitoring."""
        self.engines.append(engine)
        
        # Add event listeners
        event.listen(engine, 'before_cursor_execute', self._before_cursor_execute)
        event.listen(engine, 'after_cursor_execute', self._after_cursor_execute)
        event.listen(engine, 'connect', self._on_connect)
        event.listen(engine, 'checkout', self._on_checkout)
        event.listen(engine, 'checkin', self._on_checkin)
        
        self.logger.info("Database engine registered for monitoring", engine=str(engine.url))
    
    def _before_cursor_execute(self, conn, cursor, statement, parameters, context, executemany):
        """Called before SQL execution."""
        context._query_start_time = time.time()
        context._query_statement = statement
    
    def _after_cursor_execute(self, conn, cursor, statement, parameters, context, executemany):
        """Called after SQL execution."""
        if not hasattr(context, '_query_start_time'):
            return
        
        execution_time = time.time() - context._query_start_time
        
        # Normalize query for statistics (remove parameters)
        normalized_query = self._normalize_query(statement)
        
        # Update statistics
        stats = self.query_stats[normalized_query]
        stats['count'] += 1
        stats['total_time'] += execution_time
        stats['max_time'] = max(stats['max_time'], execution_time)
        stats['min_time'] = min(stats['min_time'], execution_time)
        stats['avg_time'] = stats['total_time'] / stats['count']
        
        # Check for slow queries
        if execution_time > self.config.slow_query_threshold:
            stats['slow_queries'] += 1
            
            slow_query = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'query': statement,
                'execution_time': execution_time,
                'parameters': str(parameters) if parameters else None
            }
            
            self.slow_queries.append(slow_query)
            
            # Keep only recent slow queries
            if len(self.slow_queries) > self.config.max_slow_queries:
                self.slow_queries.pop(0)
            
            self.logger.warning("Slow query detected", 
                              execution_time=execution_time,
                              query=statement[:200])
    
    def _on_connect(self, dbapi_connection, connection_record):
        """Called when a new database connection is created."""
        self.logger.debug("New database connection created")
    
    def _on_checkout(self, dbapi_connection, connection_record, connection_proxy):
        """Called when a connection is retrieved from the pool."""
        pass
    
    def _on_checkin(self, dbapi_connection, connection_record):
        """Called when a connection is returned to the pool."""
        pass
    
    def _normalize_query(self, query: str) -> str:
        """Normalize query for statistics by removing parameters."""
        # Simple normalization - replace parameter placeholders
        import re
        normalized = re.sub(r'\?', '?', query)
        normalized = re.sub(r':\w+', ':param', normalized)
        normalized = re.sub(r'\$\d+', '$param', normalized)
        return normalized.strip()
    
    def collect_database_metrics(self) -> DatabaseMetrics:
        """Collect current database performance metrics."""
        try:
            total_pool_size = 0
            total_active = 0
            total_idle = 0
            
            for engine in self.engines:
                if hasattr(engine.pool, 'size'):
                    total_pool_size += engine.pool.size()
                if hasattr(engine.pool, 'checked_out'):
                    total_active += engine.pool.checked_out()
                if hasattr(engine.pool, 'checked_in'):
                    total_idle += engine.pool.checked_in()
            
            # Calculate query statistics
            total_queries = sum(stats['count'] for stats in self.query_stats.values())
            total_slow_queries = sum(stats['slow_queries'] for stats in self.query_stats.values())
            
            avg_query_time = 0.0
            max_query_time = 0.0
            if self.query_stats:
                total_time = sum(stats['total_time'] for stats in self.query_stats.values())
                if total_queries > 0:
                    avg_query_time = total_time / total_queries
                max_query_time = max((stats['max_time'] for stats in self.query_stats.values()), default=0.0)
            
            metrics = DatabaseMetrics(
                timestamp=datetime.now(timezone.utc),
                connection_pool_size=total_pool_size,
                active_connections=total_active,
                idle_connections=total_idle,
                query_count=total_queries,
                slow_query_count=total_slow_queries,
                average_query_time=avg_query_time,
                longest_query_time=max_query_time
            )
            
            self.connection_metrics.append(metrics)
            
            # Keep only recent metrics
            if len(self.connection_metrics) > self.config.max_db_metrics:
                self.connection_metrics.pop(0)
            
            return metrics
            
        except Exception as e:
            self.logger.error("Failed to collect database metrics", error=str(e))
            raise PerformanceError(f"Failed to collect database metrics: {e}")
    
    def get_query_statistics(self) -> Dict[str, Any]:
        """Get query performance statistics."""
        return dict(self.query_stats)
    
    def get_slow_queries(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent slow queries."""
        return self.slow_queries[-limit:]
    
    def get_top_queries_by_time(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top queries by total execution time."""
        sorted_queries = sorted(
            self.query_stats.items(),
            key=lambda x: x[1]['total_time'],
            reverse=True
        )
        
        return [
            {
                'query': query,
                'stats': stats
            }
            for query, stats in sorted_queries[:limit]
        ]
    
    def get_connection_metrics_history(self, hours: int = 24) -> List[DatabaseMetrics]:
        """Get connection metrics history."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        return [m for m in self.connection_metrics if m.timestamp >= cutoff_time]
    
    def reset_statistics(self):
        """Reset all query statistics."""
        self.query_stats.clear()
        self.slow_queries.clear()
        self.logger.info("Database statistics reset")


class APMCollector:
    """Application Performance Monitoring collector."""
    
    def __init__(self, config: PerformanceConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        
        # Initialize components
        self.profiler = PerformanceProfiler(config)
        self.memory_monitor = MemoryMonitor(config)
        self.db_monitor = DatabasePerformanceMonitor(config)
        self.query_optimizer = QueryOptimizer(config)
        
        # Metrics storage
        self.metrics_history: deque = deque(maxlen=config.max_metrics_history)
        self.is_collecting = False
        self.collection_task: Optional[asyncio.Task] = None
        
        # Performance counters
        self.counters: Dict[str, int] = defaultdict(int)
        self.timers: Dict[str, List[float]] = defaultdict(list)
        
    async def start_collection(self):
        """Start performance metrics collection."""
        if self.is_collecting:
            self.logger.warning("APM collection is already running")
            return
        
        self.is_collecting = True
        self.collection_task = asyncio.create_task(self._collection_loop())
        self.logger.info("APM collection started", interval=self.config.collection_interval)
    
    async def stop_collection(self):
        """Stop performance metrics collection."""
        if not self.is_collecting:
            return
        
        self.is_collecting = False
        if self.collection_task:
            self.collection_task.cancel()
            try:
                await self.collection_task
            except asyncio.CancelledError:
                pass
        
        self.logger.info("APM collection stopped")
    
    async def _collection_loop(self):
        """Main collection loop."""
        while self.is_collecting:
            try:
                await self.collect_metrics()
                await asyncio.sleep(self.config.collection_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error("Error in APM collection loop", error=str(e))
                await asyncio.sleep(60)  # Wait before retrying
    
    async def collect_metrics(self) -> PerformanceMetrics:
        """Collect comprehensive performance metrics."""
        try:
            # System metrics
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            
            # Process metrics
            process = psutil.Process()
            process_memory = process.memory_info()
            
            # I/O metrics
            io_counters = process.io_counters()
            net_io = psutil.net_io_counters()
            
            # Thread and file descriptor counts
            thread_count = process.num_threads()
            try:
                fd_count = process.num_fds()  # Unix only
            except (AttributeError, psutil.AccessDenied):
                fd_count = 0
            
            # Context switches
            try:
                ctx_switches = process.num_ctx_switches().voluntary + process.num_ctx_switches().involuntary
            except (AttributeError, psutil.AccessDenied):
                ctx_switches = 0
            
            # Application-specific metrics
            cache_hit_ratio = self._calculate_cache_hit_ratio()
            processing_time_avg = self._calculate_avg_processing_time()
            error_rate = self._calculate_error_rate()
            
            metrics = PerformanceMetrics(
                timestamp=datetime.now(timezone.utc),
                cpu_usage=cpu_percent,
                memory_usage=memory.percent,
                memory_rss=process_memory.rss,
                memory_vms=process_memory.vms,
                disk_io_read=io_counters.read_bytes,
                disk_io_write=io_counters.write_bytes,
                network_io_sent=net_io.bytes_sent,
                network_io_recv=net_io.bytes_recv,
                thread_count=thread_count,
                file_descriptors=fd_count,
                context_switches=ctx_switches,
                cache_hit_ratio=cache_hit_ratio,
                processing_time_avg=processing_time_avg,
                error_rate=error_rate
            )
            
            self.metrics_history.append(metrics)
            
            # Also take memory snapshot
            self.memory_monitor.take_snapshot()
            
            # Collect database metrics
            self.db_monitor.collect_database_metrics()
            
            return metrics
            
        except Exception as e:
            self.logger.error("Failed to collect performance metrics", error=str(e))
            raise PerformanceError(f"Failed to collect performance metrics: {e}")
    
    def _calculate_cache_hit_ratio(self) -> float:
        """Calculate cache hit ratio from counters."""
        hits = self.counters.get('cache_hits', 0)
        misses = self.counters.get('cache_misses', 0)
        total = hits + misses
        return (hits / total * 100) if total > 0 else 0.0
    
    def _calculate_avg_processing_time(self) -> float:
        """Calculate average processing time from timers."""
        processing_times = self.timers.get('processing_time', [])
        return sum(processing_times) / len(processing_times) if processing_times else 0.0
    
    def _calculate_error_rate(self) -> float:
        """Calculate error rate from counters."""
        errors = self.counters.get('errors', 0)
        total_requests = self.counters.get('total_requests', 0)
        return (errors / total_requests * 100) if total_requests > 0 else 0.0
    
    def increment_counter(self, name: str, value: int = 1):
        """Increment a performance counter."""
        self.counters[name] += value
    
    def record_timer(self, name: str, value: float):
        """Record a timer value."""
        self.timers[name].append(value)
        
        # Keep only recent values
        max_values = self.config.max_timer_values
        if len(self.timers[name]) > max_values:
            self.timers[name] = self.timers[name][-max_values:]
    
    @asynccontextmanager
    async def measure_time(self, name: str):
        """Context manager for measuring execution time."""
        start_time = time.time()
        try:
            yield
        finally:
            execution_time = time.time() - start_time
            self.record_timer(name, execution_time)
    
    def register_database_engine(self, engine: Engine):
        """Register a database engine for monitoring."""
        self.db_monitor.register_engine(engine)
        self.query_optimizer.register_engine(engine)
    
    def get_recent_metrics(self, count: int = 100) -> List[PerformanceMetrics]:
        """Get recent performance metrics."""
        return list(self.metrics_history)[-count:]
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary."""
        if not self.metrics_history:
            return {'error': 'No metrics available'}
        
        recent_metrics = list(self.metrics_history)[-10:]  # Last 10 metrics
        
        return {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'metrics_count': len(self.metrics_history),
            'current_metrics': recent_metrics[-1].to_dict() if recent_metrics else None,
            'averages': {
                'cpu_usage': sum(m.cpu_usage for m in recent_metrics) / len(recent_metrics),
                'memory_usage': sum(m.memory_usage for m in recent_metrics) / len(recent_metrics),
                'processing_time': sum(m.processing_time_avg for m in recent_metrics) / len(recent_metrics),
            },
            'counters': dict(self.counters),
            'profiling_results': self.profiler.get_all_profile_results(),
            'memory_trend': self.memory_monitor.get_memory_trend(),
            'database_metrics': self.db_monitor.get_query_statistics(),
            'query_optimization': self.query_optimizer.get_optimization_report()
        }
    
    def get_comprehensive_report(self) -> Dict[str, Any]:
        """Get comprehensive performance report."""
        return {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'performance_summary': self.get_performance_summary(),
            'memory_analysis': {
                'current_snapshot': self.memory_monitor.take_snapshot().to_dict(),
                'memory_trend': self.memory_monitor.get_memory_trend(),
                'leak_detection': self.memory_monitor.detect_memory_leaks(),
                'object_counts': self.memory_monitor.get_object_counts()
            },
            'database_analysis': {
                'current_metrics': self.db_monitor.collect_database_metrics().to_dict(),
                'query_statistics': self.db_monitor.get_query_statistics(),
                'slow_queries': self.db_monitor.get_slow_queries(10),
                'top_queries': self.db_monitor.get_top_queries_by_time(10)
            },
            'profiling_results': self.profiler.get_all_profile_results(),
            'optimization_recommendations': self.query_optimizer.get_optimization_report()
        }
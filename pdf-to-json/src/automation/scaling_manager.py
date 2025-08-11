"""
Scaling Manager for Horizontal Scaling and Load Balancing.

This module provides:
- Horizontal scaling support for worker instances
- Load balancing across multiple workers
- Auto-scaling based on queue length and system metrics
- Health monitoring of worker instances
- Dynamic worker registration and deregistration
"""

import asyncio
import logging
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Set, Callable, Awaitable
from dataclasses import dataclass, field
from enum import Enum
import json
import hashlib
import random

from .exceptions import ScalingManagerError
from .models import JobStatus


class WorkerStatus(Enum):
    """Status of a worker instance."""
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    STARTING = "starting"
    STOPPING = "stopping"
    OFFLINE = "offline"


class LoadBalancingStrategy(Enum):
    """Load balancing strategies."""
    ROUND_ROBIN = "round_robin"
    LEAST_CONNECTIONS = "least_connections"
    WEIGHTED_ROUND_ROBIN = "weighted_round_robin"
    CONSISTENT_HASH = "consistent_hash"
    RESOURCE_BASED = "resource_based"


@dataclass
class WorkerInstance:
    """Represents a worker instance."""
    worker_id: str
    host: str
    port: int
    status: WorkerStatus
    last_heartbeat: datetime
    active_jobs: int = 0
    max_jobs: int = 10
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    weight: float = 1.0
    capabilities: Set[str] = field(default_factory=set)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def is_healthy(self) -> bool:
        """Check if worker is healthy."""
        return (
            self.status == WorkerStatus.HEALTHY and
            (datetime.now(timezone.utc) - self.last_heartbeat).total_seconds() < 60
        )
    
    @property
    def load_factor(self) -> float:
        """Calculate current load factor (0.0 to 1.0)."""
        if self.max_jobs == 0:
            return 1.0
        return min(self.active_jobs / self.max_jobs, 1.0)
    
    @property
    def available_capacity(self) -> int:
        """Get available job capacity."""
        return max(0, self.max_jobs - self.active_jobs)


@dataclass
class ScalingConfig:
    """Configuration for scaling behavior."""
    # Auto-scaling settings
    enable_auto_scaling: bool = True
    min_workers: int = 1
    max_workers: int = 10
    scale_up_threshold: float = 0.8  # Scale up when average load > 80%
    scale_down_threshold: float = 0.3  # Scale down when average load < 30%
    scale_up_cooldown: int = 300  # Seconds to wait before scaling up again
    scale_down_cooldown: int = 600  # Seconds to wait before scaling down again
    
    # Load balancing
    load_balancing_strategy: LoadBalancingStrategy = LoadBalancingStrategy.LEAST_CONNECTIONS
    health_check_interval: int = 30
    heartbeat_timeout: int = 60
    
    # Worker management
    worker_startup_timeout: int = 120
    worker_shutdown_timeout: int = 60
    max_job_assignment_retries: int = 3
    
    # Queue management
    queue_length_threshold: int = 20
    job_distribution_batch_size: int = 5


@dataclass
class ScalingMetrics:
    """Metrics for scaling decisions."""
    total_workers: int
    healthy_workers: int
    total_capacity: int
    used_capacity: int
    queue_length: int
    average_load: float
    cpu_usage: float
    memory_usage: float
    jobs_per_minute: float
    last_scale_action: Optional[datetime]
    scale_actions_count: int


class ScalingManager:
    """
    Manages horizontal scaling and load balancing for worker instances.
    
    Features:
    - Auto-scaling based on load and queue metrics
    - Multiple load balancing strategies
    - Health monitoring and failover
    - Dynamic worker registration
    - Job distribution and routing
    """
    
    def __init__(self, config: ScalingConfig):
        """
        Initialize the scaling manager.
        
        Args:
            config: Scaling configuration
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Worker registry
        self.workers: Dict[str, WorkerInstance] = {}
        self.worker_round_robin_index = 0
        
        # Scaling state
        self.is_running = False
        self.last_scale_up: Optional[datetime] = None
        self.last_scale_down: Optional[datetime] = None
        self.scale_actions_count = 0
        
        # Metrics tracking
        self.metrics_history: List[ScalingMetrics] = []
        self.jobs_completed_last_minute = 0
        self.last_metrics_update = datetime.now(timezone.utc)
        
        # Tasks
        self.health_check_task: Optional[asyncio.Task] = None
        self.auto_scaling_task: Optional[asyncio.Task] = None
        self.metrics_collection_task: Optional[asyncio.Task] = None
        
        # Callbacks
        self.scale_up_callback: Optional[Callable[[int], Awaitable[List[str]]]] = None
        self.scale_down_callback: Optional[Callable[[List[str]], Awaitable[None]]] = None
        self.job_assignment_callback: Optional[Callable[[str, str], Awaitable[bool]]] = None
        
        # Job queue reference (set by processing manager)
        self.job_queue = None
    
    async def start(self) -> None:
        """Start the scaling manager."""
        if self.is_running:
            self.logger.warning("Scaling manager is already running")
            return
        
        self.logger.info("Starting scaling manager")
        self.is_running = True
        
        # Start background tasks
        self.health_check_task = asyncio.create_task(self._health_check_loop())
        self.metrics_collection_task = asyncio.create_task(self._metrics_collection_loop())
        
        if self.config.enable_auto_scaling:
            self.auto_scaling_task = asyncio.create_task(self._auto_scaling_loop())
        
        self.logger.info("Scaling manager started successfully")
    
    async def stop(self) -> None:
        """Stop the scaling manager."""
        if not self.is_running:
            return
        
        self.logger.info("Stopping scaling manager")
        self.is_running = False
        
        # Cancel background tasks
        for task in [self.health_check_task, self.auto_scaling_task, self.metrics_collection_task]:
            if task:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        
        self.logger.info("Scaling manager stopped")
    
    def set_callbacks(self, 
                     scale_up_callback: Callable[[int], Awaitable[List[str]]] = None,
                     scale_down_callback: Callable[[List[str]], Awaitable[None]] = None,
                     job_assignment_callback: Callable[[str, str], Awaitable[bool]] = None):
        """Set callbacks for scaling operations."""
        if scale_up_callback:
            self.scale_up_callback = scale_up_callback
        if scale_down_callback:
            self.scale_down_callback = scale_down_callback
        if job_assignment_callback:
            self.job_assignment_callback = job_assignment_callback
    
    def set_job_queue_reference(self, job_queue):
        """Set reference to the job queue."""
        self.job_queue = job_queue
    
    async def register_worker(self, worker_id: str, host: str, port: int, 
                            max_jobs: int = 10, capabilities: Set[str] = None,
                            metadata: Dict[str, Any] = None) -> None:
        """
        Register a new worker instance.
        
        Args:
            worker_id: Unique worker identifier
            host: Worker host address
            port: Worker port
            max_jobs: Maximum concurrent jobs for this worker
            capabilities: Set of worker capabilities
            metadata: Additional worker metadata
        """
        if capabilities is None:
            capabilities = set()
        if metadata is None:
            metadata = {}
        
        worker = WorkerInstance(
            worker_id=worker_id,
            host=host,
            port=port,
            status=WorkerStatus.STARTING,
            last_heartbeat=datetime.now(timezone.utc),
            max_jobs=max_jobs,
            capabilities=capabilities,
            metadata=metadata
        )
        
        self.workers[worker_id] = worker
        self.logger.info(f"Registered worker: {worker_id} at {host}:{port}")
        
        # Perform initial health check
        await self._check_worker_health(worker_id)
    
    async def deregister_worker(self, worker_id: str) -> None:
        """
        Deregister a worker instance.
        
        Args:
            worker_id: Worker identifier to deregister
        """
        if worker_id in self.workers:
            worker = self.workers[worker_id]
            worker.status = WorkerStatus.STOPPING
            
            # Wait for active jobs to complete or timeout
            timeout = self.config.worker_shutdown_timeout
            start_time = time.time()
            
            while worker.active_jobs > 0 and (time.time() - start_time) < timeout:
                await asyncio.sleep(1)
            
            del self.workers[worker_id]
            self.logger.info(f"Deregistered worker: {worker_id}")
        else:
            self.logger.warning(f"Attempted to deregister unknown worker: {worker_id}")
    
    async def update_worker_heartbeat(self, worker_id: str, 
                                    active_jobs: int = None,
                                    cpu_usage: float = None,
                                    memory_usage: float = None) -> None:
        """
        Update worker heartbeat and metrics.
        
        Args:
            worker_id: Worker identifier
            active_jobs: Current number of active jobs
            cpu_usage: CPU usage percentage (0-100)
            memory_usage: Memory usage percentage (0-100)
        """
        if worker_id not in self.workers:
            self.logger.warning(f"Heartbeat from unknown worker: {worker_id}")
            return
        
        worker = self.workers[worker_id]
        worker.last_heartbeat = datetime.now(timezone.utc)
        
        if active_jobs is not None:
            worker.active_jobs = active_jobs
        if cpu_usage is not None:
            worker.cpu_usage = cpu_usage
        if memory_usage is not None:
            worker.memory_usage = memory_usage
        
        # Update status to healthy if it was starting
        if worker.status == WorkerStatus.STARTING:
            worker.status = WorkerStatus.HEALTHY
            self.logger.info(f"Worker {worker_id} is now healthy")
    
    async def assign_job(self, job_id: str, job_requirements: Dict[str, Any] = None) -> Optional[str]:
        """
        Assign a job to the best available worker.
        
        Args:
            job_id: Job identifier
            job_requirements: Job requirements (capabilities, resources, etc.)
            
        Returns:
            Worker ID if assignment successful, None otherwise
        """
        if job_requirements is None:
            job_requirements = {}
        
        # Get eligible workers
        eligible_workers = self._get_eligible_workers(job_requirements)
        
        if not eligible_workers:
            self.logger.warning(f"No eligible workers available for job {job_id}")
            return None
        
        # Select worker based on load balancing strategy
        selected_worker = self._select_worker(eligible_workers)
        
        if not selected_worker:
            self.logger.warning(f"No worker selected for job {job_id}")
            return None
        
        # Attempt to assign job
        for attempt in range(self.config.max_job_assignment_retries):
            try:
                if self.job_assignment_callback:
                    success = await self.job_assignment_callback(selected_worker.worker_id, job_id)
                    if success:
                        selected_worker.active_jobs += 1
                        self.logger.info(f"Assigned job {job_id} to worker {selected_worker.worker_id}")
                        return selected_worker.worker_id
                else:
                    # Fallback: just update the counter
                    selected_worker.active_jobs += 1
                    return selected_worker.worker_id
                
            except Exception as e:
                self.logger.error(f"Failed to assign job {job_id} to worker {selected_worker.worker_id} (attempt {attempt + 1}): {e}")
                
                # Try next best worker
                eligible_workers.remove(selected_worker)
                if eligible_workers:
                    selected_worker = self._select_worker(eligible_workers)
                else:
                    break
        
        self.logger.error(f"Failed to assign job {job_id} after {self.config.max_job_assignment_retries} attempts")
        return None
    
    async def job_completed(self, worker_id: str, job_id: str) -> None:
        """
        Notify that a job has been completed.
        
        Args:
            worker_id: Worker that completed the job
            job_id: Completed job identifier
        """
        if worker_id in self.workers:
            worker = self.workers[worker_id]
            worker.active_jobs = max(0, worker.active_jobs - 1)
            self.jobs_completed_last_minute += 1
            self.logger.debug(f"Job {job_id} completed on worker {worker_id}")
        else:
            self.logger.warning(f"Job completion notification from unknown worker: {worker_id}")
    
    def _get_eligible_workers(self, job_requirements: Dict[str, Any]) -> List[WorkerInstance]:
        """Get workers eligible for a job based on requirements."""
        eligible = []
        
        for worker in self.workers.values():
            if not worker.is_healthy:
                continue
            
            if worker.available_capacity <= 0:
                continue
            
            # Check capability requirements
            required_capabilities = set(job_requirements.get('capabilities', []))
            if required_capabilities and not required_capabilities.issubset(worker.capabilities):
                continue
            
            # Check resource requirements
            min_memory = job_requirements.get('min_memory_mb', 0)
            if min_memory > 0 and worker.memory_usage > 90:  # Skip if memory is too high
                continue
            
            eligible.append(worker)
        
        return eligible
    
    def _select_worker(self, eligible_workers: List[WorkerInstance]) -> Optional[WorkerInstance]:
        """Select the best worker based on load balancing strategy."""
        if not eligible_workers:
            return None
        
        strategy = self.config.load_balancing_strategy
        
        if strategy == LoadBalancingStrategy.ROUND_ROBIN:
            return self._select_round_robin(eligible_workers)
        elif strategy == LoadBalancingStrategy.LEAST_CONNECTIONS:
            return self._select_least_connections(eligible_workers)
        elif strategy == LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN:
            return self._select_weighted_round_robin(eligible_workers)
        elif strategy == LoadBalancingStrategy.CONSISTENT_HASH:
            return self._select_consistent_hash(eligible_workers)
        elif strategy == LoadBalancingStrategy.RESOURCE_BASED:
            return self._select_resource_based(eligible_workers)
        else:
            return eligible_workers[0]  # Fallback
    
    def _select_round_robin(self, workers: List[WorkerInstance]) -> WorkerInstance:
        """Select worker using round-robin strategy."""
        worker = workers[self.worker_round_robin_index % len(workers)]
        self.worker_round_robin_index += 1
        return worker
    
    def _select_least_connections(self, workers: List[WorkerInstance]) -> WorkerInstance:
        """Select worker with least active connections."""
        return min(workers, key=lambda w: w.active_jobs)
    
    def _select_weighted_round_robin(self, workers: List[WorkerInstance]) -> WorkerInstance:
        """Select worker using weighted round-robin strategy."""
        # Create weighted list
        weighted_workers = []
        for worker in workers:
            weight = max(1, int(worker.weight * 10))  # Scale weight
            weighted_workers.extend([worker] * weight)
        
        if weighted_workers:
            worker = weighted_workers[self.worker_round_robin_index % len(weighted_workers)]
            self.worker_round_robin_index += 1
            return worker
        
        return workers[0]
    
    def _select_consistent_hash(self, workers: List[WorkerInstance]) -> WorkerInstance:
        """Select worker using consistent hashing."""
        # Simple hash-based selection
        hash_input = f"{time.time()}{random.random()}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        return workers[hash_value % len(workers)]
    
    def _select_resource_based(self, workers: List[WorkerInstance]) -> WorkerInstance:
        """Select worker based on resource availability."""
        # Score based on available capacity and resource usage
        def score_worker(worker: WorkerInstance) -> float:
            capacity_score = worker.available_capacity / worker.max_jobs
            cpu_score = (100 - worker.cpu_usage) / 100
            memory_score = (100 - worker.memory_usage) / 100
            return (capacity_score * 0.5) + (cpu_score * 0.3) + (memory_score * 0.2)
        
        return max(workers, key=score_worker)
    
    async def _health_check_loop(self) -> None:
        """Background task for health checking workers."""
        while self.is_running:
            try:
                for worker_id in list(self.workers.keys()):
                    await self._check_worker_health(worker_id)
                
                await asyncio.sleep(self.config.health_check_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in health check loop: {e}")
                await asyncio.sleep(10)
    
    async def _check_worker_health(self, worker_id: str) -> None:
        """Check health of a specific worker."""
        if worker_id not in self.workers:
            return
        
        worker = self.workers[worker_id]
        
        # Check heartbeat timeout
        time_since_heartbeat = (datetime.now(timezone.utc) - worker.last_heartbeat).total_seconds()
        
        if time_since_heartbeat > self.config.heartbeat_timeout:
            if worker.status == WorkerStatus.HEALTHY:
                worker.status = WorkerStatus.UNHEALTHY
                self.logger.warning(f"Worker {worker_id} marked as unhealthy (no heartbeat for {time_since_heartbeat:.1f}s)")
        else:
            if worker.status == WorkerStatus.UNHEALTHY:
                worker.status = WorkerStatus.HEALTHY
                self.logger.info(f"Worker {worker_id} recovered and marked as healthy")
    
    async def _auto_scaling_loop(self) -> None:
        """Background task for auto-scaling decisions."""
        while self.is_running:
            try:
                await self._evaluate_scaling()
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in auto-scaling loop: {e}")
                await asyncio.sleep(60)
    
    async def _evaluate_scaling(self) -> None:
        """Evaluate if scaling action is needed."""
        metrics = self._calculate_current_metrics()
        
        # Check if we need to scale up
        if self._should_scale_up(metrics):
            await self._scale_up()
        
        # Check if we need to scale down
        elif self._should_scale_down(metrics):
            await self._scale_down()
    
    def _should_scale_up(self, metrics: ScalingMetrics) -> bool:
        """Determine if we should scale up."""
        if metrics.healthy_workers >= self.config.max_workers:
            return False
        
        # Check cooldown period
        if self.last_scale_up:
            time_since_scale = (datetime.now(timezone.utc) - self.last_scale_up).total_seconds()
            if time_since_scale < self.config.scale_up_cooldown:
                return False
        
        # Check load threshold
        if metrics.average_load > self.config.scale_up_threshold:
            return True
        
        # Check queue length
        if metrics.queue_length > self.config.queue_length_threshold:
            return True
        
        return False
    
    def _should_scale_down(self, metrics: ScalingMetrics) -> bool:
        """Determine if we should scale down."""
        if metrics.healthy_workers <= self.config.min_workers:
            return False
        
        # Check cooldown period
        if self.last_scale_down:
            time_since_scale = (datetime.now(timezone.utc) - self.last_scale_down).total_seconds()
            if time_since_scale < self.config.scale_down_cooldown:
                return False
        
        # Check load threshold
        if metrics.average_load < self.config.scale_down_threshold:
            return True
        
        return False
    
    async def _scale_up(self) -> None:
        """Scale up by adding workers."""
        if not self.scale_up_callback:
            self.logger.warning("Scale up requested but no callback configured")
            return
        
        # Determine how many workers to add
        current_workers = len([w for w in self.workers.values() if w.is_healthy])
        target_workers = min(current_workers + 1, self.config.max_workers)
        workers_to_add = target_workers - current_workers
        
        if workers_to_add <= 0:
            return
        
        self.logger.info(f"Scaling up: adding {workers_to_add} workers")
        
        try:
            new_worker_ids = await self.scale_up_callback(workers_to_add)
            self.last_scale_up = datetime.now(timezone.utc)
            self.scale_actions_count += 1
            
            self.logger.info(f"Scale up completed: added workers {new_worker_ids}")
            
        except Exception as e:
            self.logger.error(f"Scale up failed: {e}")
    
    async def _scale_down(self) -> None:
        """Scale down by removing workers."""
        if not self.scale_down_callback:
            self.logger.warning("Scale down requested but no callback configured")
            return
        
        # Select workers to remove (prefer those with least load)
        healthy_workers = [w for w in self.workers.values() if w.is_healthy]
        current_workers = len(healthy_workers)
        target_workers = max(current_workers - 1, self.config.min_workers)
        workers_to_remove = current_workers - target_workers
        
        if workers_to_remove <= 0:
            return
        
        # Sort by load and select least loaded workers
        workers_by_load = sorted(healthy_workers, key=lambda w: w.active_jobs)
        workers_to_remove_list = [w.worker_id for w in workers_by_load[:workers_to_remove]]
        
        self.logger.info(f"Scaling down: removing workers {workers_to_remove_list}")
        
        try:
            await self.scale_down_callback(workers_to_remove_list)
            self.last_scale_down = datetime.now(timezone.utc)
            self.scale_actions_count += 1
            
            self.logger.info(f"Scale down completed: removed workers {workers_to_remove_list}")
            
        except Exception as e:
            self.logger.error(f"Scale down failed: {e}")
    
    async def _metrics_collection_loop(self) -> None:
        """Background task for collecting metrics."""
        while self.is_running:
            try:
                metrics = self._calculate_current_metrics()
                self.metrics_history.append(metrics)
                
                # Keep only last hour of metrics
                cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)
                self.metrics_history = [
                    m for m in self.metrics_history 
                    if hasattr(m, 'timestamp') and m.timestamp > cutoff_time
                ]
                
                # Reset per-minute counters
                self.jobs_completed_last_minute = 0
                self.last_metrics_update = datetime.now(timezone.utc)
                
                await asyncio.sleep(60)  # Collect metrics every minute
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in metrics collection loop: {e}")
                await asyncio.sleep(60)
    
    def _calculate_current_metrics(self) -> ScalingMetrics:
        """Calculate current scaling metrics."""
        healthy_workers = [w for w in self.workers.values() if w.is_healthy]
        
        total_capacity = sum(w.max_jobs for w in healthy_workers)
        used_capacity = sum(w.active_jobs for w in healthy_workers)
        
        average_load = (used_capacity / total_capacity) if total_capacity > 0 else 0.0
        
        # Calculate average resource usage
        avg_cpu = sum(w.cpu_usage for w in healthy_workers) / len(healthy_workers) if healthy_workers else 0.0
        avg_memory = sum(w.memory_usage for w in healthy_workers) / len(healthy_workers) if healthy_workers else 0.0
        
        # Get queue length
        queue_length = len(self.job_queue) if self.job_queue else 0
        
        return ScalingMetrics(
            total_workers=len(self.workers),
            healthy_workers=len(healthy_workers),
            total_capacity=total_capacity,
            used_capacity=used_capacity,
            queue_length=queue_length,
            average_load=average_load,
            cpu_usage=avg_cpu,
            memory_usage=avg_memory,
            jobs_per_minute=self.jobs_completed_last_minute,
            last_scale_action=self.last_scale_up or self.last_scale_down,
            scale_actions_count=self.scale_actions_count
        )
    
    def get_scaling_status(self) -> Dict[str, Any]:
        """Get current scaling status."""
        metrics = self._calculate_current_metrics()
        
        return {
            'is_running': self.is_running,
            'config': {
                'min_workers': self.config.min_workers,
                'max_workers': self.config.max_workers,
                'auto_scaling_enabled': self.config.enable_auto_scaling,
                'load_balancing_strategy': self.config.load_balancing_strategy.value
            },
            'workers': {
                worker_id: {
                    'status': worker.status.value,
                    'active_jobs': worker.active_jobs,
                    'max_jobs': worker.max_jobs,
                    'load_factor': worker.load_factor,
                    'cpu_usage': worker.cpu_usage,
                    'memory_usage': worker.memory_usage,
                    'last_heartbeat': worker.last_heartbeat.isoformat()
                }
                for worker_id, worker in self.workers.items()
            },
            'metrics': {
                'total_workers': metrics.total_workers,
                'healthy_workers': metrics.healthy_workers,
                'total_capacity': metrics.total_capacity,
                'used_capacity': metrics.used_capacity,
                'queue_length': metrics.queue_length,
                'average_load': metrics.average_load,
                'jobs_per_minute': metrics.jobs_per_minute,
                'scale_actions_count': metrics.scale_actions_count
            },
            'last_scale_actions': {
                'last_scale_up': self.last_scale_up.isoformat() if self.last_scale_up else None,
                'last_scale_down': self.last_scale_down.isoformat() if self.last_scale_down else None
            }
        }
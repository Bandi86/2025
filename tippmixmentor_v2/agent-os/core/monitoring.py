from prometheus_client import Counter, Histogram, Gauge, Summary, generate_latest
import structlog
from core.config import settings

logger = structlog.get_logger()

# Agent metrics
AGENT_CREATED = Counter('agent_created_total', 'Total agents created', ['agent_type'])
AGENT_ACTIVE = Gauge('agent_active_total', 'Total active agents', ['agent_type'])
AGENT_TASKS_COMPLETED = Counter('agent_tasks_completed_total', 'Total tasks completed', ['agent_type', 'task_type'])
AGENT_TASKS_FAILED = Counter('agent_tasks_failed_total', 'Total tasks failed', ['agent_type', 'task_type'])

# Task metrics
TASK_DURATION = Histogram('task_duration_seconds', 'Task duration in seconds', ['task_type'])
TASK_QUEUE_SIZE = Gauge('task_queue_size', 'Current task queue size')
TASK_PROCESSING_TIME = Summary('task_processing_seconds', 'Task processing time', ['task_type'])

# Prediction metrics
PREDICTIONS_MADE = Counter('predictions_made_total', 'Total predictions made', ['prediction_type'])
PREDICTION_ACCURACY = Gauge('prediction_accuracy', 'Prediction accuracy', ['prediction_type'])
PREDICTION_CONFIDENCE = Histogram('prediction_confidence', 'Prediction confidence scores', ['prediction_type'])

# API metrics
API_REQUESTS = Counter('api_requests_total', 'Total API requests', ['method', 'endpoint', 'status'])
API_RESPONSE_TIME = Histogram('api_response_time_seconds', 'API response time', ['endpoint'])

# System metrics
SYSTEM_MEMORY_USAGE = Gauge('system_memory_bytes', 'System memory usage in bytes')
SYSTEM_CPU_USAGE = Gauge('system_cpu_percent', 'System CPU usage percentage')
SYSTEM_DISK_USAGE = Gauge('system_disk_bytes', 'System disk usage in bytes')

# Agent OS specific metrics
AGENT_MEMORY_USAGE = Gauge('agent_memory_bytes', 'Agent memory usage', ['agent_id'])
AGENT_INSIGHTS_GENERATED = Counter('agent_insights_generated_total', 'Total insights generated', ['agent_type', 'insight_type'])
AGENT_WORKFLOWS_EXECUTED = Counter('agent_workflows_executed_total', 'Total workflows executed', ['workflow_type'])

def setup_monitoring():
    """Setup monitoring and metrics"""
    if not settings.ENABLE_METRICS:
        logger.info("Metrics collection disabled")
        return
    
    logger.info("Setting up monitoring and metrics collection")

def record_agent_created(agent_type: str):
    """Record agent creation"""
    AGENT_CREATED.labels(agent_type=agent_type).inc()

def record_agent_active(agent_type: str, count: int):
    """Record active agent count"""
    AGENT_ACTIVE.labels(agent_type=agent_type).set(count)

def record_task_completed(agent_type: str, task_type: str, duration: float):
    """Record task completion"""
    AGENT_TASKS_COMPLETED.labels(agent_type=agent_type, task_type=task_type).inc()
    TASK_DURATION.labels(task_type=task_type).observe(duration)

def record_task_failed(agent_type: str, task_type: str):
    """Record task failure"""
    AGENT_TASKS_FAILED.labels(agent_type=agent_type, task_type=task_type).inc()

def record_prediction_made(prediction_type: str, confidence: float):
    """Record prediction made"""
    PREDICTIONS_MADE.labels(prediction_type=prediction_type).inc()
    PREDICTION_CONFIDENCE.labels(prediction_type=prediction_type).observe(confidence)

def record_prediction_accuracy(prediction_type: str, accuracy: float):
    """Record prediction accuracy"""
    PREDICTION_ACCURACY.labels(prediction_type=prediction_type).set(accuracy)

def record_api_request(method: str, endpoint: str, status: int, duration: float):
    """Record API request"""
    API_REQUESTS.labels(method=method, endpoint=endpoint, status=status).inc()
    API_RESPONSE_TIME.labels(endpoint=endpoint).observe(duration)

def record_task_queue_size(size: int):
    """Record task queue size"""
    TASK_QUEUE_SIZE.set(size)

def record_agent_memory_usage(agent_id: str, memory_bytes: int):
    """Record agent memory usage"""
    AGENT_MEMORY_USAGE.labels(agent_id=agent_id).set(memory_bytes)

def record_insight_generated(agent_type: str, insight_type: str):
    """Record insight generation"""
    AGENT_INSIGHTS_GENERATED.labels(agent_type=agent_type, insight_type=insight_type).inc()

def record_workflow_executed(workflow_type: str):
    """Record workflow execution"""
    AGENT_WORKFLOWS_EXECUTED.labels(workflow_type=workflow_type).inc()

def record_workflow_completed(workflow_type: str, duration: float = None):
    """Record workflow completion"""
    # For now, we'll just increment the executed counter since we don't have a separate completed counter
    AGENT_WORKFLOWS_EXECUTED.labels(workflow_type=workflow_type).inc()
    logger.info("Workflow completed", workflow_type=workflow_type, duration=duration)

class MetricsCollector:
    """Metrics collection utility"""
    
    def __init__(self):
        self.logger = structlog.get_logger("metrics")
    
    async def collect_system_metrics(self):
        """Collect system-level metrics"""
        try:
            import psutil
            
            # Memory usage
            memory = psutil.virtual_memory()
            SYSTEM_MEMORY_USAGE.set(memory.used)
            
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            SYSTEM_CPU_USAGE.set(cpu_percent)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            SYSTEM_DISK_USAGE.set(disk.used)
            
        except ImportError:
            self.logger.warning("psutil not available, system metrics disabled")
        except Exception as e:
            self.logger.error("Failed to collect system metrics", error=str(e))
    
    def get_metrics_summary(self) -> dict:
        """Get metrics summary"""
        return {
            "metrics_enabled": settings.ENABLE_METRICS,
            "available_metrics": [
                "agent_created_total",
                "agent_active_total", 
                "agent_tasks_completed_total",
                "agent_tasks_failed_total",
                "task_duration_seconds",
                "task_queue_size",
                "predictions_made_total",
                "prediction_accuracy",
                "prediction_confidence",
                "api_requests_total",
                "api_response_time_seconds",
                "agent_insights_generated_total",
                "agent_workflows_executed_total"
            ]
        }

# Global metrics collector instance
metrics_collector = MetricsCollector() 
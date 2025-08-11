"""
Structured logging configuration for the automation system.

This module sets up structured logging using structlog with proper
formatting, filtering, and output configuration.
"""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Any, Dict, Optional
import structlog
from structlog.types import Processor

from .config import MonitoringConfig, LogLevel


def configure_structured_logging(config: MonitoringConfig) -> None:
    """
    Configure structured logging for the automation system.
    
    Args:
        config: Monitoring configuration
    """
    # Create logs directory if it doesn't exist
    if config.log_file:
        log_path = Path(config.log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, config.log_level.value if hasattr(config.log_level, 'value') else config.log_level)
    )
    
    # Configure structlog processors
    processors = []
    
    # Add timestamp
    processors.append(structlog.stdlib.add_log_level)
    processors.append(structlog.stdlib.add_logger_name)
    processors.append(structlog.processors.TimeStamper(fmt="iso"))
    
    # Add context processors
    processors.append(add_automation_context)
    processors.append(structlog.processors.StackInfoRenderer())
    processors.append(structlog.dev.set_exc_info)
    
    # Add formatting based on configuration
    if config.log_format == "json":
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer(colors=True))
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        context_class=dict,
        cache_logger_on_first_use=True,
    )
    
    # Setup file logging if configured
    if config.log_file:
        setup_file_logging(config)


def add_automation_context(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Add automation-specific context to log entries."""
    event_dict["component"] = "football-automation"
    event_dict["version"] = "1.0.0"  # This could be read from a version file
    return event_dict


def setup_file_logging(config: MonitoringConfig) -> None:
    """Setup file-based logging with rotation."""
    if not config.log_file:
        return
    
    # Create rotating file handler
    file_handler = logging.handlers.RotatingFileHandler(
        config.log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    
    # Set formatter based on configuration
    if config.log_format == "json":
        formatter = logging.Formatter('%(message)s')
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    file_handler.setFormatter(formatter)
    file_handler.setLevel(getattr(logging, config.log_level.value))
    
    # Add to root logger
    root_logger = logging.getLogger()
    root_logger.addHandler(file_handler)


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


class LogAggregator:
    """Aggregates and manages log entries for monitoring."""
    
    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.logger = get_logger(__name__)
        
        # Log storage for recent entries
        self.recent_logs: list = []
        self.max_recent_logs = 1000
        
        # Error tracking
        self.error_counts: Dict[str, int] = {}
        self.warning_counts: Dict[str, int] = {}
    
    def add_log_entry(self, level: str, message: str, context: Dict[str, Any] = None):
        """Add a log entry to the aggregator."""
        entry = {
            'timestamp': structlog.processors.TimeStamper(fmt="iso")(None, None, {})['timestamp'],
            'level': level,
            'message': message,
            'context': context or {}
        }
        
        # Add to recent logs
        self.recent_logs.append(entry)
        if len(self.recent_logs) > self.max_recent_logs:
            self.recent_logs.pop(0)
        
        # Update counters
        if level == 'ERROR':
            component = context.get('component', 'unknown') if context else 'unknown'
            self.error_counts[component] = self.error_counts.get(component, 0) + 1
        elif level == 'WARNING':
            component = context.get('component', 'unknown') if context else 'unknown'
            self.warning_counts[component] = self.warning_counts.get(component, 0) + 1
    
    def get_recent_logs(self, count: int = 100) -> list:
        """Get recent log entries."""
        return self.recent_logs[-count:]
    
    def get_error_summary(self) -> Dict[str, Any]:
        """Get error summary statistics."""
        return {
            'error_counts': self.error_counts.copy(),
            'warning_counts': self.warning_counts.copy(),
            'total_errors': sum(self.error_counts.values()),
            'total_warnings': sum(self.warning_counts.values())
        }
    
    def clear_counters(self):
        """Clear error and warning counters."""
        self.error_counts.clear()
        self.warning_counts.clear()


# Custom structlog processor for log aggregation
class LogAggregatorProcessor:
    """Structlog processor that feeds logs to the aggregator."""
    
    def __init__(self, aggregator: LogAggregator):
        self.aggregator = aggregator
    
    def __call__(self, logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Process log entry and send to aggregator."""
        level = event_dict.get('level', 'INFO').upper()
        message = event_dict.get('event', '')
        
        # Extract context (everything except standard fields)
        context = {k: v for k, v in event_dict.items() 
                  if k not in ['event', 'level', 'timestamp', 'logger']}
        
        self.aggregator.add_log_entry(level, message, context)
        
        return event_dict


def setup_log_aggregation(config: MonitoringConfig) -> LogAggregator:
    """Setup log aggregation for monitoring."""
    aggregator = LogAggregator(config)
    
    # Add aggregator processor to structlog
    current_processors = structlog.get_config()["processors"]
    current_processors.insert(-1, LogAggregatorProcessor(aggregator))  # Insert before renderer
    
    structlog.configure(processors=current_processors)
    
    return aggregator
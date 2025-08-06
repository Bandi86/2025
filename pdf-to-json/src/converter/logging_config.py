"""
Logging configuration for football data processing.

This module provides comprehensive logging setup with appropriate log levels,
formatters, and handlers for different components of the football data
processing pipeline.
"""

import logging
import logging.handlers
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import json


class FootballProcessingFormatter(logging.Formatter):
    """
    Custom formatter for football processing logs.
    
    Provides structured logging with context information and
    consistent formatting across all components.
    """
    
    def __init__(self, include_context: bool = True):
        """
        Initialize the formatter.
        
        Args:
            include_context: Whether to include context information in logs
        """
        self.include_context = include_context
        
        # Define format string
        format_str = (
            '%(asctime)s - %(name)s - %(levelname)s - '
            '%(funcName)s:%(lineno)d - %(message)s'
        )
        
        super().__init__(format_str, datefmt='%Y-%m-%d %H:%M:%S')
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format the log record with additional context if available.
        
        Args:
            record: Log record to format
            
        Returns:
            Formatted log message
        """
        # Add context information if available
        if self.include_context and hasattr(record, 'context'):
            context_str = json.dumps(record.context, default=str, separators=(',', ':'))
            record.message = f"{record.getMessage()} | Context: {context_str}"
        else:
            record.message = record.getMessage()
        
        return super().format(record)


class ContextLoggerAdapter(logging.LoggerAdapter):
    """
    Logger adapter that adds context information to log records.
    
    This adapter allows adding structured context information to log messages
    for better debugging and monitoring.
    """
    
    def __init__(self, logger: logging.Logger, context: Optional[Dict[str, Any]] = None):
        """
        Initialize the context logger adapter.
        
        Args:
            logger: Base logger instance
            context: Context information to add to all log messages
        """
        super().__init__(logger, context or {})
    
    def process(self, msg: str, kwargs: Dict[str, Any]) -> tuple:
        """
        Process the log message and add context information.
        
        Args:
            msg: Log message
            kwargs: Keyword arguments
            
        Returns:
            Tuple of (message, kwargs) with context added
        """
        # Merge context from adapter and any additional context in kwargs
        context = self.extra.copy()
        if 'context' in kwargs:
            context.update(kwargs.pop('context'))
        
        # Add context to the log record
        if context:
            kwargs['extra'] = kwargs.get('extra', {})
            kwargs['extra']['context'] = context
        
        return msg, kwargs
    
    def add_context(self, **context: Any) -> 'ContextLoggerAdapter':
        """
        Create a new adapter with additional context.
        
        Args:
            **context: Additional context to add
            
        Returns:
            New ContextLoggerAdapter with merged context
        """
        new_context = self.extra.copy()
        new_context.update(context)
        return ContextLoggerAdapter(self.logger, new_context)


class LoggingConfig:
    """
    Configuration manager for football processing logging.
    
    Provides centralized logging configuration with different levels
    and handlers for various components.
    """
    
    def __init__(self, log_dir: str = "logs", log_level: str = "INFO"):
        """
        Initialize the logging configuration.
        
        Args:
            log_dir: Directory for log files
            log_level: Default log level
        """
        self.log_dir = Path(log_dir)
        self.log_level = getattr(logging, log_level.upper(), logging.INFO)
        self.loggers: Dict[str, logging.Logger] = {}
        self.handlers: Dict[str, logging.Handler] = {}
        
        # Create log directory
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Configure root logger
        self._configure_root_logger()
    
    def _configure_root_logger(self) -> None:
        """Configure the root logger with basic settings."""
        root_logger = logging.getLogger()
        root_logger.setLevel(self.log_level)
        
        # Remove existing handlers to avoid duplicates
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
        
        # Add console handler
        console_handler = self._create_console_handler()
        root_logger.addHandler(console_handler)
        
        # Add file handler for general logs
        file_handler = self._create_file_handler("football_processing.log")
        root_logger.addHandler(file_handler)
    
    def _create_console_handler(self) -> logging.StreamHandler:
        """Create and configure console handler."""
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(self.log_level)
        
        # Use simpler format for console
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%H:%M:%S'
        )
        handler.setFormatter(formatter)
        
        return handler
    
    def _create_file_handler(self, filename: str, max_bytes: int = 10 * 1024 * 1024,
                           backup_count: int = 5) -> logging.handlers.RotatingFileHandler:
        """
        Create and configure rotating file handler.
        
        Args:
            filename: Log file name
            max_bytes: Maximum file size before rotation
            backup_count: Number of backup files to keep
            
        Returns:
            Configured rotating file handler
        """
        log_file = self.log_dir / filename
        handler = logging.handlers.RotatingFileHandler(
            log_file, maxBytes=max_bytes, backupCount=backup_count
        )
        handler.setLevel(self.log_level)
        
        # Use detailed format for file logs
        formatter = FootballProcessingFormatter(include_context=True)
        handler.setFormatter(formatter)
        
        return handler
    
    def get_logger(self, name: str, context: Optional[Dict[str, Any]] = None) -> ContextLoggerAdapter:
        """
        Get a configured logger with optional context.
        
        Args:
            name: Logger name (usually module name)
            context: Optional context information
            
        Returns:
            Configured context logger adapter
        """
        if name not in self.loggers:
            logger = logging.getLogger(name)
            logger.setLevel(self.log_level)
            self.loggers[name] = logger
        
        return ContextLoggerAdapter(self.loggers[name], context)
    
    def get_component_logger(self, component: str, **context: Any) -> ContextLoggerAdapter:
        """
        Get a logger for a specific component with component context.
        
        Args:
            component: Component name (extractor, normalizer, etc.)
            **context: Additional context information
            
        Returns:
            Configured logger with component context
        """
        logger_name = f"football_processing.{component}"
        component_context = {'component': component}
        component_context.update(context)
        
        return self.get_logger(logger_name, component_context)
    
    def create_error_handler(self, filename: str = "errors.log") -> logging.Handler:
        """
        Create a dedicated error handler for error-level logs.
        
        Args:
            filename: Error log file name
            
        Returns:
            Configured error handler
        """
        if filename not in self.handlers:
            handler = self._create_file_handler(filename)
            handler.setLevel(logging.ERROR)
            self.handlers[filename] = handler
        
        return self.handlers[filename]
    
    def create_performance_handler(self, filename: str = "performance.log") -> logging.Handler:
        """
        Create a dedicated handler for performance logs.
        
        Args:
            filename: Performance log file name
            
        Returns:
            Configured performance handler
        """
        if filename not in self.handlers:
            handler = self._create_file_handler(filename)
            handler.setLevel(logging.INFO)
            
            # Use performance-specific formatter
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - PERF - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            handler.setFormatter(formatter)
            self.handlers[filename] = handler
        
        return self.handlers[filename]
    
    def add_handler_to_logger(self, logger_name: str, handler: logging.Handler) -> None:
        """
        Add a handler to a specific logger.
        
        Args:
            logger_name: Name of the logger
            handler: Handler to add
        """
        logger = logging.getLogger(logger_name)
        logger.addHandler(handler)
    
    def set_log_level(self, level: str, logger_name: Optional[str] = None) -> None:
        """
        Set log level for a specific logger or all loggers.
        
        Args:
            level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            logger_name: Optional specific logger name
        """
        log_level = getattr(logging, level.upper(), logging.INFO)
        
        if logger_name:
            logger = logging.getLogger(logger_name)
            logger.setLevel(log_level)
        else:
            # Set for root logger and all created loggers
            logging.getLogger().setLevel(log_level)
            for logger in self.loggers.values():
                logger.setLevel(log_level)
    
    def log_pipeline_start(self, logger: ContextLoggerAdapter, pipeline_name: str,
                          input_info: Dict[str, Any]) -> None:
        """
        Log the start of a processing pipeline.
        
        Args:
            logger: Logger to use
            pipeline_name: Name of the pipeline
            input_info: Information about the input
        """
        logger.info(
            f"Starting {pipeline_name} pipeline",
            context={
                'pipeline': pipeline_name,
                'action': 'start',
                'input_info': input_info,
                'timestamp': datetime.now().isoformat()
            }
        )
    
    def log_pipeline_end(self, logger: ContextLoggerAdapter, pipeline_name: str,
                        success: bool, duration: float, results: Dict[str, Any]) -> None:
        """
        Log the end of a processing pipeline.
        
        Args:
            logger: Logger to use
            pipeline_name: Name of the pipeline
            success: Whether the pipeline completed successfully
            duration: Processing duration in seconds
            results: Processing results summary
        """
        level = logging.INFO if success else logging.ERROR
        status = "completed" if success else "failed"
        
        logger.log(
            level,
            f"{pipeline_name} pipeline {status} in {duration:.2f}s",
            context={
                'pipeline': pipeline_name,
                'action': 'end',
                'success': success,
                'duration': duration,
                'results': results,
                'timestamp': datetime.now().isoformat()
            }
        )
    
    def log_stage_progress(self, logger: ContextLoggerAdapter, stage: str,
                          progress: Dict[str, Any]) -> None:
        """
        Log progress information for a processing stage.
        
        Args:
            logger: Logger to use
            stage: Processing stage name
            progress: Progress information
        """
        logger.info(
            f"Stage {stage} progress",
            context={
                'stage': stage,
                'action': 'progress',
                'progress': progress,
                'timestamp': datetime.now().isoformat()
            }
        )
    
    def log_error_with_context(self, logger: ContextLoggerAdapter, error: Exception,
                              stage: Optional[str] = None, 
                              additional_context: Optional[Dict[str, Any]] = None) -> None:
        """
        Log an error with full context information.
        
        Args:
            logger: Logger to use
            error: Exception that occurred
            stage: Optional processing stage where error occurred
            additional_context: Optional additional context information
        """
        context = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'timestamp': datetime.now().isoformat()
        }
        
        if stage:
            context['stage'] = stage
        
        if additional_context:
            context.update(additional_context)
        
        # Add exception-specific context if available
        if hasattr(error, 'to_dict'):
            context['error_details'] = error.to_dict()
        
        logger.error(
            f"Error in {stage or 'processing'}: {str(error)}",
            context=context,
            exc_info=True
        )


# Global logging configuration instance
_logging_config: Optional[LoggingConfig] = None


def setup_logging(log_dir: str = "logs", log_level: str = "INFO") -> LoggingConfig:
    """
    Set up global logging configuration.
    
    Args:
        log_dir: Directory for log files
        log_level: Default log level
        
    Returns:
        Configured LoggingConfig instance
    """
    global _logging_config
    _logging_config = LoggingConfig(log_dir, log_level)
    return _logging_config


def get_logger(name: str, context: Optional[Dict[str, Any]] = None) -> ContextLoggerAdapter:
    """
    Get a logger with the global configuration.
    
    Args:
        name: Logger name
        context: Optional context information
        
    Returns:
        Configured context logger adapter
    """
    if _logging_config is None:
        setup_logging()
    
    return _logging_config.get_logger(name, context)


def get_component_logger(component: str, **context: Any) -> ContextLoggerAdapter:
    """
    Get a component logger with the global configuration.
    
    Args:
        component: Component name
        **context: Additional context information
        
    Returns:
        Configured logger with component context
    """
    if _logging_config is None:
        setup_logging()
    
    return _logging_config.get_component_logger(component, **context)
"""
Error Handling System for PDF to JSON Converter

This module provides centralized error handling and validation utilities.
"""

import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class ValidationResult:
    """Result of a validation operation."""

    def __init__(self, is_valid: bool = True, errors: Optional[List[str]] = None,
                 warnings: Optional[List[str]] = None, metadata: Optional[Dict[str, Any]] = None):
        self.is_valid = is_valid
        self.errors = errors or []
        self.warnings = warnings or []
        self.metadata = metadata or {}

    def add_error(self, error: str):
        """Add an error message."""
        self.errors.append(error)
        self.is_valid = False

    def add_warning(self, warning: str):
        """Add a warning message."""
        self.warnings.append(warning)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata
        }


class InputValidator:
    """Input validation utilities."""

    @staticmethod
    def validate_pdf_file(file_path: str) -> ValidationResult:
        """Validate PDF file input."""
        result = ValidationResult()
        path = Path(file_path)

        # Check if file exists
        if not path.exists():
            result.add_error(f"File does not exist: {file_path}")
            return result

        # Check if it's a file
        if not path.is_file():
            result.add_error(f"Path is not a file: {file_path}")
            return result

        # Check file extension
        if path.suffix.lower() != '.pdf':
            result.add_error(f"File must have .pdf extension: {file_path}")
            return result

        # Check file size (max 100MB)
        max_size = 100 * 1024 * 1024  # 100MB
        if path.stat().st_size > max_size:
            result.add_error(f"File too large (max 100MB): {file_path}")
            return result

        # Check if file is readable
        try:
            with open(path, 'rb') as f:
                header = f.read(8)
                if not header.startswith(b'%PDF-'):
                    result.add_error(f"File is not a valid PDF: {file_path}")
        except Exception as e:
            result.add_error(f"Cannot read file: {e}")

        # Add metadata
        result.metadata.update({
            "file_size": path.stat().st_size,
            "file_name": path.name,
            "file_extension": path.suffix
        })

        return result

    @staticmethod
    def validate_json_file(file_path: str) -> ValidationResult:
        """Validate JSON file input."""
        result = ValidationResult()
        path = Path(file_path)

        # Check if file exists
        if not path.exists():
            result.add_error(f"File does not exist: {file_path}")
            return result

        # Check file extension
        if path.suffix.lower() != '.json':
            result.add_warning(f"File should have .json extension: {file_path}")

        # Try to parse JSON
        try:
            with open(path, 'r', encoding='utf-8') as f:
                json.load(f)
        except json.JSONDecodeError as e:
            result.add_error(f"Invalid JSON file: {e}")
        except UnicodeDecodeError as e:
            result.add_error(f"Encoding error: {e}")
        except Exception as e:
            result.add_error(f"Cannot read file: {e}")

        return result

    @staticmethod
    def validate_output_directory(dir_path: str) -> ValidationResult:
        """Validate output directory."""
        result = ValidationResult()
        path = Path(dir_path)

        # Check if parent directory exists
        if not path.parent.exists():
            result.add_error(f"Parent directory does not exist: {path.parent}")
            return result

        # Try to create directory if it doesn't exist
        try:
            path.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            result.add_error(f"Cannot create directory: {e}")

        return result


class ErrorHandler:
    """Centralized error handling and reporting."""

    @staticmethod
    def log_error(error: Exception, context: Optional[Dict[str, Any]] = None,
                  logger_name: str = "converter"):
        """Log an error with context information."""
        logger = logging.getLogger(logger_name)

        log_context = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "timestamp": datetime.now().isoformat(),
            **(context or {})
        }

        logger.error(
            f"Error occurred: {error}",
            extra={"context": log_context},
            exc_info=True
        )

    @staticmethod
    def create_error_response(error: Exception, operation: str = "unknown") -> Dict[str, Any]:
        """Create a standardized error response."""
        return {
            "success": False,
            "operation": operation,
            "error": {
                "type": type(error).__name__,
                "message": str(error),
                "timestamp": datetime.now().isoformat()
            }
        }

    @staticmethod
    def validate_and_process(func):
        """Decorator for automatic input validation and error handling."""

        def wrapper(*args, **kwargs):
            try:
                # Extract file paths from arguments
                file_paths = [arg for arg in args if isinstance(arg, str) and Path(arg).exists()]

                # Validate inputs
                for file_path in file_paths:
                    if file_path.endswith('.pdf'):
                        validation = InputValidator.validate_pdf_file(file_path)
                        if not validation.is_valid:
                            raise ValueError(f"Invalid PDF file: {validation.errors}")
                    elif file_path.endswith('.json'):
                        validation = InputValidator.validate_json_file(file_path)
                        if not validation.is_valid:
                            raise ValueError(f"Invalid JSON file: {validation.errors}")

                # Execute function
                return func(*args, **kwargs)

            except Exception as e:
                ErrorHandler.log_error(e, {"function": func.__name__, "args": args, "kwargs": kwargs})
                raise

        return wrapper


def safe_file_operation(func):
    """Decorator for safe file operations with error handling."""

    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except FileNotFoundError as e:
            logger.error(f"File not found: {e}")
            raise ValueError(f"File not found: {e}")
        except PermissionError as e:
            logger.error(f"Permission denied: {e}")
            raise ValueError(f"Permission denied: {e}")
        except OSError as e:
            logger.error(f"File system error: {e}")
            raise ValueError(f"File system error: {e}")

    return wrapper


def log_execution_time(func):
    """Decorator to log function execution time."""

    def wrapper(*args, **kwargs):
        start_time = datetime.now()
        logger.info(f"Starting {func.__name__}")

        try:
            result = func(*args, **kwargs)
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.info(".2f")
            return result
        except Exception as e:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.error(".2f")
            raise

    return wrapper

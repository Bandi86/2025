"""
PDF to JSON Converter - Main Package

This package provides robust PDF to JSON conversion with specialized
football data extraction capabilities.

Package Structure:
- core: Core functionality (config, exceptions, error handling)
- processing: PDF processing and conversion (converter, extractor, football processing)
- web: Web interfaces (API, UI)
- utils: Utility functions and helpers
"""

__version__ = "1.0.0"
__title__ = "PDF to JSON Converter"
__description__ = "Robust PDF to JSON converter with football data extraction"

# Import key classes for easy access
from .converter.config_manager import ConfigManager, get_config_manager, get_app_config
from .converter.exceptions import (
    PDFToJSONError, ConfigurationError, FileProcessingError,
    PDFParsingError, FootballExtractionError, ValidationError
)
from .converter.error_handler import InputValidator, ErrorHandler, ValidationResult
from .converter.converter import PDFToJSONConverter
from .converter.football_extractor import FootballExtractor
from .converter.football_converter import FootballConverter

# Make key functions available at package level
__all__ = [
    # Configuration
    "ConfigManager",
    "get_config_manager",
    "get_app_config",

    # Exceptions
    "PDFToJSONError",
    "ConfigurationError",
    "FileProcessingError",
    "PDFParsingError",
    "FootballExtractionError",
    "ValidationError",

    # Error Handling
    "InputValidator",
    "ErrorHandler",
    "ValidationResult",

    # Main Converters
    "PDFToJSONConverter",
    "FootballExtractor",
    "FootballConverter"
]
"""
Custom exception classes for football data processing.

This module defines a hierarchy of custom exceptions for different error categories
in the football data processing pipeline, providing better error handling and
debugging capabilities.
"""

from typing import Optional, Dict, Any, List


class FootballProcessingError(Exception):
    """
    Base exception for all football processing errors.
    
    This is the root exception class for all errors that occur during
    football data processing. It provides common functionality for
    error tracking and context information.
    """
    
    def __init__(self, message: str, error_code: Optional[str] = None, 
                 context: Optional[Dict[str, Any]] = None, 
                 original_exception: Optional[Exception] = None):
        """
        Initialize the football processing error.
        
        Args:
            message: Human-readable error message
            error_code: Optional error code for programmatic handling
            context: Optional context information about the error
            original_exception: Optional original exception that caused this error
        """
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.context = context or {}
        self.original_exception = original_exception
    
    def __str__(self) -> str:
        """Return a string representation of the error."""
        error_str = self.message
        if self.error_code:
            error_str = f"[{self.error_code}] {error_str}"
        if self.context:
            context_str = ", ".join(f"{k}={v}" for k, v in self.context.items())
            error_str = f"{error_str} (Context: {context_str})"
        return error_str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary for serialization."""
        return {
            'error_type': self.__class__.__name__,
            'message': self.message,
            'error_code': self.error_code,
            'context': self.context,
            'original_exception': str(self.original_exception) if self.original_exception else None
        }


class ConfigurationError(FootballProcessingError):
    """
    Exception raised for configuration-related errors.
    
    This includes missing configuration files, invalid configuration format,
    invalid configuration values, and configuration validation failures.
    """
    
    def __init__(self, message: str, config_file: Optional[str] = None, 
                 config_section: Optional[str] = None, **kwargs):
        """
        Initialize the configuration error.
        
        Args:
            message: Human-readable error message
            config_file: Optional path to the configuration file
            config_section: Optional configuration section where error occurred
            **kwargs: Additional arguments passed to parent class
        """
        context = kwargs.get('context', {})
        if config_file:
            context['config_file'] = config_file
        if config_section:
            context['config_section'] = config_section
        kwargs['context'] = context
        
        super().__init__(message, error_code='CONFIG_ERROR', **kwargs)
        self.config_file = config_file
        self.config_section = config_section


class DataQualityError(FootballProcessingError):
    """
    Exception raised for data quality issues.
    
    This includes malformed input data, missing required fields,
    invalid data formats, and data validation failures.
    """
    
    def __init__(self, message: str, data_field: Optional[str] = None,
                 data_value: Optional[Any] = None, validation_rule: Optional[str] = None,
                 **kwargs):
        """
        Initialize the data quality error.
        
        Args:
            message: Human-readable error message
            data_field: Optional field name where error occurred
            data_value: Optional value that caused the error
            validation_rule: Optional validation rule that failed
            **kwargs: Additional arguments passed to parent class
        """
        context = kwargs.get('context', {})
        if data_field:
            context['data_field'] = data_field
        if data_value is not None:
            context['data_value'] = str(data_value)[:100]  # Limit length
        if validation_rule:
            context['validation_rule'] = validation_rule
        kwargs['context'] = context
        
        super().__init__(message, error_code='DATA_QUALITY_ERROR', **kwargs)
        self.data_field = data_field
        self.data_value = data_value
        self.validation_rule = validation_rule


class ProcessingError(FootballProcessingError):
    """
    Exception raised for processing pipeline errors.
    
    This includes errors during extraction, normalization, merging,
    deduplication, splitting, and other processing stages.
    """
    
    def __init__(self, message: str, stage: Optional[str] = None,
                 game_info: Optional[Dict[str, Any]] = None, **kwargs):
        """
        Initialize the processing error.
        
        Args:
            message: Human-readable error message
            stage: Optional processing stage where error occurred
            game_info: Optional information about the game being processed
            **kwargs: Additional arguments passed to parent class
        """
        context = kwargs.get('context', {})
        if stage:
            context['processing_stage'] = stage
        if game_info:
            context['game_info'] = game_info
        kwargs['context'] = context
        
        if 'error_code' not in kwargs:
            kwargs['error_code'] = 'PROCESSING_ERROR'
        super().__init__(message, **kwargs)
        self.stage = stage
        self.game_info = game_info


class ExtractionError(ProcessingError):
    """
    Exception raised for data extraction errors.
    
    This includes errors during PDF parsing, text extraction,
    pattern matching, and data structure creation.
    """
    
    def __init__(self, message: str, source_file: Optional[str] = None,
                 extraction_method: Optional[str] = None, **kwargs):
        """
        Initialize the extraction error.
        
        Args:
            message: Human-readable error message
            source_file: Optional source file being processed
            extraction_method: Optional extraction method that failed
            **kwargs: Additional arguments passed to parent class
        """
        context = kwargs.get('context', {})
        if source_file:
            context['source_file'] = source_file
        if extraction_method:
            context['extraction_method'] = extraction_method
        kwargs['context'] = context
        
        kwargs['error_code'] = 'EXTRACTION_ERROR'
        super().__init__(message, stage='extraction', **kwargs)
        self.source_file = source_file
        self.extraction_method = extraction_method


class NormalizationError(ProcessingError):
    """
    Exception raised for team name normalization errors.
    
    This includes errors during alias lookup, heuristic application,
    fuzzy matching, and normalization validation.
    """
    
    def __init__(self, message: str, team_name: Optional[str] = None,
                 normalization_method: Optional[str] = None, **kwargs):
        """
        Initialize the normalization error.
        
        Args:
            message: Human-readable error message
            team_name: Optional team name being normalized
            normalization_method: Optional normalization method that failed
            **kwargs: Additional arguments passed to parent class
        """
        context = kwargs.get('context', {})
        if team_name:
            context['team_name'] = team_name
        if normalization_method:
            context['normalization_method'] = normalization_method
        kwargs['context'] = context
        
        kwargs['error_code'] = 'NORMALIZATION_ERROR'
        super().__init__(message, stage='normalization', **kwargs)
        self.team_name = team_name
        self.normalization_method = normalization_method


class MarketProcessingError(ProcessingError):
    """
    Exception raised for market processing errors.
    
    This includes errors during market classification, game merging,
    market type detection, and market validation.
    """
    
    def __init__(self, message: str, market_info: Optional[Dict[str, Any]] = None,
                 processing_step: Optional[str] = None, **kwargs):
        """
        Initialize the market processing error.
        
        Args:
            message: Human-readable error message
            market_info: Optional market information being processed
            processing_step: Optional specific processing step that failed
            **kwargs: Additional arguments passed to parent class
        """
        context = kwargs.get('context', {})
        if market_info:
            context['market_info'] = market_info
        if processing_step:
            context['processing_step'] = processing_step
        kwargs['context'] = context
        
        kwargs['error_code'] = 'MARKET_PROCESSING_ERROR'
        super().__init__(message, stage='market_processing', **kwargs)
        self.market_info = market_info
        self.processing_step = processing_step


class DataProcessingError(ProcessingError):
    """
    Exception raised for data processing errors.
    
    This includes errors during deduplication, market capping,
    priority calculation, and data validation.
    """
    
    def __init__(self, message: str, processing_operation: Optional[str] = None,
                 affected_games: Optional[int] = None, **kwargs):
        """
        Initialize the data processing error.
        
        Args:
            message: Human-readable error message
            processing_operation: Optional operation that failed (deduplication, capping, etc.)
            affected_games: Optional number of games affected by the error
            **kwargs: Additional arguments passed to parent class
        """
        context = kwargs.get('context', {})
        if processing_operation:
            context['processing_operation'] = processing_operation
        if affected_games is not None:
            context['affected_games'] = affected_games
        kwargs['context'] = context
        
        kwargs['error_code'] = 'DATA_PROCESSING_ERROR'
        super().__init__(message, stage='data_processing', **kwargs)
        self.processing_operation = processing_operation
        self.affected_games = affected_games


class SplittingError(ProcessingError):
    """
    Exception raised for day splitting errors.
    
    This includes errors during date parsing, file creation,
    directory management, and data organization.
    """
    
    def __init__(self, message: str, date_value: Optional[str] = None,
                 output_path: Optional[str] = None, **kwargs):
        """
        Initialize the splitting error.
        
        Args:
            message: Human-readable error message
            date_value: Optional date value that caused the error
            output_path: Optional output path where error occurred
            **kwargs: Additional arguments passed to parent class
        """
        context = kwargs.get('context', {})
        if date_value:
            context['date_value'] = date_value
        if output_path:
            context['output_path'] = output_path
        kwargs['context'] = context
        
        kwargs['error_code'] = 'SPLITTING_ERROR'
        super().__init__(message, stage='splitting', **kwargs)
        self.date_value = date_value
        self.output_path = output_path


class ReportingError(ProcessingError):
    """
    Exception raised for report generation errors.
    
    This includes errors during report creation, file writing,
    statistics calculation, and anomaly detection.
    """
    
    def __init__(self, message: str, report_type: Optional[str] = None,
                 output_file: Optional[str] = None, **kwargs):
        """
        Initialize the reporting error.
        
        Args:
            message: Human-readable error message
            report_type: Optional type of report being generated
            output_file: Optional output file path
            **kwargs: Additional arguments passed to parent class
        """
        context = kwargs.get('context', {})
        if report_type:
            context['report_type'] = report_type
        if output_file:
            context['output_file'] = output_file
        kwargs['context'] = context
        
        kwargs['error_code'] = 'REPORTING_ERROR'
        super().__init__(message, stage='reporting', **kwargs)
        self.report_type = report_type
        self.output_file = output_file


class FileSystemError(FootballProcessingError):
    """
    Exception raised for file system related errors.
    
    This includes errors during file reading, writing, directory creation,
    and file system operations.
    """
    
    def __init__(self, message: str, file_path: Optional[str] = None,
                 operation: Optional[str] = None, **kwargs):
        """
        Initialize the file system error.
        
        Args:
            message: Human-readable error message
            file_path: Optional file path where error occurred
            operation: Optional file system operation that failed
            **kwargs: Additional arguments passed to parent class
        """
        context = kwargs.get('context', {})
        if file_path:
            context['file_path'] = file_path
        if operation:
            context['operation'] = operation
        kwargs['context'] = context
        
        super().__init__(message, error_code='FILESYSTEM_ERROR', **kwargs)
        self.file_path = file_path
        self.operation = operation


class ValidationError(FootballProcessingError):
    """
    Exception raised for validation errors.
    
    This includes schema validation, data format validation,
    and business rule validation errors.
    """
    
    def __init__(self, message: str, validation_type: Optional[str] = None,
                 failed_rules: Optional[List[str]] = None, **kwargs):
        """
        Initialize the validation error.
        
        Args:
            message: Human-readable error message
            validation_type: Optional type of validation that failed
            failed_rules: Optional list of validation rules that failed
            **kwargs: Additional arguments passed to parent class
        """
        context = kwargs.get('context', {})
        if validation_type:
            context['validation_type'] = validation_type
        if failed_rules:
            context['failed_rules'] = failed_rules
        kwargs['context'] = context
        
        super().__init__(message, error_code='VALIDATION_ERROR', **kwargs)
        self.validation_type = validation_type
        self.failed_rules = failed_rules or []


# Exception mapping for easy lookup
EXCEPTION_MAPPING = {
    'configuration': ConfigurationError,
    'data_quality': DataQualityError,
    'processing': ProcessingError,
    'extraction': ExtractionError,
    'normalization': NormalizationError,
    'market_processing': MarketProcessingError,
    'data_processing': DataProcessingError,
    'splitting': SplittingError,
    'reporting': ReportingError,
    'filesystem': FileSystemError,
    'validation': ValidationError
}


def create_exception(error_type: str, message: str, **kwargs) -> FootballProcessingError:
    """
    Factory function to create appropriate exception based on error type.
    
    Args:
        error_type: Type of error (key from EXCEPTION_MAPPING)
        message: Error message
        **kwargs: Additional arguments for the exception
        
    Returns:
        Appropriate exception instance
    """
    exception_class = EXCEPTION_MAPPING.get(error_type, FootballProcessingError)
    return exception_class(message, **kwargs)
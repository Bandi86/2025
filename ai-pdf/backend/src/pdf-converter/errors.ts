/**
 * Error handling utilities for PDF to JSON converter
 * Provides standardized error creation and handling
 */

import { ErrorCode, ErrorDetails, ProcessingStep } from './types';

/**
 * Base error class for PDF converter operations
 */
export class PDFConverterError extends Error {
  public readonly code: ErrorCode;
  public readonly step: ProcessingStep;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message: string,
    step: ProcessingStep,
    details?: any
  ) {
    super(message);
    this.name = 'PDFConverterError';
    this.code = code;
    this.step = step;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Convert error to ErrorDetails interface
   */
  toErrorDetails(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      step: this.step,
      timestamp: this.timestamp
    };
  }
}

/**
 * PDF-specific error class
 */
export class PDFError extends PDFConverterError {
  constructor(message: string, details?: any) {
    super(ErrorCode.PDF_EXTRACTION_FAILED, message, ProcessingStep.PDF_EXTRACTION, details);
    this.name = 'PDFError';
  }
}

/**
 * AI service error class
 */
export class AIServiceError extends PDFConverterError {
  constructor(message: string, details?: any) {
    super(ErrorCode.AI_ANALYSIS_FAILED, message, ProcessingStep.AI_ANALYSIS, details);
    this.name = 'AIServiceError';
  }
}

/**
 * JSON generation error class
 */
export class JSONGenerationError extends PDFConverterError {
  constructor(message: string, details?: any) {
    super(ErrorCode.JSON_GENERATION_FAILED, message, ProcessingStep.JSON_GENERATION, details);
    this.name = 'JSONGenerationError';
  }
}

/**
 * Validation error class
 */
export class ValidationError extends PDFConverterError {
  constructor(message: string, step: ProcessingStep, details?: any) {
    super(ErrorCode.VALIDATION_FAILED, message, step, details);
    this.name = 'ValidationError';
  }
}

/**
 * Create a file not found error
 */
export function createFileNotFoundError(filePath: string): PDFConverterError {
  return new PDFConverterError(
    ErrorCode.FILE_NOT_FOUND,
    `File not found: ${filePath}`,
    ProcessingStep.PDF_VALIDATION,
    { filePath }
  );
}

/**
 * Create an invalid PDF error
 */
export function createInvalidPDFError(filePath: string, reason?: string): PDFConverterError {
  return new PDFConverterError(
    ErrorCode.INVALID_PDF,
    `Invalid PDF file: ${filePath}${reason ? ` - ${reason}` : ''}`,
    ProcessingStep.PDF_VALIDATION,
    { filePath, reason }
  );
}

/**
 * Create an AI service unavailable error
 */
export function createAIServiceUnavailableError(host: string, error?: any): PDFConverterError {
  return new PDFConverterError(
    ErrorCode.AI_SERVICE_UNAVAILABLE,
    `AI service unavailable at ${host}`,
    ProcessingStep.AI_ANALYSIS,
    { host, originalError: error }
  );
}

/**
 * Create a configuration error
 */
export function createConfigurationError(message: string, details?: any): PDFConverterError {
  return new PDFConverterError(
    ErrorCode.CONFIGURATION_ERROR,
    message,
    ProcessingStep.PDF_VALIDATION,
    details
  );
}

/**
 * Create an unknown error
 */
export function createUnknownError(originalError: any, step: ProcessingStep): PDFConverterError {
  const message = originalError instanceof Error ? originalError.message : 'Unknown error occurred';
  return new PDFConverterError(
    ErrorCode.UNKNOWN_ERROR,
    message,
    step,
    { originalError }
  );
}

/**
 * Check if an error is a PDF converter error
 */
export function isPDFConverterError(error: any): error is PDFConverterError {
  return error instanceof PDFConverterError;
}

/**
 * Extract error details from any error
 */
export function extractErrorDetails(error: any, step: ProcessingStep): ErrorDetails {
  if (isPDFConverterError(error)) {
    return error.toErrorDetails();
  }

  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    details: { originalError: error },
    step,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: ErrorDetails): string {
  return `[${error.code}] ${error.message} (Step: ${error.step}) - ${error.timestamp}`;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ErrorDetails): boolean {
  const retryableCodes = [
    ErrorCode.AI_SERVICE_UNAVAILABLE,
    ErrorCode.AI_ANALYSIS_FAILED
  ];
  
  return retryableCodes.includes(error.code);
}
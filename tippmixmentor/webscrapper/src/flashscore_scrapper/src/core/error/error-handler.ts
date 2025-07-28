/**
 * ErrorHandler - Centralized error handling with categorization and logging
 */

import {
  IErrorHandler,
  ErrorContext,
  RetryOptions,
  BaseScrapingError,
  NetworkError,
  ScrapingError,
  DataValidationError,
  SystemError,
  ConfigurationError,
  ErrorMetrics,
  DEFAULT_RETRY_STRATEGY
} from '../../types/errors.js';
import { ErrorType } from '../../types/core.js';
import { RetryManager } from './retry-manager.js';

export class ErrorHandler implements IErrorHandler {
  private retryManager: RetryManager;
  private metrics: ErrorMetrics;
  private logger?: any; // Will be injected when logging system is implemented

  constructor(logger?: any) {
    this.retryManager = new RetryManager();
    this.logger = logger;
    this.metrics = {
      totalErrors: 0,
      errorsByType: {
        [ErrorType.NETWORK]: 0,
        [ErrorType.SCRAPING]: 0,
        [ErrorType.VALIDATION]: 0,
        [ErrorType.SYSTEM]: 0,
        [ErrorType.CONFIGURATION]: 0
      },
      retryAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryDelay: 0
    };
  }

  /**
   * Handle an error with appropriate categorization and logging
   */
  async handle(error: Error, context: ErrorContext): Promise<void> {
    const errorType = this.classify(error);
    const scrapingError = this.wrapError(error, errorType, context);

    // Update metrics
    this.updateMetrics(scrapingError);

    // Log the error with context
    await this.logError(scrapingError);

    // Execute recovery actions if available
    await this.executeRecoveryActions(scrapingError);
  }

  /**
   * Retry an operation with exponential backoff
   */
  async retry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
    return this.retryManager.execute(operation, options);
  }

  /**
   * Classify an error into appropriate error type
   */
  classify(error: Error): ErrorType {
    // If it's already a BaseScrapingError, return its type
    if (error instanceof BaseScrapingError) {
      return error.type;
    }

    // Network-related errors
    if (this.isNetworkError(error)) {
      return ErrorType.NETWORK;
    }

    // Scraping-related errors (selectors, page load, etc.)
    if (this.isScrapingError(error)) {
      return ErrorType.SCRAPING;
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return ErrorType.VALIDATION;
    }

    // Configuration errors
    if (this.isConfigurationError(error)) {
      return ErrorType.CONFIGURATION;
    }

    // Default to system error
    return ErrorType.SYSTEM;
  }

  /**
   * Determine if an error should be retried
   */
  shouldRetry(error: Error, attempt: number): boolean {
    const errorType = this.classify(error);
    const strategy = this.getRetryStrategyForErrorType(errorType);

    if (attempt >= strategy.maxAttempts) {
      return false;
    }

    // Check if error is retryable
    if (error instanceof BaseScrapingError && !error.retryable) {
      return false;
    }

    // Custom retry condition
    if (strategy.retryCondition) {
      return strategy.retryCondition(error);
    }

    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  getRetryDelay(attempt: number, baseDelay: number, backoffFactor: number): number {
    const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.min(delay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset error metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByType: {
        [ErrorType.NETWORK]: 0,
        [ErrorType.SCRAPING]: 0,
        [ErrorType.VALIDATION]: 0,
        [ErrorType.SYSTEM]: 0,
        [ErrorType.CONFIGURATION]: 0
      },
      retryAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryDelay: 0
    };
  }

  // Private helper methods

  private isNetworkError(error: Error): boolean {
    const networkKeywords = [
      'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET',
      'timeout', 'network', 'fetch', 'request failed', 'connection'
    ];

    const errorMessage = error.message.toLowerCase();
    return networkKeywords.some(keyword => errorMessage.includes(keyword)) ||
           error.name === 'TimeoutError' ||
           error.name === 'FetchError';
  }

  private isScrapingError(error: Error): boolean {
    const scrapingKeywords = [
      'selector', 'element not found', 'page not loaded', 'navigation',
      'waiting for selector', 'element handle', 'page closed'
    ];

    const errorMessage = error.message.toLowerCase();
    return scrapingKeywords.some(keyword => errorMessage.includes(keyword)) ||
           error.name === 'PlaywrightError';
  }

  private isValidationError(error: Error): boolean {
    const validationKeywords = [
      'validation', 'invalid', 'required field', 'type mismatch',
      'schema', 'format error'
    ];

    const errorMessage = error.message.toLowerCase();
    return validationKeywords.some(keyword => errorMessage.includes(keyword)) ||
           error.name === 'ValidationError';
  }

  private isConfigurationError(error: Error): boolean {
    const configKeywords = [
      'configuration', 'config', 'environment', 'missing variable',
      'invalid setting', 'setup error'
    ];

    const errorMessage = error.message.toLowerCase();
    return configKeywords.some(keyword => errorMessage.includes(keyword)) ||
           error.name === 'ConfigurationError';
  }

  private wrapError(error: Error, type: ErrorType, context: ErrorContext): BaseScrapingError {
    if (error instanceof BaseScrapingError) {
      return error;
    }

    const errorMessage = context.message || error.message;

    switch (type) {
      case ErrorType.NETWORK:
        return new NetworkError(errorMessage, context);
      case ErrorType.SCRAPING:
        return new ScrapingError(errorMessage, context);
      case ErrorType.VALIDATION:
        return new DataValidationError(errorMessage, context);
      case ErrorType.CONFIGURATION:
        return new ConfigurationError(errorMessage, context);
      default:
        return new SystemError(errorMessage, context);
    }
  }

  private updateMetrics(error: BaseScrapingError): void {
    this.metrics.totalErrors++;
    this.metrics.errorsByType[error.type]++;
  }

  private async logError(error: BaseScrapingError): Promise<void> {
    const logData = {
      timestamp: error.timestamp,
      type: error.type,
      message: error.message,
      context: error.context,
      retryable: error.retryable,
      stack: error.stack
    };

    if (this.logger) {
      this.logger.error('Error occurred during scraping operation', logData);
    } else {
      // Fallback to console logging
      console.error(`[${error.type.toUpperCase()}] ${error.message}`, {
        context: error.context,
        timestamp: error.timestamp
      });
    }
  }

  private async executeRecoveryActions(error: BaseScrapingError): Promise<void> {
    // Recovery actions will be implemented when recovery strategies are available
    // For now, just log that recovery would be attempted
    if (this.logger) {
      this.logger.info(`Recovery actions would be executed for error type: ${error.type}`);
    }
  }

  private getRetryStrategyForErrorType(errorType: ErrorType): RetryOptions {
    switch (errorType) {
      case ErrorType.NETWORK:
        return DEFAULT_RETRY_STRATEGY.networkErrors;
      case ErrorType.SCRAPING:
        return DEFAULT_RETRY_STRATEGY.scrapingErrors;
      case ErrorType.SYSTEM:
        return DEFAULT_RETRY_STRATEGY.systemErrors;
      case ErrorType.VALIDATION:
        return DEFAULT_RETRY_STRATEGY.validationErrors;
      case ErrorType.CONFIGURATION:
        return DEFAULT_RETRY_STRATEGY.configurationErrors;
      default:
        return DEFAULT_RETRY_STRATEGY.systemErrors;
    }
  }
}
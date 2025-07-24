/**
 * Custom error classes for the Flashscore Scraper System
 * Provides structured error handling with categorization
 */

/**
 * Base error class for all scraper errors
 */
class ScraperError extends Error {
  constructor(message, code = 'SCRAPER_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Network-related errors (timeouts, connection failures)
 */
class NetworkError extends ScraperError {
  constructor(message, details = {}) {
    super(message, 'NETWORK_ERROR', details);
  }
}

/**
 * Parsing-related errors (structure changes, missing elements)
 */
class ParsingError extends ScraperError {
  constructor(message, details = {}) {
    super(message, 'PARSING_ERROR', details);
  }
}

/**
 * Database-related errors
 */
class DatabaseError extends ScraperError {
  constructor(message, details = {}) {
    super(message, 'DATABASE_ERROR', details);
  }
}

/**
 * Rate limiting errors
 */
class RateLimitError extends ScraperError {
  constructor(message, details = {}) {
    super(message, 'RATE_LIMIT_ERROR', details);
  }
}

/**
 * Configuration errors
 */
class ConfigurationError extends ScraperError {
  constructor(message, details = {}) {
    super(message, 'CONFIGURATION_ERROR', details);
  }
}

/**
 * Task queue errors
 */
class QueueError extends ScraperError {
  constructor(message, details = {}) {
    super(message, 'QUEUE_ERROR', details);
  }
}

/**
 * Data validation errors
 */
class ValidationError extends ScraperError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Centralized error handler utility class
 * Provides comprehensive error handling, logging, and reporting
 */
class ErrorHandler {
  constructor(logger = null) {
    this.logger = logger || require('./logger');
    this.errorCounts = new Map();
    this.alertThresholds = {
      NETWORK_ERROR: 10,
      PARSING_ERROR: 5,
      RATE_LIMIT_ERROR: 3,
      DATABASE_ERROR: 2,
      UNKNOWN_ERROR: 15
    };
    this.alertCallbacks = new Map();
  }

  /**
   * Handle an error with comprehensive logging and processing
   * @param {Error} error - Error to handle
   * @param {string} context - Context where error occurred
   * @param {object} metadata - Additional metadata
   * @returns {ScraperError} Processed error instance
   */
  handle(error, context = '', metadata = {}) {
    // Create structured error
    const structuredError = this.createError(error, context);
    
    // Add metadata
    structuredError.details = {
      ...structuredError.details,
      ...metadata,
      handledAt: new Date().toISOString(),
      processId: process.pid,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };

    // Log the error
    this.logError(structuredError, context);

    // Track error for alerting
    this.trackError(structuredError);

    // Check if alerting is needed
    this.checkAlertThresholds(structuredError);

    return structuredError;
  }

  /**
   * Log error with structured information
   * @param {ScraperError} error - Error to log
   * @param {string} context - Context information
   */
  logError(error, context) {
    const logData = {
      errorCode: error.code,
      errorName: error.name,
      message: error.message,
      context,
      details: error.details,
      timestamp: error.timestamp,
      stack: error.stack
    };

    // Log based on error severity
    if (error instanceof DatabaseError || error instanceof ConfigurationError) {
      this.logger.error('Critical error occurred', logData);
    } else if (error instanceof NetworkError || error instanceof RateLimitError) {
      this.logger.warn('Network/Rate limit error occurred', logData);
    } else if (error instanceof ParsingError) {
      this.logger.warn('Parsing error occurred', logData);
    } else {
      this.logger.error('Unknown error occurred', logData);
    }
  }

  /**
   * Track error occurrences for alerting
   * @param {ScraperError} error - Error to track
   */
  trackError(error) {
    const currentHour = Date.now() - (Date.now() % (60 * 60 * 1000)); // Hourly buckets
    const errorKey = `${error.code}_${currentHour}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Clean up old error counts (keep last 24 hours)
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
    for (const [key] of this.errorCounts) {
      const timestamp = parseInt(key.split('_').pop());
      if (timestamp < cutoffTime) {
        this.errorCounts.delete(key);
      }
    }
  }

  /**
   * Check if error thresholds are exceeded and trigger alerts
   * @param {ScraperError} error - Error to check
   */
  checkAlertThresholds(error) {
    const threshold = this.alertThresholds[error.code] || this.alertThresholds.UNKNOWN_ERROR;
    const currentHour = Date.now() - (Date.now() % (60 * 60 * 1000));
    const errorKey = `${error.code}_${currentHour}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;

    if (currentCount >= threshold) {
      this.triggerAlert(error.code, currentCount, threshold);
    }
  }

  /**
   * Trigger alert for error threshold breach
   * @param {string} errorCode - Error code that breached threshold
   * @param {number} currentCount - Current error count
   * @param {number} threshold - Threshold that was breached
   */
  triggerAlert(errorCode, currentCount, threshold) {
    const alertData = {
      errorCode,
      currentCount,
      threshold,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(errorCode)
    };

    this.logger.error('Error threshold breached - Alert triggered', alertData);

    // Execute registered alert callbacks
    const callback = this.alertCallbacks.get(errorCode);
    if (callback && typeof callback === 'function') {
      try {
        callback(alertData);
      } catch (callbackError) {
        this.logger.error('Alert callback failed', { 
          originalAlert: alertData, 
          callbackError: callbackError.message 
        });
      }
    }
  }

  /**
   * Get alert severity based on error code
   * @param {string} errorCode - Error code
   * @returns {string} Severity level
   */
  getAlertSeverity(errorCode) {
    const criticalErrors = ['DATABASE_ERROR', 'CONFIGURATION_ERROR'];
    const highErrors = ['NETWORK_ERROR', 'RATE_LIMIT_ERROR'];
    
    if (criticalErrors.includes(errorCode)) return 'CRITICAL';
    if (highErrors.includes(errorCode)) return 'HIGH';
    return 'MEDIUM';
  }

  /**
   * Register alert callback for specific error type
   * @param {string} errorCode - Error code to monitor
   * @param {Function} callback - Callback function to execute
   */
  registerAlertCallback(errorCode, callback) {
    this.alertCallbacks.set(errorCode, callback);
  }

  /**
   * Get error statistics
   * @returns {object} Error statistics
   */
  getErrorStats() {
    const stats = {
      totalErrors: 0,
      errorsByType: {},
      lastHourErrors: 0,
      last24HourErrors: 0
    };

    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    for (const [key, count] of this.errorCounts) {
      const parts = key.split('_');
      const errorCode = parts.slice(0, -1).join('_'); // Handle error codes with underscores
      const errorTime = parseInt(parts[parts.length - 1]);

      stats.totalErrors += count;
      stats.errorsByType[errorCode] = (stats.errorsByType[errorCode] || 0) + count;

      if (errorTime >= oneHourAgo) {
        stats.lastHourErrors += count;
      }
      if (errorTime >= oneDayAgo) {
        stats.last24HourErrors += count;
      }
    }

    return stats;
  }

  /**
   * Determine if an error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether the error is retryable
   */
  static isRetryable(error) {
    const retryableCodes = [
      'NETWORK_ERROR',
      'RATE_LIMIT_ERROR',
      'TIMEOUT',
      'CONNECTION_RESET',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];

    return retryableCodes.includes(error.code) || 
           retryableCodes.some(code => error.message.includes(code));
  }

  /**
   * Get retry delay based on error type and attempt number
   * @param {Error} error - Error that occurred
   * @param {number} attempt - Current attempt number
   * @returns {number} Delay in milliseconds
   */
  static getRetryDelay(error, attempt) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    // Exponential backoff with jitter
    let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    delay += jitter;

    // Special handling for rate limit errors
    if (error instanceof RateLimitError) {
      delay = Math.max(delay, 5000); // Minimum 5 seconds for rate limits
    }

    return Math.floor(delay);
  }

  /**
   * Create appropriate error instance based on error type
   * @param {Error|string} error - Original error or message
   * @param {string} context - Context where error occurred
   * @returns {ScraperError} Appropriate error instance
   */
  createError(error, context = '') {
    const message = error instanceof Error ? error.message : error;
    const details = { 
      context, 
      originalError: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };

    // If error is already a ScraperError instance, return it with updated context
    if (error instanceof ScraperError) {
      error.details = { ...error.details, ...details };
      return error;
    }

    // Check if error is already one of our custom error types
    if (error instanceof NetworkError) {
      return error;
    }
    if (error instanceof RateLimitError) {
      return error;
    }
    if (error instanceof ParsingError) {
      return error;
    }
    if (error instanceof DatabaseError) {
      return error;
    }
    if (error instanceof ValidationError) {
      return error;
    }
    if (error instanceof QueueError) {
      return error;
    }
    if (error instanceof ConfigurationError) {
      return error;
    }

    // Determine error type based on message content and error properties
    if (this.isTimeoutError(error, message)) {
      return new NetworkError(`Timeout error: ${message}`, details);
    }

    if (this.isRateLimitError(error, message)) {
      return new RateLimitError(`Rate limit exceeded: ${message}`, details);
    }

    if (this.isConnectionError(error, message)) {
      return new NetworkError(`Connection error: ${message}`, details);
    }

    if (this.isParsingError(error, message)) {
      return new ParsingError(`Parsing error: ${message}`, details);
    }

    if (this.isDatabaseError(error, message)) {
      return new DatabaseError(`Database error: ${message}`, details);
    }

    if (this.isValidationError(error, message)) {
      return new ValidationError(`Validation error: ${message}`, details);
    }

    if (this.isQueueError(error, message)) {
      return new QueueError(`Queue error: ${message}`, details);
    }

    if (this.isConfigurationError(error, message)) {
      return new ConfigurationError(`Configuration error: ${message}`, details);
    }

    // Default to generic scraper error
    return new ScraperError(message, 'UNKNOWN_ERROR', details);
  }

  /**
   * Helper methods for error type detection
   */
  isTimeoutError(error, message) {
    return message.includes('timeout') || 
           message.includes('ETIMEDOUT') || 
           (error && error.code === 'ETIMEDOUT');
  }

  isRateLimitError(error, message) {
    return message.includes('rate limit') || 
           message.includes('429') || 
           message.includes('Too Many Requests') ||
           (error && error.status === 429);
  }

  isConnectionError(error, message) {
    return message.includes('connection') || 
           message.includes('ECONNRESET') || 
           message.includes('ECONNREFUSED') ||
           message.includes('ENOTFOUND') ||
           (error && ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND'].includes(error.code));
  }

  isParsingError(error, message) {
    return message.includes('parse') || 
           message.includes('selector') || 
           message.includes('element not found') ||
           message.includes('cheerio') ||
           message.includes('Selector not found');
  }

  isDatabaseError(error, message) {
    return message.includes('database') || 
           message.includes('SQL') || 
           message.includes('sqlite') ||
           message.includes('SQLITE');
  }

  isValidationError(error, message) {
    return message.includes('validation') || 
           message.includes('invalid') || 
           message.includes('required field') ||
           message.includes('schema');
  }

  isQueueError(error, message) {
    return message.includes('queue') || 
           message.includes('job') || 
           message.includes('bull') ||
           message.includes('redis');
  }

  isConfigurationError(error, message) {
    return message.includes('config') || 
           message.includes('environment') || 
           message.includes('missing required');
  }
}

module.exports = {
  ScraperError,
  NetworkError,
  ParsingError,
  DatabaseError,
  RateLimitError,
  ConfigurationError,
  QueueError,
  ValidationError,
  ErrorHandler
};
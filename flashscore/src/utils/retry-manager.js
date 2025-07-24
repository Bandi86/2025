const { ErrorHandler } = require('./errors');
const logger = require('./logger');

/**
 * Circuit Breaker states
 */
const CircuitBreakerState = {
  CLOSED: 'CLOSED',     // Normal operation
  OPEN: 'OPEN',         // Circuit is open, failing fast
  HALF_OPEN: 'HALF_OPEN' // Testing if service is back
};

/**
 * Circuit Breaker implementation for handling persistent failures
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.successCount = 0;
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Function to execute
   * @param {string} context - Context for logging
   * @returns {Promise} Result of function execution
   */
  async execute(fn, context = '') {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker is OPEN for ${context}. Next attempt at ${new Date(this.nextAttemptTime)}`);
      } else {
        this.state = CircuitBreakerState.HALF_OPEN;
        logger.info(`Circuit breaker transitioning to HALF_OPEN for ${context}`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess(context);
      return result;
    } catch (error) {
      this.onFailure(error, context);
      throw error;
    }
  }

  /**
   * Handle successful execution
   * @param {string} context - Context for logging
   */
  onSuccess(context) {
    this.failureCount = 0;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 2) { // Require 2 successes to close
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
        logger.info(`Circuit breaker CLOSED for ${context} after successful recovery`);
      }
    }
  }

  /**
   * Handle failed execution
   * @param {Error} error - Error that occurred
   * @param {string} context - Context for logging
   */
  onFailure(error, context) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
      this.successCount = 0;
      logger.warn(`Circuit breaker OPEN for ${context} after failed recovery attempt`);
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
      logger.warn(`Circuit breaker OPEN for ${context} after ${this.failureCount} failures`);
    }
  }

  /**
   * Get current circuit breaker status
   * @returns {object} Status information
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      successCount: this.successCount
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset() {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.successCount = 0;
  }
}

/**
 * Retry Manager with configurable policies and circuit breaker support
 */
class RetryManager {
  constructor(options = {}) {
    this.defaultPolicy = {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      backoffFactor: options.backoffFactor || 2,
      jitterFactor: options.jitterFactor || 0.1,
      retryableErrors: options.retryableErrors || [
        'NETWORK_ERROR',
        'RATE_LIMIT_ERROR',
        'TIMEOUT',
        'CONNECTION_RESET',
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT'
      ]
    };

    this.policies = new Map();
    this.circuitBreakers = new Map();
    this.errorHandler = new ErrorHandler(logger);
  }

  /**
   * Register a custom retry policy for specific contexts
   * @param {string} context - Context identifier
   * @param {object} policy - Retry policy configuration
   */
  registerPolicy(context, policy) {
    this.policies.set(context, { ...this.defaultPolicy, ...policy });
  }

  /**
   * Get retry policy for a context
   * @param {string} context - Context identifier
   * @returns {object} Retry policy
   */
  getPolicy(context) {
    return this.policies.get(context) || this.defaultPolicy;
  }

  /**
   * Get or create circuit breaker for a context
   * @param {string} context - Context identifier
   * @param {object} options - Circuit breaker options
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  getCircuitBreaker(context, options = {}) {
    if (!this.circuitBreakers.has(context)) {
      this.circuitBreakers.set(context, new CircuitBreaker(options));
    }
    return this.circuitBreakers.get(context);
  }

  /**
   * Execute a function with retry logic and circuit breaker protection
   * @param {Function} fn - Async function to execute
   * @param {string} context - Context for retry policy and circuit breaker
   * @param {object} options - Override options
   * @returns {Promise} Result of function execution
   */
  async executeWithRetry(fn, context = 'default', options = {}) {
    const policy = { ...this.getPolicy(context), ...options };
    const circuitBreaker = this.getCircuitBreaker(context, options.circuitBreaker);
    
    let lastError;
    let attempt = 0;

    while (attempt <= policy.maxRetries) {
      try {
        // Execute with circuit breaker protection
        const result = await circuitBreaker.execute(async () => {
          logger.debug(`Executing ${context}, attempt ${attempt + 1}/${policy.maxRetries + 1}`);
          return await fn();
        }, context);

        if (attempt > 0) {
          logger.info(`${context} succeeded after ${attempt} retries`);
        }

        return result;

      } catch (error) {
        lastError = this.errorHandler.handle(error, context, { 
          attempt: attempt + 1, 
          maxRetries: policy.maxRetries + 1 
        });

        // Check if error is retryable
        if (!this.isRetryable(lastError, policy)) {
          logger.warn(`${context} failed with non-retryable error`, {
            error: lastError.code,
            message: lastError.message,
            attempt: attempt + 1
          });
          throw lastError;
        }

        // Check if we've exhausted retries
        if (attempt >= policy.maxRetries) {
          logger.error(`${context} failed after ${attempt + 1} attempts`, {
            error: lastError.code,
            message: lastError.message,
            totalAttempts: attempt + 1
          });
          throw lastError;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(lastError, attempt, policy);
        
        logger.warn(`${context} failed, retrying in ${delay}ms`, {
          error: lastError.code,
          message: lastError.message,
          attempt: attempt + 1,
          nextAttempt: attempt + 2,
          delay
        });

        await this.sleep(delay);
        attempt++;
      }
    }

    throw lastError;
  }

  /**
   * Check if an error is retryable based on policy
   * @param {Error} error - Error to check
   * @param {object} policy - Retry policy
   * @returns {boolean} Whether error is retryable
   */
  isRetryable(error, policy) {
    // Check if error has a code property that indicates it's retryable
    if (error.code && policy.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check if error message contains retryable error indicators
    const isMessageRetryable = policy.retryableErrors.some(retryableError => 
      error.message && error.message.includes(retryableError)
    );

    if (isMessageRetryable) {
      return true;
    }

    // Use ErrorHandler's static method as fallback
    return ErrorHandler.isRetryable(error);
  }

  /**
   * Calculate delay for next retry attempt
   * @param {Error} error - Error that occurred
   * @param {number} attempt - Current attempt number (0-based)
   * @param {object} policy - Retry policy
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(error, attempt, policy) {
    // Base exponential backoff
    let delay = Math.min(
      policy.baseDelay * Math.pow(policy.backoffFactor, attempt),
      policy.maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitter = delay * policy.jitterFactor * (Math.random() - 0.5);
    delay += jitter;

    // Special handling for specific error types
    if (error.code === 'RATE_LIMIT_ERROR') {
      // For rate limits, use a longer minimum delay
      delay = Math.max(delay, 5000);
      
      // If error contains retry-after header info, use it
      if (error.details && error.details.retryAfter) {
        delay = Math.max(delay, error.details.retryAfter * 1000);
      }
    }

    return Math.floor(delay);
  }

  /**
   * Sleep for specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry statistics for all contexts
   * @returns {object} Retry statistics
   */
  getStats() {
    const stats = {
      policies: Array.from(this.policies.keys()),
      circuitBreakers: {}
    };

    for (const [context, breaker] of this.circuitBreakers) {
      stats.circuitBreakers[context] = breaker.getStatus();
    }

    return stats;
  }

  /**
   * Reset circuit breaker for a specific context
   * @param {string} context - Context identifier
   */
  resetCircuitBreaker(context) {
    const breaker = this.circuitBreakers.get(context);
    if (breaker) {
      breaker.reset();
      logger.info(`Circuit breaker reset for ${context}`);
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers() {
    for (const [context, breaker] of this.circuitBreakers) {
      breaker.reset();
      logger.info(`Circuit breaker reset for ${context}`);
    }
  }

  /**
   * Create a retry wrapper function for a specific context
   * @param {string} context - Context identifier
   * @param {object} options - Retry options
   * @returns {Function} Wrapper function
   */
  createRetryWrapper(context, options = {}) {
    return (fn) => {
      return (...args) => {
        return this.executeWithRetry(() => fn(...args), context, options);
      };
    };
  }
}

module.exports = {
  RetryManager,
  CircuitBreaker,
  CircuitBreakerState
};
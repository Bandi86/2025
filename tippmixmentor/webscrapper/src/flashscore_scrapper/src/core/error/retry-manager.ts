/**
 * RetryManager - Handles retry logic with exponential backoff and circuit breaker
 */

import { 
  IRetryManager, 
  RetryOptions, 
  CircuitBreakerOptions,
  BaseScrapingError 
} from '../../types/errors.js';
import { CircuitBreaker } from './circuit-breaker.js';

export class RetryManager implements IRetryManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Execute an operation with retry logic
   */
  async execute<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
    let lastError: Error;
    let totalDelay = 0;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        // Execute the operation
        const result = await this.executeWithTimeout(operation, options.timeout);
        
        // Success - call onRetry callback if this was a retry
        if (attempt > 1 && options.onRetry) {
          options.onRetry(lastError!, attempt - 1);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry
        if (attempt === options.maxAttempts) {
          break; // Last attempt, don't retry
        }
        
        if (options.retryCondition && !options.retryCondition(lastError)) {
          break; // Custom condition says don't retry
        }
        
        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, options);
        totalDelay += delay;
        
        // Call onRetry callback
        if (options.onRetry) {
          options.onRetry(lastError, attempt);
        }
        
        // Wait before next attempt
        await this.sleep(delay);
      }
    }

    // All retries exhausted, throw the last error
    throw lastError!;
  }

  /**
   * Execute an operation with circuit breaker pattern
   */
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>, 
    options: RetryOptions & CircuitBreakerOptions
  ): Promise<T> {
    const circuitBreakerKey = this.getCircuitBreakerKey(operation);
    
    if (!this.circuitBreakers.has(circuitBreakerKey)) {
      this.circuitBreakers.set(circuitBreakerKey, new CircuitBreaker({
        failureThreshold: options.failureThreshold,
        resetTimeout: options.resetTimeout,
        monitoringPeriod: options.monitoringPeriod
      }));
    }
    
    const circuitBreaker = this.circuitBreakers.get(circuitBreakerKey)!;
    
    return circuitBreaker.execute(async () => {
      return this.execute(operation, options);
    });
  }

  /**
   * Create a retry wrapper for a function
   */
  createRetryWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: RetryOptions
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      return this.execute(() => fn(...args), options);
    };
  }

  /**
   * Batch retry operations with concurrency control
   */
  async executeBatch<T>(
    operations: Array<() => Promise<T>>,
    options: RetryOptions,
    concurrency: number = 3
  ): Promise<Array<T | Error>> {
    const results: Array<T | Error> = [];
    const executing: Array<Promise<void>> = [];

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      
      const promise = this.execute(operation, options)
        .then(result => {
          results[i] = result;
        })
        .catch(error => {
          results[i] = error;
        });
      
      executing.push(promise);
      
      // Control concurrency
      if (executing.length >= concurrency) {
        await Promise.race(executing);
        // Remove completed promises
        for (let j = executing.length - 1; j >= 0; j--) {
          if (await this.isPromiseSettled(executing[j])) {
            executing.splice(j, 1);
          }
        }
      }
    }
    
    // Wait for all remaining operations
    await Promise.all(executing);
    
    return results;
  }

  /**
   * Get retry statistics for monitoring
   */
  getRetryStats(): {
    activeCircuitBreakers: number;
    circuitBreakerStates: Record<string, string>;
  } {
    const states: Record<string, string> = {};
    
    for (const [key, breaker] of this.circuitBreakers.entries()) {
      states[key] = breaker.getState();
    }
    
    return {
      activeCircuitBreakers: this.circuitBreakers.size,
      circuitBreakerStates: states
    };
  }

  // Private helper methods

  private async executeWithTimeout<T>(
    operation: () => Promise<T>, 
    timeout?: number
  ): Promise<T> {
    if (!timeout) {
      return operation();
    }

    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeout}ms`));
        }, timeout);
      })
    ]);
  }

  private calculateDelay(attempt: number, options: RetryOptions): number {
    const exponentialDelay = options.baseDelay * Math.pow(options.backoffFactor, attempt - 1);
    
    // Add jitter to prevent thundering herd problem
    const jitter = Math.random() * 0.1 * exponentialDelay;
    
    // Apply maximum delay limit
    const delay = Math.min(exponentialDelay + jitter, options.maxDelay);
    
    return Math.floor(delay);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCircuitBreakerKey(operation: () => Promise<any>): string {
    // Generate a key based on the operation function
    // In a real implementation, you might want to use a more sophisticated key
    return operation.toString().slice(0, 100);
  }

  private async isPromiseSettled(promise: Promise<any>): Promise<boolean> {
    try {
      await Promise.race([
        promise,
        new Promise(resolve => setTimeout(resolve, 0))
      ]);
      return true;
    } catch {
      return true;
    }
  }
}
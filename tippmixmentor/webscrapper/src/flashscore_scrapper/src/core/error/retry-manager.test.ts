/**
 * Unit tests for RetryManager class
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RetryManager } from './retry-manager.js';
import { RetryOptions } from '../../types/errors.js';

describe('RetryManager', () => {
  let retryManager: RetryManager;
  let mockOperation: jest.Mock;

  beforeEach(() => {
    retryManager = new RetryManager();
    mockOperation = jest.fn();
  });

  describe('execute', () => {
    it('should execute operation successfully on first attempt', async () => {
      mockOperation.mockResolvedValue('success');

      const result = await retryManager.execute(mockOperation, {
        maxAttempts: 3,
        baseDelay: 10,
        backoffFactor: 2,
        maxDelay: 1000
      });

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry failed operations with exponential backoff', async () => {
      let attempts = 0;
      mockOperation.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return Promise.resolve('success');
      });

      const startTime = Date.now();
      const result = await retryManager.execute(mockOperation, {
        maxAttempts: 3,
        baseDelay: 50,
        backoffFactor: 2,
        maxDelay: 1000
      });
      const endTime = Date.now();

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
      // Should have some delay due to retries
      expect(endTime - startTime).toBeGreaterThan(50);
    });

    it('should throw error after max attempts exceeded', async () => {
      mockOperation.mockRejectedValue(new Error('Persistent failure'));

      await expect(retryManager.execute(mockOperation, {
        maxAttempts: 2,
        baseDelay: 10,
        backoffFactor: 2,
        maxDelay: 1000
      })).rejects.toThrow('Persistent failure');

      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should respect custom retry condition', async () => {
      mockOperation.mockRejectedValue(new Error('Non-retryable error'));

      const retryCondition = jest.fn().mockReturnValue(false);

      await expect(retryManager.execute(mockOperation, {
        maxAttempts: 3,
        baseDelay: 10,
        backoffFactor: 2,
        maxDelay: 1000,
        retryCondition
      })).rejects.toThrow('Non-retryable error');

      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(retryCondition).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call onRetry callback on retry attempts', async () => {
      let attempts = 0;
      mockOperation.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return Promise.resolve('success');
      });

      const onRetry = jest.fn();

      await retryManager.execute(mockOperation, {
        maxAttempts: 3,
        baseDelay: 10,
        backoffFactor: 2,
        maxDelay: 1000,
        onRetry
      });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1);
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2);
    });

    it('should handle timeout correctly', async () => {
      mockOperation.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(retryManager.execute(mockOperation, {
        maxAttempts: 1,
        baseDelay: 10,
        backoffFactor: 2,
        maxDelay: 1000,
        timeout: 100
      })).rejects.toThrow('Operation timed out after 100ms');
    });
  });

  describe('createRetryWrapper', () => {
    it('should create a retry wrapper function', async () => {
      const originalFunction = jest.fn().mockResolvedValue('wrapped success');

      const wrappedFunction = retryManager.createRetryWrapper(originalFunction, {
        maxAttempts: 2,
        baseDelay: 10,
        backoffFactor: 2,
        maxDelay: 1000
      });

      const result = await wrappedFunction('arg1', 'arg2');

      expect(result).toBe('wrapped success');
      expect(originalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should retry wrapped function on failure', async () => {
      let attempts = 0;
      const originalFunction = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Wrapped function failed');
        }
        return Promise.resolve('wrapped success');
      });

      const wrappedFunction = retryManager.createRetryWrapper(originalFunction, {
        maxAttempts: 2,
        baseDelay: 10,
        backoffFactor: 2,
        maxDelay: 1000
      });

      const result = await wrappedFunction();

      expect(result).toBe('wrapped success');
      expect(originalFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('executeBatch', () => {
    it('should execute batch operations with concurrency control', async () => {
      const operations = [
        jest.fn().mockResolvedValue('result1'),
        jest.fn().mockResolvedValue('result2'),
        jest.fn().mockRejectedValue(new Error('operation3 failed')),
        jest.fn().mockResolvedValue('result4')
      ];

      const results = await retryManager.executeBatch(operations, {
        maxAttempts: 1,
        baseDelay: 10,
        backoffFactor: 2,
        maxDelay: 1000
      }, 2);

      expect(results).toHaveLength(4);
      expect(results[0]).toBe('result1');
      expect(results[1]).toBe('result2');
      expect(results[2]).toBeInstanceOf(Error);
      expect(results[3]).toBe('result4');
    });

    it('should handle empty batch operations', async () => {
      const results = await retryManager.executeBatch([], {
        maxAttempts: 1,
        baseDelay: 10,
        backoffFactor: 2,
        maxDelay: 1000
      });

      expect(results).toEqual([]);
    });
  });

  describe('getRetryStats', () => {
    it('should return retry statistics', () => {
      const stats = retryManager.getRetryStats();

      expect(stats).toHaveProperty('activeCircuitBreakers');
      expect(stats).toHaveProperty('circuitBreakerStates');
      expect(typeof stats.activeCircuitBreakers).toBe('number');
      expect(typeof stats.circuitBreakerStates).toBe('object');
    });
  });

  describe('delay calculation', () => {
    it('should calculate exponential backoff with jitter', async () => {
      let attempts = 0;
      const delays: number[] = [];

      mockOperation.mockImplementation(() => {
        attempts++;
        if (attempts < 4) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return Promise.resolve('success');
      });

      const onRetry = jest.fn().mockImplementation((error, attempt) => {
        // Record when retry callback is called to measure delays
        delays.push(Date.now());
      });

      const startTime = Date.now();
      await retryManager.execute(mockOperation, {
        maxAttempts: 4,
        baseDelay: 100,
        backoffFactor: 2,
        maxDelay: 1000,
        onRetry
      });

      // Verify exponential backoff pattern
      expect(delays).toHaveLength(3);

      // Each delay should be roughly double the previous (with jitter)
      if (delays.length >= 2) {
        const delay1 = delays[1] - delays[0];
        const delay2 = delays[2] - delays[1];
        expect(delay2).toBeGreaterThan(delay1 * 1.5); // Account for jitter
      }
    });

    it('should respect maximum delay limit', async () => {
      let attempts = 0;
      mockOperation.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return Promise.resolve('success');
      });

      const startTime = Date.now();
      await retryManager.execute(mockOperation, {
        maxAttempts: 3,
        baseDelay: 1000,
        backoffFactor: 10,
        maxDelay: 500 // Very low max delay
      });
      const endTime = Date.now();

      // Total time should be limited by maxDelay
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});
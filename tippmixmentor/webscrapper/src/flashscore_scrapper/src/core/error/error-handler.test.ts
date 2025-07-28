/**
 * Unit tests for ErrorHandler class
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ErrorHandler } from './error-handler.js';
import {
  NetworkError,
  ScrapingError,
  DataValidationError,
  SystemError,
  ConfigurationError,
  ErrorContext
} from '../../types/errors.js';
import { ErrorType } from '../../types/core.js';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockLogger: any;
  let mockContext: ErrorContext;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    errorHandler = new ErrorHandler(mockLogger);

    mockContext = {
      operation: 'test-operation',
      url: 'https://example.com',
      attempt: 1,
      timestamp: new Date()
    };
  });

  describe('classify', () => {
    it('should classify network errors correctly', () => {
      const networkErrors = [
        new Error('ECONNREFUSED'),
        new Error('ETIMEDOUT'),
        new Error('fetch failed'),
        new Error('network timeout')
      ];

      networkErrors.forEach(error => {
        expect(errorHandler.classify(error)).toBe(ErrorType.NETWORK);
      });
    });

    it('should classify scraping errors correctly', () => {
      const scrapingErrors = [
        new Error('selector not found'),
        new Error('element not found'),
        new Error('page not loaded'),
        new Error('waiting for selector timeout')
      ];

      scrapingErrors.forEach(error => {
        expect(errorHandler.classify(error)).toBe(ErrorType.SCRAPING);
      });
    });

    it('should classify validation errors correctly', () => {
      const validationErrors = [
        new Error('validation failed'),
        new Error('invalid data format'),
        new Error('required field missing'),
        new Error('schema validation error')
      ];

      validationErrors.forEach(error => {
        expect(errorHandler.classify(error)).toBe(ErrorType.VALIDATION);
      });
    });

    it('should classify configuration errors correctly', () => {
      const configErrors = [
        new Error('configuration missing'),
        new Error('invalid setting'),
        new Error('environment variable not found'),
        new Error('config validation failed')
      ];

      configErrors.forEach(error => {
        expect(errorHandler.classify(error)).toBe(ErrorType.CONFIGURATION);
      });
    });

    it('should default to system error for unknown errors', () => {
      const unknownError = new Error('some random error');
      expect(errorHandler.classify(unknownError)).toBe(ErrorType.SYSTEM);
    });

    it('should return existing type for BaseScrapingError instances', () => {
      const networkError = new NetworkError('Network failed', mockContext);
      expect(errorHandler.classify(networkError)).toBe(ErrorType.NETWORK);
    });
  });

  describe('shouldRetry', () => {
    it('should not retry if max attempts exceeded', () => {
      const error = new Error('test error');
      expect(errorHandler.shouldRetry(error, 5)).toBe(false);
    });

    it('should not retry non-retryable errors', () => {
      const error = new DataValidationError('Invalid data', mockContext);
      expect(errorHandler.shouldRetry(error, 1)).toBe(false);
    });

    it('should retry retryable errors within attempt limit', () => {
      const error = new NetworkError('Connection failed', mockContext);
      expect(errorHandler.shouldRetry(error, 1)).toBe(true);
      expect(errorHandler.shouldRetry(error, 2)).toBe(true);
    });
  });

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const baseDelay = 1000;
      const backoffFactor = 2;

      const delay1 = errorHandler.getRetryDelay(1, baseDelay, backoffFactor);
      const delay2 = errorHandler.getRetryDelay(2, baseDelay, backoffFactor);
      const delay3 = errorHandler.getRetryDelay(3, baseDelay, backoffFactor);

      expect(delay1).toBeGreaterThanOrEqual(baseDelay);
      expect(delay2).toBeGreaterThanOrEqual(baseDelay * 2);
      expect(delay3).toBeGreaterThanOrEqual(baseDelay * 4);
    });

    it('should cap delay at maximum value', () => {
      const delay = errorHandler.getRetryDelay(10, 1000, 2);
      expect(delay).toBeLessThanOrEqual(30000); // Max 30 seconds
    });

    it('should include jitter in delay calculation', () => {
      const delays = Array.from({ length: 10 }, () =>
        errorHandler.getRetryDelay(1, 1000, 2)
      );

      // All delays should be different due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('handle', () => {
    it('should handle and log errors correctly', async () => {
      const error = new Error('Test error');

      await errorHandler.handle(error, mockContext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error occurred during scraping operation',
        expect.objectContaining({
          type: ErrorType.SYSTEM,
          message: 'Test error',
          context: mockContext
        })
      );
    });

    it('should update metrics when handling errors', async () => {
      const error = new NetworkError('Network error', mockContext);

      await errorHandler.handle(error, mockContext);

      const metrics = errorHandler.getMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByType[ErrorType.NETWORK]).toBe(1);
    });

    it('should handle errors without logger gracefully', async () => {
      const errorHandlerNoLogger = new ErrorHandler();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const error = new Error('Test error');
      await errorHandlerNoLogger.handle(error, mockContext);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const operation = jest.fn<(...args: any[]) => Promise<any>>().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await errorHandler.retry(operation, {
        maxAttempts: 3,
        baseDelay: 10,
        backoffFactor: 1,
        maxDelay: 100
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max attempts', async () => {
      const operation = jest.fn<(...args: any[]) => Promise<any>>().mockRejectedValue(new Error('Persistent failure'));

      await expect(errorHandler.retry(operation, {
        maxAttempts: 2,
        baseDelay: 10,
        backoffFactor: 1,
        maxDelay: 100
      })).rejects.toThrow('Persistent failure');

      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('metrics', () => {
    it('should track error metrics correctly', async () => {
      const networkError = new NetworkError('Network error', mockContext);
      const scrapingError = new ScrapingError('Scraping error', mockContext);

      await errorHandler.handle(networkError, mockContext);
      await errorHandler.handle(scrapingError, mockContext);

      const metrics = errorHandler.getMetrics();
      expect(metrics.totalErrors).toBe(2);
      expect(metrics.errorsByType[ErrorType.NETWORK]).toBe(1);
      expect(metrics.errorsByType[ErrorType.SCRAPING]).toBe(1);
    });

    it('should reset metrics correctly', async () => {
      const error = new Error('Test error');
      await errorHandler.handle(error, mockContext);

      expect(errorHandler.getMetrics().totalErrors).toBe(1);

      errorHandler.resetMetrics();

      expect(errorHandler.getMetrics().totalErrors).toBe(0);
    });
  });
});
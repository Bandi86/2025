import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ErrorHandler } from '../../../src/core/error/error-handler';
import { ErrorType } from '../../../src/types/core';
import { NetworkError, ScrapingError } from '../../../src/types/errors';

describe('ErrorHandler Integration', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };
    errorHandler = new ErrorHandler(mockLogger);
  });

  it('should classify a real network-like error', () => {
    const error = new Error('A network connection error occurred');
    const classifiedType = errorHandler.classify(error);
    expect(classifiedType).toBe(ErrorType.NETWORK);
  });

  it('should classify a real scraping-like error', () => {
    const error = new Error('Could not find selector: .event__match');
    const classifiedType = errorHandler.classify(error);
    expect(classifiedType).toBe(ErrorType.SCRAPING);
  });

  it('should successfully retry a failing operation', async () => {
    let attempt = 0;
    const operation = async () => {
      attempt++;
      if (attempt < 3) {
        throw new Error('Temporary failure');
      }
      return 'Success';
    };

    const result = await errorHandler.retry(operation, {
      maxAttempts: 3,
      baseDelay: 10,
      backoffFactor: 1,
      maxDelay: 100,
    });

    expect(result).toBe('Success');
    expect(attempt).toBe(3);
  });

  it('should fail after all retry attempts are exhausted', async () => {
    const operation = async () => {
      throw new Error('Persistent failure');
    };

    await expect(
      errorHandler.retry(operation, {
        maxAttempts: 2,
        baseDelay: 10,
        backoffFactor: 1,
        maxDelay: 100,
      })
    ).rejects.toThrow('Persistent failure');
  });
});
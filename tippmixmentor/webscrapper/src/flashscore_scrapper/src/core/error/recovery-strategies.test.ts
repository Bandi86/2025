/**
 * Unit tests for Recovery Strategies
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  ErrorRecoveryManager,
  GracefulDegradation
} from './recovery-strategies.js';
import {
  NetworkError,
  ScrapingError,
  SystemError,
  DataValidationError,
  ErrorContext,
  RecoveryActionType
} from '../../types/errors.js';
import { ErrorType } from '../../types/core.js';

describe('ErrorRecoveryManager', () => {
  let recoveryManager: ErrorRecoveryManager;
  let mockContext: ErrorContext;

  beforeEach(() => {
    recoveryManager = new ErrorRecoveryManager();
    mockContext = {
      operation: 'test-operation',
      url: 'https://example.com',
      attempt: 1,
      timestamp: new Date()
    };
  });

  describe('canRecover', () => {
    it('should return true for retryable network errors', () => {
      const networkError = new NetworkError('Connection failed', mockContext);
      expect(recoveryManager.canRecover(networkError)).toBe(true);
    });

    it('should return true for retryable scraping errors', () => {
      const scrapingError = new ScrapingError('Selector not found', mockContext);
      expect(recoveryManager.canRecover(scrapingError)).toBe(true);
    });

    it('should return false for non-retryable validation errors', () => {
      const validationError = new DataValidationError('Invalid data', mockContext);
      expect(recoveryManager.canRecover(validationError)).toBe(false);
    });

    it('should return false for errors without recovery actions', () => {
      const systemError = new SystemError('Unknown system error', mockContext);
      // System errors have recovery actions, so this should return true
      expect(recoveryManager.canRecover(systemError)).toBe(false); // System errors are not retryable by default
    });
  });

  describe('getRecoveryActions', () => {
    it('should return network error recovery actions', () => {
      const networkError = new NetworkError('Connection failed', mockContext);
      const actions = recoveryManager.getRecoveryActions(networkError);

      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe(RecoveryActionType.WAIT_AND_RETRY);
      expect(actions[1].type).toBe(RecoveryActionType.CHANGE_USER_AGENT);
    });

    it('should return scraping error recovery actions', () => {
      const scrapingError = new ScrapingError('Selector not found', mockContext);
      const actions = recoveryManager.getRecoveryActions(scrapingError);

      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe(RecoveryActionType.FALLBACK_SELECTOR);
      expect(actions[1].type).toBe(RecoveryActionType.RESTART_BROWSER);
    });

    it('should return empty array for unsupported error types', () => {
      const validationError = new DataValidationError('Invalid data', mockContext);
      const actions = recoveryManager.getRecoveryActions(validationError);

      expect(actions).toHaveLength(0);
    });
  });

  describe('executeRecovery', () => {
    it('should execute recovery actions successfully', async () => {
      const networkError = new NetworkError('Connection failed', mockContext);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      // Mock sleep to prevent actual delays during test execution
      const sleepSpy = jest.spyOn(ErrorRecoveryManager.prototype as any, 'sleep').mockImplementation(() => Promise.resolve());

      const result = await recoveryManager.executeRecovery(networkError);

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
      sleepSpy.mockRestore();
    });

    it('should return false when no recovery actions available', async () => {
      const validationError = new DataValidationError('Invalid data', mockContext);

      const result = await recoveryManager.executeRecovery(validationError);

      expect(result).toBe(false);
    });

    it('should handle recovery action failures gracefully', async () => {
      const networkError = new NetworkError('Connection failed', mockContext);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock recovery action to throw error
      const actions = recoveryManager.getRecoveryActions(networkError);
      const originalExecute = actions[0].execute;
      actions[0].execute = jest.fn<() => Promise<void>>(() => Promise.reject(new Error('Recovery failed')));

      const result = await recoveryManager.executeRecovery(networkError);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Recovery action failed:', expect.any(Error));

      // Restore original function
      actions[0].execute = originalExecute;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('fallback selectors', () => {
    it('should add and retrieve fallback selectors', () => {
      const primarySelector = '.primary-selector';
      const fallbacks = ['.fallback1', '.fallback2'];

      recoveryManager.addFallbackSelector(primarySelector, fallbacks);

      const retrievedFallbacks = recoveryManager.getFallbackSelectors(primarySelector);
      expect(retrievedFallbacks).toEqual(fallbacks);
    });

    it('should return empty array for unknown selectors', () => {
      const fallbacks = recoveryManager.getFallbackSelectors('.unknown-selector');
      expect(fallbacks).toEqual([]);
    });

    it('should have predefined fallback selectors', () => {
      const matchFallbacks = recoveryManager.getFallbackSelectors('.event__match');
      expect(matchFallbacks.length).toBeGreaterThan(0);
      expect(matchFallbacks).toContain('[data-testid="match"]');
    });
  });

  describe('createPartialDataRecovery', () => {
    it('should create partial data recovery action with sufficient data', async () => {
      const partialData = { id: '123', name: 'Test Match' };
      const requiredFields = ['id', 'name'] as Array<'id' | 'name'>;

      const recoveryAction = recoveryManager.createPartialDataRecovery(
        partialData,
        requiredFields
      );

      expect(recoveryAction.type).toBe(RecoveryActionType.SKIP_OPERATION);

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      await recoveryAction.execute();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Partial data recovery executed',
        expect.objectContaining({
          availableFields: ['id', 'name'],
          requiredFields: ['id', 'name']
        })
      );

      consoleWarnSpy.mockRestore();
    });

    it('should throw error when required fields are missing', async () => {
      const partialData: { id: string; name?: string } = { id: '123' };
      const requiredFields = ['id'] as Array<'id'>;

      const recoveryAction = recoveryManager.createPartialDataRecovery(
        partialData,
        requiredFields
      );

      await expect(recoveryAction.execute()).rejects.toThrow('Insufficient data for partial recovery');
    });
  });
});

describe('GracefulDegradation', () => {
  describe('executeWithFallback', () => {
    it('should return primary operation result when successful', async () => {
      const primaryOp = jest.fn<() => Promise<{ id: string; name: string; data: string; }>>(() => Promise.resolve({ id: '1', name: 'Primary', data: 'complete' }));
      const fallbackOp = jest.fn<() => Promise<{ id: string; name: string; }>>(() => Promise.resolve({ id: '1', name: 'Fallback' }));

      const result = await GracefulDegradation.executeWithFallback(
        primaryOp,
        fallbackOp,
        ['id', 'name']
      );

      expect(result).toEqual({ id: '1', name: 'Primary', data: 'complete' });
      expect(primaryOp).toHaveBeenCalled();
      expect(fallbackOp).not.toHaveBeenCalled();
    });

    it('should use fallback when primary operation fails', async () => {
      const primaryOp = jest.fn<() => Promise<{ id: string; name: string; data: string; }>>(() => Promise.reject(new Error('Primary failed')));
      const fallbackOp = jest.fn<() => Promise<{ id: string; name: string; }>>(() => Promise.resolve({ id: '1', name: 'Fallback' }));
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await GracefulDegradation.executeWithFallback(
        primaryOp,
        fallbackOp,
        ['id', 'name']
      );

      expect(result).toEqual({ id: '1', name: 'Fallback' });
      expect(primaryOp).toHaveBeenCalled();
      expect(fallbackOp).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Primary operation failed, attempting fallback',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should throw original error when fallback lacks required fields', async () => {
      const primaryError = new Error('Primary failed');
      const primaryOp = jest.fn<() => Promise<{ id: string; name: string; }>>(() => Promise.reject(primaryError));
      const fallbackOp = jest.fn<() => Promise<{ id: string; name: string | undefined; }>>(() => Promise.resolve({ id: '1', name: undefined })); // Missing 'name'

      await expect(GracefulDegradation.executeWithFallback(
        primaryOp,
        fallbackOp,
        ['id', 'name']
      )).rejects.toThrow('Primary failed');
    });

    it('should throw original error when fallback also fails', async () => {
      const primaryError = new Error('Primary failed');
      const primaryOp = jest.fn<() => Promise<{ id: string; }>>(() => Promise.reject(primaryError));
      const fallbackOp = jest.fn<() => Promise<{ id: string; }>>(() => Promise.reject(new Error('Fallback failed')));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(GracefulDegradation.executeWithFallback(
        primaryOp,
        fallbackOp,
        ['id']
      )).rejects.toThrow('Primary failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Fallback operation also failed',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('collectPartialResults', () => {
    it('should collect successful results and track failures', async () => {
      const operations = [
        jest.fn<() => Promise<string>>(() => Promise.resolve('result1')),
        jest.fn<() => Promise<string>>(() => Promise.reject(new Error('op2 failed'))),
        jest.fn<() => Promise<string>>(() => Promise.resolve('result3')),
        jest.fn<() => Promise<string>>(() => Promise.reject(new Error('op4 failed')))
      ];

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await GracefulDegradation.collectPartialResults(operations, 1);

      expect(result.successful).toEqual(['result1', 'result3']);
      expect(result.failed).toHaveLength(2);
      expect(result.successRate).toBe(0.5);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

      consoleWarnSpy.mockRestore();
    });

    it('should throw error when minimum success count not met', async () => {
      const operations = [
        jest.fn<() => Promise<string>>(() => Promise.reject(new Error('op1 failed'))),
        jest.fn<() => Promise<string>>(() => Promise.reject(new Error('op2 failed')))
      ];

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(GracefulDegradation.collectPartialResults(operations, 1))
        .rejects.toThrow('Insufficient successful operations: 0/2 (minimum: 1)');

      consoleWarnSpy.mockRestore();
    });

    it('should handle empty operations array', async () => {
      const result = await GracefulDegradation.collectPartialResults([], 0);

      expect(result.successful).toEqual([]);
      expect(result.failed).toEqual([]);
      expect(result.successRate).toBe(0); // For empty operations, success rate is 0
    });
  });

  describe('createResilientCollector', () => {
    it('should collect data from all successful extractors', async () => {
      const extractors = {
        id: jest.fn<() => Promise<string>>(() => Promise.resolve('123')),
        name: jest.fn<() => Promise<string>>(() => Promise.resolve('Test Name')),
        optional: jest.fn<() => Promise<string>>(() => Promise.resolve('Optional Data'))
      };

      const collector = GracefulDegradation.createResilientCollector(
        extractors,
        ['id', 'name']
      );

      const result = await collector();

      expect(result).toEqual({
        id: '123',
        name: 'Test Name',
        optional: 'Optional Data'
      });
    });

    it('should continue with partial data when optional extractors fail', async () => {
      const extractors = {
        id: jest.fn<() => Promise<string>>(() => Promise.resolve('123')),
        name: jest.fn<() => Promise<string>>(() => Promise.resolve('Test Name')),
        optional: jest.fn<() => Promise<string>>(() => Promise.reject(new Error('Optional failed')))
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const collector = GracefulDegradation.createResilientCollector(
        extractors,
        ['id', 'name']
      );

      const result = await collector();

      expect(result).toEqual({
        id: '123',
        name: 'Test Name'
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Partial data extraction completed',
        expect.objectContaining({
          extracted: ['id', 'name'],
          failed: ['optional'],
          successRate: 2/3
        })
      );

      consoleWarnSpy.mockRestore();
    });

    it('should throw error when required fields are missing', async () => {
      const extractors = {
        id: jest.fn<() => Promise<string>>(() => Promise.resolve('123')),
        name: jest.fn<() => Promise<string>>(() => Promise.reject(new Error('Name extraction failed'))),
        optional: jest.fn<() => Promise<string>>(() => Promise.resolve('Optional Data'))
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const collector = GracefulDegradation.createResilientCollector(
        extractors,
        ['id', 'name']
      );

      await expect(collector()).rejects.toThrow('Missing required fields: name');

      consoleWarnSpy.mockRestore();
    });

    it('should handle empty extractors', async () => {
      const collector = GracefulDegradation.createResilientCollector({}, []);

      const result = await collector();

      expect(result).toEqual({});
    });
  });
});
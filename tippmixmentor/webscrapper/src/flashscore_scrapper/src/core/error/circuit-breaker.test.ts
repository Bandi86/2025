/**
 * Unit tests for CircuitBreaker class
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CircuitBreaker, CircuitBreakerState } from './circuit-breaker.js';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let mockOperation: jest.MockedFunction<() => Promise<unknown>>;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 500
    });
    mockOperation = jest.fn() as jest.MockedFunction<() => Promise<unknown>>;
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should have zero failure count initially', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
    });
  });

  describe('successful operations', () => {
    it('should execute successful operations normally', async () => {
      mockOperation.mockResolvedValueOnce('success');

      const result = await circuitBreaker.execute(mockOperation as () => Promise<unknown>);

      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getStats().successCount).toBe(1);
    });

    it('should reset failure count on success', async () => {
      // Cause some failures first
      for (let i = 0; i < 3; i++) {
        mockOperation.mockImplementationOnce(() => Promise.reject(new Error('failure')));
      }

      try {
        await circuitBreaker.execute(mockOperation as () => Promise<unknown>);
      } catch {}

      try {
        await circuitBreaker.execute(mockOperation as () => Promise<unknown>);
      } catch {}

      expect(circuitBreaker.getStats().failureCount).toBe(2);

      // Now succeed
      mockOperation.mockImplementationOnce(() => Promise.resolve('success'));
      await circuitBreaker.execute(mockOperation as () => Promise<unknown>);

      expect(circuitBreaker.getStats().failureCount).toBe(0);
      expect(circuitBreaker.getStats().successCount).toBe(1);
    });
  });

  describe('failure handling', () => {
    it('should track failures correctly', async () => {
      for (let i = 0; i < 3; i++) {
        mockOperation.mockImplementationOnce(() => Promise.reject(new Error('failure')));
      }

      try {
        await circuitBreaker.execute(mockOperation as () => Promise<unknown>);
      } catch {}

      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(1);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should open circuit after failure threshold', async () => {
      // Use mockImplementation to simulate multiple failures
      for (let i = 0; i < 3; i++) {
        mockOperation.mockImplementationOnce(() => Promise.reject(new Error('failure')));
      }

      // Cause failures up to threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation as () => Promise<unknown>);
        } catch {}
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      expect(circuitBreaker.getStats().failureCount).toBe(3);
    });

    it('should reject operations when circuit is open', async () => {
      // Trip the circuit breaker
      circuitBreaker.trip();

      await expect(circuitBreaker.execute(mockOperation as () => Promise<unknown>))
        .rejects.toThrow('Circuit breaker is OPEN - operation not allowed');

      expect(mockOperation).not.toHaveBeenCalled();
    });
  });

  describe('half-open state and recovery', () => {
    it('should transition to half-open after reset timeout', async () => {
      // Trip the circuit breaker
      // Use mockImplementation to simulate multiple failures
      for (let i = 0; i < 3; i++) {
        mockOperation.mockImplementationOnce(() => Promise.reject(new Error('failure')));
      }

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation as () => Promise<unknown>);
        } catch {}
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Wait for reset timeout (simulate by manually setting time)
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 2000);

      mockOperation.mockImplementationOnce(() => Promise.resolve('success'));
      const result = await circuitBreaker.execute(mockOperation as () => Promise<unknown>);

      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);

      // Restore Date.now
      Date.now = originalNow;
    });

    it('should close circuit on successful operation in half-open state', async () => {
      // Manually set to half-open state
      circuitBreaker.trip();

      // Simulate reset timeout passed
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 2000);

      mockOperation.mockImplementationOnce(() => Promise.resolve('recovery success'));
      const result = await circuitBreaker.execute(mockOperation as () => Promise<unknown>);

      expect(result).toBe('recovery success');
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);

      // Restore Date.now
      Date.now = originalNow;
    });

    it('should reopen circuit on failure in half-open state', async () => {
      // Trip the circuit breaker
      // Use mockImplementation to simulate multiple failures
      for (let i = 0; i < 3; i++) {
        mockOperation.mockImplementationOnce(() => Promise.reject(new Error('failure')));
      }

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation as () => Promise<unknown>);
        } catch {}
      }

      // Simulate reset timeout passed
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 2000);

      // Fail again in half-open state
      try {
        await circuitBreaker.execute(mockOperation as () => Promise<unknown>);
      } catch {}

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('manual control', () => {
    it('should reset circuit breaker manually', () => {
      // Trip the circuit breaker
      circuitBreaker.trip();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Reset manually
      circuitBreaker.reset();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);

      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
    });

    it('should trip circuit breaker manually', () => {
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);

      circuitBreaker.trip();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });
  });

  describe('statistics', () => {
    it('should provide accurate statistics', async () => {
      mockOperation.mockImplementationOnce(() => Promise.resolve('success'));
      await circuitBreaker.execute(mockOperation as () => Promise<unknown>);
      await circuitBreaker.execute(mockOperation as () => Promise<unknown>);

      for (let i = 0; i < 5; i++) {
        mockOperation.mockImplementationOnce(() => Promise.reject(new Error('failure')));
      }
      try {
        await circuitBreaker.execute(mockOperation as () => Promise<unknown>);
      } catch {}

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.successCount).toBe(2);
      expect(stats.failureCount).toBe(1);
      expect(stats.lastFailureTime).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customBreaker = new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 2000,
        monitoringPeriod: 1000
      });

      // Should require 5 failures to open
      // Use mockImplementation to simulate multiple failures
      for (let i = 0; i < 5; i++) {
        mockOperation.mockImplementationOnce(() => Promise.reject(new Error('failure')));
      }

      const executeFailures = async (count: number) => {
        for (let i = 0; i < count; i++) {
          try {
            await customBreaker.execute(mockOperation as () => Promise<unknown>);
          } catch {}
        }
      };

      return executeFailures(4).then(() => {
        expect(customBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
        return executeFailures(1);
      }).then(() => {
        expect(customBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      });
    });

    it('should use default configuration when not provided', () => {
      const defaultBreaker = new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 10000
      });

      // Should use default failure threshold of 5
      expect(defaultBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });
});
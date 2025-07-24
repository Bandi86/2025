const { RetryManager, CircuitBreaker, CircuitBreakerState } = require('../src/utils/retry-manager');
const { NetworkError, RateLimitError, ConfigurationError } = require('../src/utils/errors');

describe('CircuitBreaker', () => {
  let circuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 1000,
      monitoringPeriod: 500
    });
  });

  describe('Circuit Breaker States', () => {
    test('should start in CLOSED state', () => {
      expect(circuitBreaker.state).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.failureCount).toBe(0);
    });

    test('should transition to OPEN after threshold failures', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new Error('Test failure'));

      // Execute failing function multiple times
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFunction, 'test');
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.state).toBe(CircuitBreakerState.OPEN);
      expect(circuitBreaker.failureCount).toBe(3);
    });

    test('should fail fast when OPEN', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new Error('Test failure'));

      // Trigger circuit breaker to open
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFunction, 'test');
        } catch (error) {
          // Expected to fail
        }
      }

      // Should fail fast without calling function
      const fastFailFunction = jest.fn().mockResolvedValue('success');
      
      await expect(circuitBreaker.execute(fastFailFunction, 'test'))
        .rejects.toThrow('Circuit breaker is OPEN');
      
      expect(fastFailFunction).not.toHaveBeenCalled();
    });

    test('should transition to HALF_OPEN after recovery timeout', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new Error('Test failure'));

      // Open the circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFunction, 'test');
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.state).toBe(CircuitBreakerState.OPEN);

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      const successFunction = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successFunction, 'test');

      expect(circuitBreaker.state).toBe(CircuitBreakerState.HALF_OPEN);
    });

    test('should close after successful executions in HALF_OPEN', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new Error('Test failure'));
      const successFunction = jest.fn().mockResolvedValue('success');

      // Open the circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFunction, 'test');
        } catch (error) {
          // Expected to fail
        }
      }

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Execute successful functions to close circuit
      await circuitBreaker.execute(successFunction, 'test');
      await circuitBreaker.execute(successFunction, 'test');

      expect(circuitBreaker.state).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.failureCount).toBe(0);
    });
  });

  describe('Circuit Breaker Management', () => {
    test('should provide status information', () => {
      const status = circuitBreaker.getStatus();
      
      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('failureCount');
      expect(status).toHaveProperty('lastFailureTime');
      expect(status).toHaveProperty('nextAttemptTime');
      expect(status).toHaveProperty('successCount');
    });

    test('should reset to initial state', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new Error('Test failure'));

      // Open the circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFunction, 'test');
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.state).toBe(CircuitBreakerState.OPEN);

      circuitBreaker.reset();

      expect(circuitBreaker.state).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.failureCount).toBe(0);
      expect(circuitBreaker.lastFailureTime).toBeNull();
    });
  });
});

describe('RetryManager', () => {
  let retryManager;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    retryManager = new RetryManager({
      maxRetries: 2,
      baseDelay: 100,
      maxDelay: 1000,
      backoffFactor: 2
    });
  });

  describe('Policy Management', () => {
    test('should use default policy when none specified', () => {
      const policy = retryManager.getPolicy('unknown-context');
      
      expect(policy.maxRetries).toBe(2);
      expect(policy.baseDelay).toBe(100);
      expect(policy.backoffFactor).toBe(2);
    });

    test('should register and use custom policies', () => {
      const customPolicy = {
        maxRetries: 5,
        baseDelay: 500,
        backoffFactor: 1.5
      };

      retryManager.registerPolicy('custom-context', customPolicy);
      const policy = retryManager.getPolicy('custom-context');

      expect(policy.maxRetries).toBe(5);
      expect(policy.baseDelay).toBe(500);
      expect(policy.backoffFactor).toBe(1.5);
    });
  });

  describe('Retry Logic', () => {
    test('should succeed on first attempt', async () => {
      const successFunction = jest.fn().mockResolvedValue('success');
      
      const result = await retryManager.executeWithRetry(successFunction, 'test');
      
      expect(result).toBe('success');
      expect(successFunction).toHaveBeenCalledTimes(1);
    });

    test('should retry on retryable errors', async () => {
      const failThenSucceed = jest.fn()
        .mockRejectedValueOnce(new NetworkError('Connection failed'))
        .mockResolvedValue('success');
      
      const result = await retryManager.executeWithRetry(failThenSucceed, 'test');
      
      expect(result).toBe('success');
      expect(failThenSucceed).toHaveBeenCalledTimes(2);
    });

    test('should not retry on non-retryable errors', async () => {
      const nonRetryableFunction = jest.fn()
        .mockRejectedValue(new ConfigurationError('Config missing'));
      
      await expect(retryManager.executeWithRetry(nonRetryableFunction, 'test'))
        .rejects.toThrow('Config missing');
      
      expect(nonRetryableFunction).toHaveBeenCalledTimes(1);
    });

    test('should exhaust retries and throw last error', async () => {
      const alwaysFailFunction = jest.fn()
        .mockRejectedValue(new NetworkError('Always fails'));
      
      await expect(retryManager.executeWithRetry(alwaysFailFunction, 'test'))
        .rejects.toThrow('Always fails');
      
      expect(alwaysFailFunction).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    test('should apply exponential backoff delays', async () => {
      const startTime = Date.now();
      const alwaysFailFunction = jest.fn()
        .mockRejectedValue(new NetworkError('Always fails'));
      
      try {
        await retryManager.executeWithRetry(alwaysFailFunction, 'test');
      } catch (error) {
        // Expected to fail
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should have waited at least for the delays (100ms + 200ms = 300ms minimum)
      expect(totalTime).toBeGreaterThan(250);
      expect(alwaysFailFunction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Delay Calculation', () => {
    test('should calculate exponential backoff delays', () => {
      const policy = retryManager.getPolicy('test');
      const error = new NetworkError('Test error');
      
      const delay1 = retryManager.calculateDelay(error, 0, policy);
      const delay2 = retryManager.calculateDelay(error, 1, policy);
      const delay3 = retryManager.calculateDelay(error, 2, policy);
      
      expect(delay1).toBeGreaterThan(80); // ~100ms with jitter
      expect(delay1).toBeLessThan(120);
      
      expect(delay2).toBeGreaterThan(180); // ~200ms with jitter
      expect(delay2).toBeLessThan(220);
      
      expect(delay3).toBeGreaterThan(380); // ~400ms with jitter
      expect(delay3).toBeLessThan(420);
    });

    test('should apply minimum delay for rate limit errors', () => {
      const policy = retryManager.getPolicy('test');
      const rateLimitError = new RateLimitError('Rate limited');
      
      const delay = retryManager.calculateDelay(rateLimitError, 0, policy);
      
      expect(delay).toBeGreaterThanOrEqual(5000); // Minimum 5 seconds
    });

    test('should respect maximum delay', () => {
      const policy = retryManager.getPolicy('test');
      const error = new NetworkError('Test error');
      
      const delay = retryManager.calculateDelay(error, 10, policy); // High attempt number
      
      expect(delay).toBeLessThanOrEqual(1000); // Max delay from policy
    });
  });

  describe('Circuit Breaker Integration', () => {
    test('should create circuit breakers for contexts', () => {
      const breaker1 = retryManager.getCircuitBreaker('context1');
      const breaker2 = retryManager.getCircuitBreaker('context2');
      const breaker1Again = retryManager.getCircuitBreaker('context1');
      
      expect(breaker1).toBeInstanceOf(CircuitBreaker);
      expect(breaker2).toBeInstanceOf(CircuitBreaker);
      expect(breaker1).toBe(breaker1Again); // Should reuse same instance
      expect(breaker1).not.toBe(breaker2); // Different contexts get different breakers
    });

    test('should integrate circuit breaker with retry logic', async () => {
      const alwaysFailFunction = jest.fn()
        .mockRejectedValue(new NetworkError('Always fails'));
      
      // Configure circuit breaker to open quickly
      const circuitBreakerOptions = {
        circuitBreaker: {
          failureThreshold: 2,
          recoveryTimeout: 100
        }
      };
      
      // First execution should exhaust retries
      try {
        await retryManager.executeWithRetry(alwaysFailFunction, 'circuit-test', circuitBreakerOptions);
      } catch (error) {
        // Expected to fail
      }
      
      // Circuit breaker should now be open
      const breaker = retryManager.getCircuitBreaker('circuit-test');
      expect(breaker.state).toBe(CircuitBreakerState.OPEN);
      
      // Next execution should fail fast
      const fastFailFunction = jest.fn().mockResolvedValue('success');
      
      await expect(retryManager.executeWithRetry(fastFailFunction, 'circuit-test', circuitBreakerOptions))
        .rejects.toThrow('Circuit breaker is OPEN');
      
      expect(fastFailFunction).not.toHaveBeenCalled();
    });
  });

  describe('Statistics and Management', () => {
    test('should provide retry statistics', () => {
      retryManager.registerPolicy('test-context', { maxRetries: 5 });
      retryManager.getCircuitBreaker('test-context');
      
      const stats = retryManager.getStats();
      
      expect(stats.policies).toContain('test-context');
      expect(stats.circuitBreakers).toHaveProperty('test-context');
      expect(stats.circuitBreakers['test-context']).toHaveProperty('state');
    });

    test('should reset circuit breakers', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new NetworkError('Test failure'));
      
      // Open circuit breaker
      try {
        await retryManager.executeWithRetry(failingFunction, 'reset-test', {
          circuitBreaker: { failureThreshold: 1 }
        });
      } catch (error) {
        // Expected to fail
      }
      
      const breaker = retryManager.getCircuitBreaker('reset-test');
      expect(breaker.state).toBe(CircuitBreakerState.OPEN);
      
      retryManager.resetCircuitBreaker('reset-test');
      expect(breaker.state).toBe(CircuitBreakerState.CLOSED);
    });

    test('should reset all circuit breakers', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new NetworkError('Test failure'));
      
      // Open multiple circuit breakers
      try {
        await retryManager.executeWithRetry(failingFunction, 'reset-all-1', {
          circuitBreaker: { failureThreshold: 1 }
        });
      } catch (error) {
        // Expected to fail
      }
      
      try {
        await retryManager.executeWithRetry(failingFunction, 'reset-all-2', {
          circuitBreaker: { failureThreshold: 1 }
        });
      } catch (error) {
        // Expected to fail
      }
      
      const breaker1 = retryManager.getCircuitBreaker('reset-all-1');
      const breaker2 = retryManager.getCircuitBreaker('reset-all-2');
      
      expect(breaker1.state).toBe(CircuitBreakerState.OPEN);
      expect(breaker2.state).toBe(CircuitBreakerState.OPEN);
      
      retryManager.resetAllCircuitBreakers();
      
      expect(breaker1.state).toBe(CircuitBreakerState.CLOSED);
      expect(breaker2.state).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('Retry Wrapper', () => {
    test('should create retry wrapper function', async () => {
      const originalFunction = jest.fn()
        .mockRejectedValueOnce(new NetworkError('Temporary failure'))
        .mockResolvedValue('success');
      
      const retryWrapper = retryManager.createRetryWrapper('wrapper-test');
      const wrappedFunction = retryWrapper(originalFunction);
      
      const result = await wrappedFunction('arg1', 'arg2');
      
      expect(result).toBe('success');
      expect(originalFunction).toHaveBeenCalledTimes(2);
      expect(originalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});
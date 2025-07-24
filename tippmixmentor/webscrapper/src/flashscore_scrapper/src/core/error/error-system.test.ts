/**
 * Simple integration tests for the error handling system
 */

import { ErrorHandler } from './error-handler.js';
import { RetryManager } from './retry-manager.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { ErrorRecoveryManager, GracefulDegradation } from './recovery-strategies.js';
import { 
  NetworkError, 
  ScrapingError, 
  DataValidationError,
  ErrorContext 
} from '../../types/errors.js';
import { ErrorType } from '../../types/core.js';

// Simple test runner
class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log(`Running ${this.tests.length} tests...\n`);

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        this.failed++;
      }
    }

    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// Test utilities
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// Create test context
const mockContext: ErrorContext = {
  operation: 'test-operation',
  url: 'https://example.com',
  attempt: 1,
  timestamp: new Date()
};

// Test suite
const runner = new TestRunner();

// ErrorHandler tests
runner.test('ErrorHandler should classify network errors correctly', async () => {
  const errorHandler = new ErrorHandler();
  
  const networkError = new Error('ECONNREFUSED connection failed');
  const classification = errorHandler.classify(networkError);
  
  assertEqual(classification, ErrorType.NETWORK);
});

runner.test('ErrorHandler should classify scraping errors correctly', async () => {
  const errorHandler = new ErrorHandler();
  
  const scrapingError = new Error('selector not found on page');
  const classification = errorHandler.classify(scrapingError);
  
  assertEqual(classification, ErrorType.SCRAPING);
});

runner.test('ErrorHandler should handle errors and update metrics', async () => {
  const errorHandler = new ErrorHandler();
  
  const error = new NetworkError('Network failed', mockContext);
  await errorHandler.handle(error, mockContext);
  
  const metrics = errorHandler.getMetrics();
  assertEqual(metrics.totalErrors, 1);
  assertEqual(metrics.errorsByType[ErrorType.NETWORK], 1);
});

runner.test('ErrorHandler should calculate retry delay with exponential backoff', async () => {
  const errorHandler = new ErrorHandler();
  
  const delay1 = errorHandler.getRetryDelay(1, 1000, 2);
  const delay2 = errorHandler.getRetryDelay(2, 1000, 2);
  
  assert(delay1 >= 1000, 'First delay should be at least base delay');
  assert(delay2 >= 2000, 'Second delay should be at least double base delay');
  assert(delay2 > delay1, 'Second delay should be greater than first');
});

// RetryManager tests
runner.test('RetryManager should execute successful operations', async () => {
  const retryManager = new RetryManager();
  
  let callCount = 0;
  const operation = async () => {
    callCount++;
    return 'success';
  };
  
  const result = await retryManager.execute(operation, {
    maxAttempts: 3,
    baseDelay: 10,
    backoffFactor: 2,
    maxDelay: 1000
  });
  
  assertEqual(result, 'success');
  assertEqual(callCount, 1);
});

runner.test('RetryManager should retry failed operations', async () => {
  const retryManager = new RetryManager();
  
  let callCount = 0;
  const operation = async () => {
    callCount++;
    if (callCount < 3) {
      throw new Error(`Attempt ${callCount} failed`);
    }
    return 'success';
  };
  
  const result = await retryManager.execute(operation, {
    maxAttempts: 3,
    baseDelay: 10,
    backoffFactor: 2,
    maxDelay: 1000
  });
  
  assertEqual(result, 'success');
  assertEqual(callCount, 3);
});

runner.test('RetryManager should throw after max attempts', async () => {
  const retryManager = new RetryManager();
  
  let callCount = 0;
  const operation = async () => {
    callCount++;
    throw new Error('Persistent failure');
  };
  
  try {
    await retryManager.execute(operation, {
      maxAttempts: 2,
      baseDelay: 10,
      backoffFactor: 2,
      maxDelay: 1000
    });
    throw new Error('Should have thrown');
  } catch (error) {
    assert(error instanceof Error, 'Should throw an error');
    assertEqual(error.message, 'Persistent failure');
    assertEqual(callCount, 2);
  }
});

// CircuitBreaker tests
runner.test('CircuitBreaker should start in CLOSED state', async () => {
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 1000,
    monitoringPeriod: 500
  });
  
  assertEqual(circuitBreaker.getState(), 'closed');
});

runner.test('CircuitBreaker should execute successful operations', async () => {
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 1000,
    monitoringPeriod: 500
  });
  
  const operation = async () => 'success';
  const result = await circuitBreaker.execute(operation);
  
  assertEqual(result, 'success');
  assertEqual(circuitBreaker.getState(), 'closed');
});

runner.test('CircuitBreaker should open after failure threshold', async () => {
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 2,
    resetTimeout: 1000,
    monitoringPeriod: 500
  });
  
  const operation = async () => {
    throw new Error('Operation failed');
  };
  
  // Cause failures up to threshold
  for (let i = 0; i < 2; i++) {
    try {
      await circuitBreaker.execute(operation);
    } catch {
      // Expected to fail
    }
  }
  
  assertEqual(circuitBreaker.getState(), 'open');
});

// ErrorRecoveryManager tests
runner.test('ErrorRecoveryManager should identify recoverable errors', async () => {
  const recoveryManager = new ErrorRecoveryManager();
  
  const networkError = new NetworkError('Connection failed', mockContext);
  const validationError = new DataValidationError('Invalid data', mockContext);
  
  assert(recoveryManager.canRecover(networkError), 'Network errors should be recoverable');
  assert(!recoveryManager.canRecover(validationError), 'Validation errors should not be recoverable');
});

runner.test('ErrorRecoveryManager should provide recovery actions', async () => {
  const recoveryManager = new ErrorRecoveryManager();
  
  const networkError = new NetworkError('Connection failed', mockContext);
  const actions = recoveryManager.getRecoveryActions(networkError);
  
  assert(actions.length > 0, 'Should provide recovery actions for network errors');
});

runner.test('ErrorRecoveryManager should handle fallback selectors', async () => {
  const recoveryManager = new ErrorRecoveryManager();
  
  recoveryManager.addFallbackSelector('.primary', ['.fallback1', '.fallback2']);
  const fallbacks = recoveryManager.getFallbackSelectors('.primary');
  
  assertEqual(fallbacks.length, 2);
  assertEqual(fallbacks[0], '.fallback1');
  assertEqual(fallbacks[1], '.fallback2');
});

// GracefulDegradation tests
runner.test('GracefulDegradation should use primary operation when successful', async () => {
  const primaryOp = async (): Promise<{ id: string; name: string; data: string }> => ({ id: '1', name: 'Primary', data: 'complete' });
  const fallbackOp = async (): Promise<{ id: string; name: string }> => ({ id: '1', name: 'Fallback' });
  
  const result = await GracefulDegradation.executeWithFallback(
    primaryOp,
    fallbackOp,
    ['id', 'name']
  );
  
  assertEqual((result as any).name, 'Primary');
  assertEqual((result as any).data, 'complete');
});

runner.test('GracefulDegradation should use fallback when primary fails', async () => {
  const primaryOp = async (): Promise<{ id: string; name: string }> => {
    throw new Error('Primary failed');
  };
  const fallbackOp = async (): Promise<{ id: string; name: string }> => ({ id: '1', name: 'Fallback' });
  
  const result = await GracefulDegradation.executeWithFallback(
    primaryOp,
    fallbackOp,
    ['id', 'name']
  );
  
  assertEqual((result as any).name, 'Fallback');
});

runner.test('GracefulDegradation should collect partial results', async () => {
  const operations = [
    async () => 'result1',
    async () => { throw new Error('op2 failed'); },
    async () => 'result3'
  ];
  
  const result = await GracefulDegradation.collectPartialResults(operations, 1);
  
  assertEqual(result.successful.length, 2);
  assertEqual(result.failed.length, 1);
  assertEqual(result.successRate, 2/3);
});

// Integration tests
runner.test('Integration: ErrorHandler with RetryManager', async () => {
  const errorHandler = new ErrorHandler();
  
  let attempts = 0;
  const operation = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error('Temporary failure');
    }
    return 'success';
  };
  
  const result = await errorHandler.retry(operation, {
    maxAttempts: 3,
    baseDelay: 10,
    backoffFactor: 2,
    maxDelay: 1000
  });
  
  assertEqual(result, 'success');
  assertEqual(attempts, 3);
});

runner.test('Integration: Full error handling workflow', async () => {
  const errorHandler = new ErrorHandler();
  const recoveryManager = new ErrorRecoveryManager();
  
  // Simulate a scraping error
  const scrapingError = new ScrapingError('Selector not found', mockContext);
  
  // Handle the error
  await errorHandler.handle(scrapingError, mockContext);
  
  // Check if recovery is possible
  const canRecover = recoveryManager.canRecover(scrapingError);
  assert(canRecover, 'Scraping errors should be recoverable');
  
  // Get recovery actions
  const actions = recoveryManager.getRecoveryActions(scrapingError);
  assert(actions.length > 0, 'Should have recovery actions');
  
  // Verify metrics were updated
  const metrics = errorHandler.getMetrics();
  assertEqual(metrics.totalErrors, 1);
  assertEqual(metrics.errorsByType[ErrorType.SCRAPING], 1);
});

// Run all tests
console.log('🧪 Error Handling System Tests\n');

runner.run().then(success => {
  if (success) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
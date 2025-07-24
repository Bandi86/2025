// Manual test for RetryManager to verify functionality
const { RetryManager, CircuitBreaker, CircuitBreakerState } = require('../src/utils/retry-manager');
const { NetworkError, RateLimitError, ConfigurationError } = require('../src/utils/errors');

console.log('Testing RetryManager functionality...\n');

async function runTests() {
  const retryManager = new RetryManager({
    maxRetries: 2,
    baseDelay: 100,
    maxDelay: 1000,
    backoffFactor: 2
  });

  // Test 1: Successful execution on first attempt
  console.log('=== Test 1: Successful execution ===');
  try {
    const result = await retryManager.executeWithRetry(
      async () => 'success',
      'test-success'
    );
    console.log('✓ Success:', result);
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }

  // Test 2: Retry on network error
  console.log('\n=== Test 2: Retry on network error ===');
  let attemptCount = 0;
  try {
    const result = await retryManager.executeWithRetry(
      async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new NetworkError('Connection failed');
        }
        return 'success after retry';
      },
      'test-retry'
    );
    console.log('✓ Success after retry:', result);
    console.log('✓ Total attempts:', attemptCount);
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }

  // Test 3: Non-retryable error
  console.log('\n=== Test 3: Non-retryable error ===');
  let configAttempts = 0;
  try {
    await retryManager.executeWithRetry(
      async () => {
        configAttempts++;
        throw new ConfigurationError('Config missing');
      },
      'test-non-retryable'
    );
  } catch (error) {
    console.log('✓ Non-retryable error caught:', error.message);
    console.log('✓ Attempts (should be 1):', configAttempts);
  }

  // Test 4: Exhaust retries
  console.log('\n=== Test 4: Exhaust retries ===');
  let failAttempts = 0;
  const startTime = Date.now();
  try {
    await retryManager.executeWithRetry(
      async () => {
        failAttempts++;
        throw new NetworkError('Always fails');
      },
      'test-exhaust'
    );
  } catch (error) {
    const endTime = Date.now();
    console.log('✓ All retries exhausted:', error.message);
    console.log('✓ Total attempts:', failAttempts);
    console.log('✓ Total time (should show delays):', endTime - startTime, 'ms');
  }

  // Test 5: Custom policy
  console.log('\n=== Test 5: Custom policy ===');
  retryManager.registerPolicy('custom', {
    maxRetries: 1,
    baseDelay: 50
  });

  let customAttempts = 0;
  try {
    await retryManager.executeWithRetry(
      async () => {
        customAttempts++;
        throw new NetworkError('Custom policy test');
      },
      'custom'
    );
  } catch (error) {
    console.log('✓ Custom policy applied, attempts:', customAttempts);
  }

  // Test 6: Circuit Breaker
  console.log('\n=== Test 6: Circuit Breaker ===');
  
  // Configure circuit breaker to open quickly
  const circuitBreakerOptions = {
    circuitBreaker: {
      failureThreshold: 2,
      recoveryTimeout: 1000
    }
  };

  // First, trigger circuit breaker to open
  let circuitAttempts = 0;
  try {
    await retryManager.executeWithRetry(
      async () => {
        circuitAttempts++;
        throw new NetworkError('Circuit breaker test');
      },
      'circuit-test',
      circuitBreakerOptions
    );
  } catch (error) {
    console.log('✓ Circuit breaker test failed as expected');
  }

  // Check circuit breaker state
  const breaker = retryManager.getCircuitBreaker('circuit-test');
  console.log('✓ Circuit breaker state:', breaker.getStatus().state);

  // Try to execute again - should fail fast
  try {
    await retryManager.executeWithRetry(
      async () => 'should not execute',
      'circuit-test',
      circuitBreakerOptions
    );
  } catch (error) {
    console.log('✓ Circuit breaker prevented execution:', error.message.includes('Circuit breaker is OPEN'));
  }

  // Test 7: Rate Limit Error with special delay
  console.log('\n=== Test 7: Rate limit error handling ===');
  const rateLimitStart = Date.now();
  try {
    await retryManager.executeWithRetry(
      async () => {
        throw new RateLimitError('Rate limited');
      },
      'rate-limit-test',
      { maxRetries: 1 }
    );
  } catch (error) {
    const rateLimitEnd = Date.now();
    const rateLimitTime = rateLimitEnd - rateLimitStart;
    console.log('✓ Rate limit error handled');
    console.log('✓ Time taken (should be >5000ms):', rateLimitTime, 'ms');
  }

  // Test 8: Statistics
  console.log('\n=== Test 8: Statistics ===');
  const stats = retryManager.getStats();
  console.log('✓ Registered policies:', stats.policies);
  console.log('✓ Circuit breakers:', Object.keys(stats.circuitBreakers));

  // Test 9: Retry Wrapper
  console.log('\n=== Test 9: Retry Wrapper ===');
  let wrapperAttempts = 0;
  const originalFunction = async (arg1, arg2) => {
    wrapperAttempts++;
    if (wrapperAttempts < 2) {
      throw new NetworkError('Wrapper test failure');
    }
    return `success with ${arg1} and ${arg2}`;
  };

  const retryWrapper = retryManager.createRetryWrapper('wrapper-test');
  const wrappedFunction = retryWrapper(originalFunction);

  try {
    const result = await wrappedFunction('arg1', 'arg2');
    console.log('✓ Wrapper function result:', result);
    console.log('✓ Wrapper attempts:', wrapperAttempts);
  } catch (error) {
    console.log('✗ Wrapper test failed:', error.message);
  }

  console.log('\n=== All RetryManager Tests Completed! ===');
}

// Run the tests
runTests().catch(console.error);
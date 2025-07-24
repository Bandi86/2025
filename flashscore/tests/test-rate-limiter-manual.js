// Manual test for RateLimiter to verify functionality
const { RateLimiter, TokenBucket, RequestQueue, UserAgentRotator } = require('../src/utils/rate-limiter');

console.log('Testing RateLimiter functionality...\n');

async function runTests() {
  // Test 1: Token Bucket
  console.log('=== Test 1: Token Bucket ===');
  const tokenBucket = new TokenBucket(3, 1, 1000); // 3 capacity, 1 token per second
  
  console.log('Initial status:', tokenBucket.getStatus());
  console.log('Consume 2 tokens:', tokenBucket.consume(2));
  console.log('Status after consumption:', tokenBucket.getStatus());
  console.log('Try to consume 2 more (should fail):', tokenBucket.consume(2));
  console.log('Time until next token:', tokenBucket.getTimeUntilNextToken(), 'ms');

  // Test 2: User Agent Rotation
  console.log('\n=== Test 2: User Agent Rotation ===');
  const userAgents = [
    'Mozilla/5.0 (Test Browser 1)',
    'Mozilla/5.0 (Test Browser 2)',
    'Mozilla/5.0 (Test Browser 3)'
  ];
  const uaRotator = new UserAgentRotator(userAgents);
  
  console.log('Rotate strategy:');
  console.log('  1:', uaRotator.getNext());
  console.log('  2:', uaRotator.getNext());
  console.log('  3:', uaRotator.getNext());
  console.log('  4 (wrap):', uaRotator.getNext());
  
  console.log('Random strategy:', uaRotator.getRandom());
  console.log('Least used:', uaRotator.getLeastUsed());
  console.log('Usage stats:', uaRotator.getStats());

  // Test 3: Request Queue
  console.log('\n=== Test 3: Request Queue ===');
  const requestQueue = new RequestQueue(5);
  
  let executionOrder = [];
  
  const lowPriorityRequest = async () => {
    executionOrder.push('low');
    return 'low-priority-result';
  };
  
  const highPriorityRequest = async () => {
    executionOrder.push('high');
    return 'high-priority-result';
  };
  
  // Queue requests with different priorities
  const lowPromise = requestQueue.enqueue(lowPriorityRequest, { priority: 1 });
  const highPromise = requestQueue.enqueue(highPriorityRequest, { priority: 10 });
  
  const results = await Promise.all([lowPromise, highPromise]);
  console.log('Execution order:', executionOrder);
  console.log('Results:', results);
  console.log('Queue status:', requestQueue.getStatus());

  // Test 4: Basic Rate Limiter
  console.log('\n=== Test 4: Basic Rate Limiter ===');
  const rateLimiter = new RateLimiter({
    requestsPerSecond: 2,
    burstLimit: 3,
    minDelay: 200,
    maxDelay: 1000
  });
  
  let requestCount = 0;
  const mockRequest = async (options) => {
    requestCount++;
    console.log(`  Request ${requestCount} executed with UA: ${options.userAgent?.substring(0, 30)}...`);
    return `result-${requestCount}`;
  };
  
  const startTime = Date.now();
  
  // Execute multiple requests
  const results4 = await Promise.all([
    rateLimiter.executeRequest(mockRequest),
    rateLimiter.executeRequest(mockRequest),
    rateLimiter.executeRequest(mockRequest)
  ]);
  
  const endTime = Date.now();
  console.log('Results:', results4);
  console.log('Total time:', endTime - startTime, 'ms');
  console.log('Rate limiter stats:', JSON.stringify(rateLimiter.getStats(), null, 2));

  // Test 5: Rate Limit Error Handling
  console.log('\n=== Test 5: Rate Limit Error Handling ===');
  const rateLimiter2 = new RateLimiter({
    requestsPerSecond: 1,
    cooldownPeriod: 2000
  });
  
  const rateLimitRequest = async () => {
    const error = new Error('Too many requests');
    error.response = { status: 429, headers: { 'retry-after': '1' } };
    throw error;
  };
  
  try {
    await rateLimiter2.executeRequest(rateLimitRequest);
  } catch (error) {
    console.log('Rate limit error caught:', error.message);
  }
  
  const stats = rateLimiter2.getStats();
  console.log('Is blocked:', stats.rateLimiting.isBlocked);
  console.log('Blocked until:', new Date(stats.rateLimiting.blockedUntil));

  // Test 6: Request Queuing
  console.log('\n=== Test 6: Request Queuing ===');
  const rateLimiter3 = new RateLimiter({
    requestsPerSecond: 1,
    minDelay: 100
  });
  
  let queuedRequestCount = 0;
  const queuedRequest = async () => {
    queuedRequestCount++;
    console.log(`  Queued request ${queuedRequestCount} executed`);
    return `queued-result-${queuedRequestCount}`;
  };
  
  const queueStartTime = Date.now();
  
  // Queue multiple requests
  const queueResults = await Promise.all([
    rateLimiter3.queueRequest(queuedRequest, { priority: 1 }),
    rateLimiter3.queueRequest(queuedRequest, { priority: 5 }),
    rateLimiter3.queueRequest(queuedRequest, { priority: 3 })
  ]);
  
  const queueEndTime = Date.now();
  console.log('Queue results:', queueResults);
  console.log('Queue time:', queueEndTime - queueStartTime, 'ms');

  // Test 7: User Agent Strategies
  console.log('\n=== Test 7: User Agent Strategies ===');
  const rateLimiter4 = new RateLimiter();
  
  const testUA = async (strategy) => {
    return rateLimiter4.executeRequest(async (options) => {
      return options.userAgent.substring(0, 50) + '...';
    }, { userAgentStrategy: strategy });
  };
  
  console.log('Rotate strategy:', await testUA('rotate'));
  console.log('Random strategy:', await testUA('random'));
  console.log('Least used strategy:', await testUA('least-used'));

  // Test 8: Proxy Support
  console.log('\n=== Test 8: Proxy Support ===');
  const rateLimiterWithProxies = new RateLimiter({
    proxies: ['http://proxy1:8080', 'http://proxy2:8080', 'http://proxy3:8080']
  });
  
  const testProxy = async () => {
    return rateLimiterWithProxies.executeRequest(async (options) => {
      return options.proxy || 'no-proxy';
    });
  };
  
  console.log('Proxy 1:', await testProxy());
  console.log('Proxy 2:', await testProxy());
  console.log('Proxy 3:', await testProxy());
  console.log('Proxy 4 (wrap):', await testProxy());

  // Test 9: Comprehensive Statistics
  console.log('\n=== Test 9: Comprehensive Statistics ===');
  const finalStats = rateLimiter4.getStats();
  console.log('Final statistics:');
  console.log('- Total requests:', finalStats.requests.total);
  console.log('- Token bucket tokens:', finalStats.rateLimiting.tokenBucket.tokens);
  console.log('- Queue length:', finalStats.queue.queueLength);
  console.log('- User agents total:', finalStats.userAgents.totalUserAgents);
  console.log('- Proxies total:', finalStats.proxies.total);

  // Test 10: Reset Functionality
  console.log('\n=== Test 10: Reset Functionality ===');
  console.log('Before reset - requests:', rateLimiter4.getStats().requests.total);
  rateLimiter4.reset();
  console.log('After reset - requests:', rateLimiter4.getStats().requests.total);

  console.log('\n=== All RateLimiter Tests Completed! ===');
}

// Run the tests
runTests().catch(console.error);
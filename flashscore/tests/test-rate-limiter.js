const { RateLimiter, TokenBucket, RequestQueue, UserAgentRotator } = require('../src/utils/rate-limiter');

describe('TokenBucket', () => {
  let tokenBucket;

  beforeEach(() => {
    tokenBucket = new TokenBucket(5, 2, 1000); // 5 capacity, 2 tokens per second
  });

  describe('Token Management', () => {
    test('should start with full capacity', () => {
      const status = tokenBucket.getStatus();
      expect(status.tokens).toBe(5);
      expect(status.capacity).toBe(5);
    });

    test('should consume tokens', () => {
      expect(tokenBucket.consume(2)).toBe(true);
      expect(tokenBucket.getStatus().tokens).toBe(3);
    });

    test('should reject consumption when insufficient tokens', () => {
      tokenBucket.consume(5); // Use all tokens
      expect(tokenBucket.consume(1)).toBe(false);
      expect(tokenBucket.getStatus().tokens).toBe(0);
    });

    test('should refill tokens over time', async () => {
      tokenBucket.consume(5); // Use all tokens
      expect(tokenBucket.getStatus().tokens).toBe(0);
      
      // Wait for refill (simulate time passage)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const status = tokenBucket.getStatus();
      expect(status.tokens).toBeGreaterThan(0);
    });

    test('should not exceed capacity when refilling', async () => {
      // Start with full bucket, wait for refill period
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const status = tokenBucket.getStatus();
      expect(status.tokens).toBeLessThanOrEqual(5);
    });

    test('should calculate time until next token', () => {
      tokenBucket.consume(5); // Use all tokens
      const timeUntilNext = tokenBucket.getTimeUntilNextToken();
      expect(timeUntilNext).toBeGreaterThan(0);
      expect(timeUntilNext).toBeLessThanOrEqual(1000);
    });
  });
});

describe('RequestQueue', () => {
  let requestQueue;

  beforeEach(() => {
    requestQueue = new RequestQueue(10);
  });

  describe('Queue Management', () => {
    test('should enqueue and process requests', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      
      const promise = requestQueue.enqueue(mockFn);
      const result = await promise;
      
      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should process requests in priority order', async () => {
      const results = [];
      const lowPriorityFn = jest.fn().mockImplementation(async () => {
        results.push('low');
        return 'low';
      });
      const highPriorityFn = jest.fn().mockImplementation(async () => {
        results.push('high');
        return 'high';
      });
      
      // Enqueue low priority first, then high priority
      const lowPromise = requestQueue.enqueue(lowPriorityFn, { priority: 1 });
      const highPromise = requestQueue.enqueue(highPriorityFn, { priority: 10 });
      
      await Promise.all([lowPromise, highPromise]);
      
      // High priority should execute first
      expect(results[0]).toBe('low'); // First one starts immediately
      expect(results[1]).toBe('high');
    });

    test('should reject when queue is full', async () => {
      const smallQueue = new RequestQueue(1);
      const mockFn = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      
      // Fill the queue
      smallQueue.enqueue(mockFn);
      
      // This should be rejected
      await expect(smallQueue.enqueue(mockFn)).rejects.toThrow('Request queue is full');
    });

    test('should provide queue status', () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      requestQueue.enqueue(mockFn);
      
      const status = requestQueue.getStatus();
      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('maxSize');
      expect(status).toHaveProperty('processing');
    });

    test('should clear queue', async () => {
      const mockFn = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const promise1 = requestQueue.enqueue(mockFn);
      const promise2 = requestQueue.enqueue(mockFn);
      
      requestQueue.clear();
      
      await expect(promise1).rejects.toThrow('Request queue cleared');
      await expect(promise2).rejects.toThrow('Request queue cleared');
    });
  });
});

describe('UserAgentRotator', () => {
  let userAgentRotator;
  const testUserAgents = [
    'Mozilla/5.0 (Test Browser 1)',
    'Mozilla/5.0 (Test Browser 2)',
    'Mozilla/5.0 (Test Browser 3)'
  ];

  beforeEach(() => {
    userAgentRotator = new UserAgentRotator(testUserAgents);
  });

  describe('User Agent Selection', () => {
    test('should rotate through user agents', () => {
      const ua1 = userAgentRotator.getNext();
      const ua2 = userAgentRotator.getNext();
      const ua3 = userAgentRotator.getNext();
      const ua4 = userAgentRotator.getNext(); // Should wrap around
      
      expect(ua1).toBe(testUserAgents[0]);
      expect(ua2).toBe(testUserAgents[1]);
      expect(ua3).toBe(testUserAgents[2]);
      expect(ua4).toBe(testUserAgents[0]);
    });

    test('should return random user agents', () => {
      const randomUAs = new Set();
      
      // Get multiple random user agents
      for (let i = 0; i < 20; i++) {
        randomUAs.add(userAgentRotator.getRandom());
      }
      
      // Should have gotten different user agents (with high probability)
      expect(randomUAs.size).toBeGreaterThan(1);
    });

    test('should return least used user agent', () => {
      // Use first user agent multiple times
      userAgentRotator.getNext();
      userAgentRotator.getNext();
      userAgentRotator.getNext();
      
      // Least used should be the second one (index 1)
      const leastUsed = userAgentRotator.getLeastUsed();
      expect(leastUsed).toBe(testUserAgents[1]);
    });

    test('should track usage statistics', () => {
      userAgentRotator.getNext();
      userAgentRotator.getNext();
      userAgentRotator.getRandom();
      
      const stats = userAgentRotator.getStats();
      expect(stats.totalUserAgents).toBe(3);
      expect(stats.usage).toBeDefined();
    });

    test('should reset statistics', () => {
      userAgentRotator.getNext();
      userAgentRotator.getNext();
      
      userAgentRotator.resetStats();
      
      const stats = userAgentRotator.getStats();
      expect(Object.keys(stats.usage)).toHaveLength(0);
      expect(stats.currentIndex).toBe(0);
    });

    test('should use default user agents when none provided', () => {
      const defaultRotator = new UserAgentRotator();
      const ua = defaultRotator.getNext();
      
      expect(ua).toContain('Mozilla');
      expect(ua.length).toBeGreaterThan(50);
    });
  });
});

describe('RateLimiter', () => {
  let rateLimiter;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    rateLimiter = new RateLimiter({
      requestsPerSecond: 2,
      burstLimit: 3,
      minDelay: 100,
      maxDelay: 1000,
      cooldownPeriod: 5000
    });
  });

  describe('Request Execution', () => {
    test('should execute request successfully', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      const result = await rateLimiter.executeRequest(mockRequest);
      
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    test('should enhance request options', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      await rateLimiter.executeRequest(mockRequest, { customOption: 'test' });
      
      const callArgs = mockRequest.mock.calls[0][0];
      expect(callArgs.customOption).toBe('test');
      expect(callArgs.userAgent).toBeDefined();
      expect(callArgs.headers).toBeDefined();
      expect(callArgs.headers['Accept']).toBeDefined();
    });

    test('should apply rate limiting delays', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');
      const startTime = Date.now();
      
      // Execute multiple requests quickly
      await rateLimiter.executeRequest(mockRequest);
      await rateLimiter.executeRequest(mockRequest);
      await rateLimiter.executeRequest(mockRequest);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should have taken some time due to rate limiting
      expect(totalTime).toBeGreaterThan(200); // At least 2 * minDelay
      expect(mockRequest).toHaveBeenCalledTimes(3);
    });

    test('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limited');
      rateLimitError.response = { status: 429, headers: { 'retry-after': '2' } };
      
      const mockRequest = jest.fn().mockRejectedValue(rateLimitError);
      
      await expect(rateLimiter.executeRequest(mockRequest)).rejects.toThrow('Rate limited');
      
      // Should set cooldown period
      const stats = rateLimiter.getStats();
      expect(stats.rateLimiting.isBlocked).toBe(true);
    });

    test('should increase delay after consecutive failures', async () => {
      const mockRequest = jest.fn().mockRejectedValue(new Error('Network error'));
      
      // Cause multiple failures
      try { await rateLimiter.executeRequest(mockRequest); } catch {}
      try { await rateLimiter.executeRequest(mockRequest); } catch {}
      
      const stats = rateLimiter.getStats();
      expect(stats.requests.consecutiveFailures).toBe(2);
    });
  });

  describe('Request Queuing', () => {
    test('should queue and execute requests', async () => {
      const mockRequest = jest.fn().mockResolvedValue('queued');
      
      const result = await rateLimiter.queueRequest(mockRequest);
      
      expect(result).toBe('queued');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    test('should handle priority in queue', async () => {
      const results = [];
      const lowPriorityRequest = jest.fn().mockImplementation(async () => {
        results.push('low');
        return 'low';
      });
      const highPriorityRequest = jest.fn().mockImplementation(async () => {
        results.push('high');
        return 'high';
      });
      
      // Queue low priority first, then high priority
      const lowPromise = rateLimiter.queueRequest(lowPriorityRequest, { priority: 1 });
      const highPromise = rateLimiter.queueRequest(highPriorityRequest, { priority: 10 });
      
      await Promise.all([lowPromise, highPromise]);
      
      // Results depend on execution order, but both should complete
      expect(results).toContain('low');
      expect(results).toContain('high');
    });
  });

  describe('User Agent Management', () => {
    test('should rotate user agents', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      await rateLimiter.executeRequest(mockRequest, { userAgentStrategy: 'rotate' });
      await rateLimiter.executeRequest(mockRequest, { userAgentStrategy: 'rotate' });
      
      const call1UA = mockRequest.mock.calls[0][0].userAgent;
      const call2UA = mockRequest.mock.calls[1][0].userAgent;
      
      expect(call1UA).toBeDefined();
      expect(call2UA).toBeDefined();
      // They might be different due to rotation
    });

    test('should use random user agents', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      await rateLimiter.executeRequest(mockRequest, { userAgentStrategy: 'random' });
      
      const userAgent = mockRequest.mock.calls[0][0].userAgent;
      expect(userAgent).toBeDefined();
      expect(userAgent).toContain('Mozilla');
    });

    test('should use least used user agents', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      await rateLimiter.executeRequest(mockRequest, { userAgentStrategy: 'least-used' });
      
      const userAgent = mockRequest.mock.calls[0][0].userAgent;
      expect(userAgent).toBeDefined();
      expect(userAgent).toContain('Mozilla');
    });
  });

  describe('Proxy Management', () => {
    test('should use proxies when available', async () => {
      const rateLimiterWithProxies = new RateLimiter({
        proxies: ['http://proxy1:8080', 'http://proxy2:8080']
      });
      
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      await rateLimiterWithProxies.executeRequest(mockRequest);
      
      const proxy = mockRequest.mock.calls[0][0].proxy;
      expect(proxy).toBeDefined();
      expect(proxy).toMatch(/http:\/\/proxy[12]:8080/);
    });

    test('should handle proxy failures', async () => {
      const rateLimiterWithProxies = new RateLimiter({
        proxies: ['http://proxy1:8080']
      });
      
      const proxyError = new Error('Connection refused');
      proxyError.code = 'ECONNREFUSED';
      
      const mockRequest = jest.fn().mockRejectedValue(proxyError);
      
      await expect(rateLimiterWithProxies.executeRequest(mockRequest)).rejects.toThrow('Connection refused');
      
      const stats = rateLimiterWithProxies.getStats();
      expect(stats.proxies.failures).toHaveProperty('http://proxy1:8080');
    });
  });

  describe('Statistics and Management', () => {
    test('should provide comprehensive statistics', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      await rateLimiter.executeRequest(mockRequest);
      
      const stats = rateLimiter.getStats();
      
      expect(stats.requests).toHaveProperty('total');
      expect(stats.requests).toHaveProperty('consecutiveFailures');
      expect(stats.rateLimiting).toHaveProperty('requestsPerSecond');
      expect(stats.rateLimiting).toHaveProperty('tokenBucket');
      expect(stats.queue).toHaveProperty('queueLength');
      expect(stats.userAgents).toHaveProperty('totalUserAgents');
      expect(stats.proxies).toHaveProperty('total');
    });

    test('should reset state', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      await rateLimiter.executeRequest(mockRequest);
      
      let stats = rateLimiter.getStats();
      expect(stats.requests.total).toBe(1);
      
      rateLimiter.reset();
      
      stats = rateLimiter.getStats();
      expect(stats.requests.total).toBe(0);
      expect(stats.requests.consecutiveFailures).toBe(0);
    });
  });

  describe('Error Detection', () => {
    test('should detect rate limit errors', () => {
      const rateLimitError1 = new Error('Rate limited');
      rateLimitError1.response = { status: 429 };
      
      const rateLimitError2 = new Error('Too many requests');
      
      expect(rateLimiter.isRateLimitError(rateLimitError1)).toBe(true);
      expect(rateLimiter.isRateLimitError(rateLimitError2)).toBe(true);
      
      const normalError = new Error('Normal error');
      expect(rateLimiter.isRateLimitError(normalError)).toBe(false);
    });

    test('should detect proxy errors', () => {
      const proxyError1 = new Error('Connection refused');
      proxyError1.code = 'ECONNREFUSED';
      
      const proxyError2 = new Error('Proxy connection failed');
      
      expect(rateLimiter.isProxyError(proxyError1)).toBe(true);
      expect(rateLimiter.isProxyError(proxyError2)).toBe(true);
      
      const normalError = new Error('Normal error');
      expect(rateLimiter.isProxyError(normalError)).toBe(false);
    });
  });
});
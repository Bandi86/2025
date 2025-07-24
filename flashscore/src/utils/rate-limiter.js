const logger = require('./logger');

/**
 * Token Bucket Rate Limiter implementation
 */
class TokenBucket {
  constructor(capacity, refillRate, refillPeriod = 1000) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.refillPeriod = refillPeriod;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on elapsed time
   */
  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor((timePassed / this.refillPeriod) * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Try to consume tokens
   * @param {number} tokens - Number of tokens to consume
   * @returns {boolean} Whether tokens were successfully consumed
   */
  consume(tokens = 1) {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  /**
   * Get time until next token is available
   * @returns {number} Milliseconds until next token
   */
  getTimeUntilNextToken() {
    this.refill();
    
    if (this.tokens >= 1) {
      return 0;
    }
    
    const tokensNeeded = 1 - this.tokens;
    return Math.ceil((tokensNeeded / this.refillRate) * this.refillPeriod);
  }

  /**
   * Get current bucket status
   * @returns {object} Bucket status
   */
  getStatus() {
    this.refill();
    return {
      tokens: this.tokens,
      capacity: this.capacity,
      refillRate: this.refillRate,
      refillPeriod: this.refillPeriod,
      lastRefill: this.lastRefill
    };
  }
}

/**
 * Request Queue for managing pending requests
 */
class RequestQueue {
  constructor(maxSize = 1000) {
    this.queue = [];
    this.maxSize = maxSize;
    this.processing = false;
  }

  /**
   * Add request to queue
   * @param {Function} requestFn - Function to execute
   * @param {object} options - Request options
   * @returns {Promise} Promise that resolves when request is executed
   */
  enqueue(requestFn, options = {}) {
    return new Promise((resolve, reject) => {
      if (this.queue.length >= this.maxSize) {
        reject(new Error('Request queue is full'));
        return;
      }

      const request = {
        id: Date.now() + Math.random(),
        fn: requestFn,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Priority queue - higher priority requests go first
      const priority = options.priority || 0;
      let insertIndex = this.queue.length;
      
      for (let i = 0; i < this.queue.length; i++) {
        if ((this.queue[i].options.priority || 0) < priority) {
          insertIndex = i;
          break;
        }
      }

      this.queue.splice(insertIndex, 0, request);
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      
      try {
        const result = await request.fn();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Small delay between requests to prevent overwhelming
      await this.sleep(10);
    }

    this.processing = false;
  }

  /**
   * Get queue status
   * @returns {object} Queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      maxSize: this.maxSize,
      processing: this.processing,
      oldestRequest: this.queue.length > 0 ? this.queue[0].timestamp : null
    };
  }

  /**
   * Clear the queue
   */
  clear() {
    const rejectedRequests = this.queue.splice(0);
    rejectedRequests.forEach(request => {
      request.reject(new Error('Request queue cleared'));
    });
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * User-Agent rotation manager
 */
class UserAgentRotator {
  constructor(userAgents = []) {
    this.userAgents = userAgents.length > 0 ? userAgents : this.getDefaultUserAgents();
    this.currentIndex = 0;
    this.usageCount = new Map();
  }

  /**
   * Get default user agents
   * @returns {Array} Array of user agent strings
   */
  getDefaultUserAgents() {
    return [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:90.0) Gecko/20100101 Firefox/90.0'
    ];
  }

  /**
   * Get next user agent in rotation
   * @returns {string} User agent string
   */
  getNext() {
    const userAgent = this.userAgents[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.userAgents.length;
    
    // Track usage
    const count = this.usageCount.get(userAgent) || 0;
    this.usageCount.set(userAgent, count + 1);
    
    return userAgent;
  }

  /**
   * Get random user agent
   * @returns {string} User agent string
   */
  getRandom() {
    const randomIndex = Math.floor(Math.random() * this.userAgents.length);
    const userAgent = this.userAgents[randomIndex];
    
    // Track usage
    const count = this.usageCount.get(userAgent) || 0;
    this.usageCount.set(userAgent, count + 1);
    
    return userAgent;
  }

  /**
   * Get least used user agent
   * @returns {string} User agent string
   */
  getLeastUsed() {
    let leastUsed = this.userAgents[0];
    let minCount = this.usageCount.get(leastUsed) || 0;
    
    for (const userAgent of this.userAgents) {
      const count = this.usageCount.get(userAgent) || 0;
      if (count < minCount) {
        minCount = count;
        leastUsed = userAgent;
      }
    }
    
    // Track usage
    this.usageCount.set(leastUsed, minCount + 1);
    
    return leastUsed;
  }

  /**
   * Get usage statistics
   * @returns {object} Usage statistics
   */
  getStats() {
    const stats = {
      totalUserAgents: this.userAgents.length,
      currentIndex: this.currentIndex,
      usage: {}
    };
    
    for (const [userAgent, count] of this.usageCount) {
      // Truncate user agent for display
      const shortUA = userAgent.substring(0, 50) + '...';
      stats.usage[shortUA] = count;
    }
    
    return stats;
  }

  /**
   * Reset usage statistics
   */
  resetStats() {
    this.usageCount.clear();
    this.currentIndex = 0;
  }
}

/**
 * Comprehensive Rate Limiter with request throttling and queue management
 */
class RateLimiter {
  constructor(options = {}) {
    // Rate limiting configuration
    this.requestsPerSecond = options.requestsPerSecond || 1.5;
    this.burstLimit = options.burstLimit || 5;
    this.cooldownPeriod = options.cooldownPeriod || 60000; // 1 minute
    
    // Request delay configuration
    this.minDelay = options.minDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 5000; // 5 seconds
    this.jitterFactor = options.jitterFactor || 0.1;
    
    // Initialize components
    this.tokenBucket = new TokenBucket(
      this.burstLimit,
      this.requestsPerSecond,
      1000 // 1 second refill period
    );
    
    this.requestQueue = new RequestQueue(options.maxQueueSize || 1000);
    this.userAgentRotator = new UserAgentRotator(options.userAgents);
    
    // Tracking
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.blockedUntil = 0;
    this.consecutiveFailures = 0;
    
    // Proxy support
    this.proxies = options.proxies || [];
    this.currentProxyIndex = 0;
    this.proxyFailures = new Map();
  }

  /**
   * Execute a request with rate limiting
   * @param {Function} requestFn - Function to execute
   * @param {object} options - Request options
   * @returns {Promise} Promise that resolves with request result
   */
  async executeRequest(requestFn, options = {}) {
    // Check if we're in cooldown period
    if (Date.now() < this.blockedUntil) {
      const waitTime = this.blockedUntil - Date.now();
      logger.warn(`Rate limiter in cooldown, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }

    // Try to consume token
    if (!this.tokenBucket.consume()) {
      const waitTime = this.tokenBucket.getTimeUntilNextToken();
      logger.debug(`Rate limit reached, waiting ${waitTime}ms for next token`);
      await this.sleep(waitTime);
    }

    // Calculate delay since last request
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    const requiredDelay = this.calculateDelay();
    
    if (timeSinceLastRequest < requiredDelay) {
      const additionalDelay = requiredDelay - timeSinceLastRequest;
      logger.debug(`Additional delay required: ${additionalDelay}ms`);
      await this.sleep(additionalDelay);
    }

    // Execute request with enhanced options
    const enhancedOptions = this.enhanceRequestOptions(options);
    
    try {
      this.lastRequestTime = Date.now();
      this.requestCount++;
      
      const result = await requestFn(enhancedOptions);
      
      // Reset consecutive failures on success
      this.consecutiveFailures = 0;
      
      logger.debug(`Request executed successfully`, {
        requestCount: this.requestCount,
        userAgent: enhancedOptions.userAgent?.substring(0, 50) + '...',
        proxy: enhancedOptions.proxy
      });
      
      return result;
      
    } catch (error) {
      this.consecutiveFailures++;
      
      // Handle rate limiting responses
      if (this.isRateLimitError(error)) {
        this.handleRateLimitError(error);
      }
      
      // Handle proxy failures
      if (enhancedOptions.proxy && this.isProxyError(error)) {
        this.handleProxyFailure(enhancedOptions.proxy);
      }
      
      throw error;
    }
  }

  /**
   * Queue a request for execution
   * @param {Function} requestFn - Function to execute
   * @param {object} options - Request options
   * @returns {Promise} Promise that resolves when request is executed
   */
  queueRequest(requestFn, options = {}) {
    return this.requestQueue.enqueue(
      () => this.executeRequest(requestFn, options),
      options
    );
  }

  /**
   * Calculate delay between requests
   * @returns {number} Delay in milliseconds
   */
  calculateDelay() {
    let baseDelay = this.minDelay;
    
    // Increase delay based on consecutive failures
    if (this.consecutiveFailures > 0) {
      baseDelay = Math.min(
        this.minDelay * Math.pow(1.5, this.consecutiveFailures),
        this.maxDelay
      );
    }
    
    // Add jitter to prevent thundering herd
    const jitter = baseDelay * this.jitterFactor * (Math.random() - 0.5);
    
    return Math.floor(baseDelay + jitter);
  }

  /**
   * Enhance request options with rate limiting features
   * @param {object} options - Original options
   * @returns {object} Enhanced options
   */
  enhanceRequestOptions(options) {
    const enhanced = { ...options };
    
    // Add User-Agent rotation
    if (!enhanced.userAgent) {
      enhanced.userAgent = this.getUserAgent(options.userAgentStrategy);
    }
    
    // Add proxy rotation if available
    if (this.proxies.length > 0 && !enhanced.proxy) {
      enhanced.proxy = this.getProxy();
    }
    
    // Add rate limiting headers
    enhanced.headers = {
      ...enhanced.headers,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
    
    return enhanced;
  }

  /**
   * Get user agent based on strategy
   * @param {string} strategy - Strategy: 'rotate', 'random', 'least-used'
   * @returns {string} User agent string
   */
  getUserAgent(strategy = 'rotate') {
    switch (strategy) {
      case 'random':
        return this.userAgentRotator.getRandom();
      case 'least-used':
        return this.userAgentRotator.getLeastUsed();
      case 'rotate':
      default:
        return this.userAgentRotator.getNext();
    }
  }

  /**
   * Get next proxy in rotation
   * @returns {string|null} Proxy URL or null if no proxies available
   */
  getProxy() {
    if (this.proxies.length === 0) {
      return null;
    }
    
    // Find a working proxy
    let attempts = 0;
    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentProxyIndex];
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
      
      const failures = this.proxyFailures.get(proxy) || 0;
      if (failures < 3) { // Allow up to 3 failures before skipping
        return proxy;
      }
      
      attempts++;
    }
    
    // If all proxies have failed, reset failure counts and try again
    this.proxyFailures.clear();
    return this.proxies[0];
  }

  /**
   * Handle rate limit error
   * @param {Error} error - Rate limit error
   */
  handleRateLimitError(error) {
    logger.warn('Rate limit error detected', { error: error.message });
    
    // Extract retry-after header if available
    let retryAfter = this.cooldownPeriod;
    if (error.response && error.response.headers) {
      const retryAfterHeader = error.response.headers['retry-after'];
      if (retryAfterHeader) {
        retryAfter = parseInt(retryAfterHeader) * 1000; // Convert to milliseconds
      }
    }
    
    // Set cooldown period
    this.blockedUntil = Date.now() + retryAfter;
    
    logger.info(`Rate limiter entering cooldown for ${retryAfter}ms`);
  }

  /**
   * Handle proxy failure
   * @param {string} proxy - Failed proxy
   */
  handleProxyFailure(proxy) {
    const failures = this.proxyFailures.get(proxy) || 0;
    this.proxyFailures.set(proxy, failures + 1);
    
    logger.warn(`Proxy failure recorded`, { proxy, failures: failures + 1 });
  }

  /**
   * Check if error is rate limit related
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is rate limit related
   */
  isRateLimitError(error) {
    if (error.response && error.response.status === 429) {
      return true;
    }
    
    const message = error.message.toLowerCase();
    return message.includes('rate limit') ||
           message.includes('too many requests') ||
           message.includes('throttled');
  }

  /**
   * Check if error is proxy related
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is proxy related
   */
  isProxyError(error) {
    const message = error.message.toLowerCase();
    return message.includes('proxy') ||
           message.includes('tunnel') ||
           message.includes('connection refused') ||
           (error.code && ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code));
  }

  /**
   * Get comprehensive rate limiter statistics
   * @returns {object} Statistics
   */
  getStats() {
    return {
      requests: {
        total: this.requestCount,
        consecutiveFailures: this.consecutiveFailures,
        lastRequestTime: this.lastRequestTime
      },
      rateLimiting: {
        requestsPerSecond: this.requestsPerSecond,
        burstLimit: this.burstLimit,
        tokenBucket: this.tokenBucket.getStatus(),
        blockedUntil: this.blockedUntil,
        isBlocked: Date.now() < this.blockedUntil
      },
      queue: this.requestQueue.getStatus(),
      userAgents: this.userAgentRotator.getStats(),
      proxies: {
        total: this.proxies.length,
        currentIndex: this.currentProxyIndex,
        failures: Object.fromEntries(this.proxyFailures)
      }
    };
  }

  /**
   * Reset rate limiter state
   */
  reset() {
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.blockedUntil = 0;
    this.consecutiveFailures = 0;
    this.tokenBucket = new TokenBucket(this.burstLimit, this.requestsPerSecond, 1000);
    this.requestQueue.clear();
    this.userAgentRotator.resetStats();
    this.proxyFailures.clear();
    this.currentProxyIndex = 0;
    
    logger.info('Rate limiter reset');
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = {
  RateLimiter,
  TokenBucket,
  RequestQueue,
  UserAgentRotator
};
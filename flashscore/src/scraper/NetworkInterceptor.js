const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * NetworkInterceptor class for request/response interception using Playwright
 * Handles API endpoint discovery, JSON response capture, and WebSocket monitoring
 */
class NetworkInterceptor {
  constructor(page, config = {}) {
    if (!page) {
      throw new Error('Page instance is required');
    }

    this.page = page;
    this.config = {
      captureResponses: config.captureResponses !== false, // Default to true
      captureRequests: config.captureRequests !== false, // Default to true
      saveToFile: config.saveToFile || false,
      outputDir: config.outputDir || './logs/network',
      maxResponseSize: config.maxResponseSize || 1024 * 1024, // 1MB
      filterPatterns: config.filterPatterns || [],
      excludePatterns: config.excludePatterns || [
        /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/i,
        /google-analytics/,
        /googletagmanager/,
        /facebook\.net/,
        /doubleclick\.net/
      ],
      ...config
    };

    this.interceptedRequests = new Map();
    this.interceptedResponses = new Map();
    this.apiEndpoints = new Set();
    this.webSocketConnections = new Map();
    this.isActive = false;
    this.requestCounter = 0;
  }

  /**
   * Start intercepting network requests and responses
   */
  async startInterception() {
    if (this.isActive) {
      logger.warn('Network interception already active');
      return;
    }

    logger.info('Starting network interception');

    try {
      // Create output directory if saving to file
      if (this.config.saveToFile) {
        await this.ensureOutputDirectory();
      }

      // Set up request interception
      await this.page.route('**/*', async (route, request) => {
        await this.handleRequest(route, request);
      });

      // Set up response monitoring
      this.page.on('response', async (response) => {
        await this.handleResponse(response);
      });

      // Set up WebSocket monitoring
      this.page.on('websocket', (webSocket) => {
        this.handleWebSocket(webSocket);
      });

      this.isActive = true;
      logger.info('Network interception started successfully');

    } catch (error) {
      logger.error('Failed to start network interception', { error: error.message });
      throw new Error(`Network interception failed: ${error.message}`);
    }
  }

  /**
   * Stop network interception
   */
  async stopInterception() {
    if (!this.isActive) {
      logger.warn('Network interception not active');
      return;
    }

    logger.info('Stopping network interception');

    try {
      // Remove route handler
      await this.page.unroute('**/*');

      // Remove event listeners
      this.page.removeAllListeners('response');
      this.page.removeAllListeners('websocket');

      this.isActive = false;
      logger.info('Network interception stopped successfully');

    } catch (error) {
      logger.error('Failed to stop network interception', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle intercepted requests
   */
  async handleRequest(route, request) {
    const requestId = ++this.requestCounter;
    const url = request.url();
    const method = request.method();

    try {
      // Check if request should be filtered
      if (this.shouldFilterRequest(url)) {
        await route.continue();
        return;
      }

      // Store request information
      if (this.config.captureRequests) {
        const requestData = {
          id: requestId,
          url,
          method,
          headers: request.headers(),
          postData: request.postData(),
          timestamp: new Date().toISOString(),
          resourceType: request.resourceType()
        };

        this.interceptedRequests.set(requestId, requestData);

        // Detect API endpoints
        if (this.isApiEndpoint(url, method)) {
          this.apiEndpoints.add(url);
          logger.info('API endpoint discovered', { url, method });
        }

        logger.debug('Request intercepted', { 
          id: requestId, 
          method, 
          url: this.truncateUrl(url) 
        });
      }

      // Continue with the request
      await route.continue();

    } catch (error) {
      logger.error('Request handling failed', { 
        url: this.truncateUrl(url), 
        error: error.message 
      });
      
      // Continue request even if handling fails
      try {
        await route.continue();
      } catch (continueError) {
        logger.error('Failed to continue request', { error: continueError.message });
      }
    }
  }

  /**
   * Handle intercepted responses
   */
  async handleResponse(response) {
    const request = response.request();
    const url = request.url();
    const status = response.status();

    try {
      // Check if response should be filtered
      if (this.shouldFilterRequest(url)) {
        return;
      }

      if (this.config.captureResponses) {
        const responseData = {
          url,
          status,
          statusText: response.statusText(),
          headers: response.headers(),
          timestamp: new Date().toISOString(),
          method: request.method(),
          resourceType: request.resourceType()
        };

        // Capture response body for API endpoints
        if (this.isApiEndpoint(url, request.method()) && this.isJsonResponse(response)) {
          try {
            const body = await response.text();
            
            // Check response size limit
            if (body.length <= this.config.maxResponseSize) {
              responseData.body = body;
              
              // Try to parse as JSON
              try {
                responseData.jsonData = JSON.parse(body);
                logger.info('JSON response captured', { 
                  url: this.truncateUrl(url), 
                  status,
                  size: body.length 
                });
              } catch (parseError) {
                logger.warn('Failed to parse JSON response', { 
                  url: this.truncateUrl(url),
                  error: parseError.message 
                });
              }
            } else {
              logger.warn('Response too large to capture', { 
                url: this.truncateUrl(url),
                size: body.length,
                limit: this.config.maxResponseSize 
              });
            }
          } catch (bodyError) {
            logger.warn('Failed to read response body', { 
              url: this.truncateUrl(url),
              error: bodyError.message 
            });
          }
        }

        this.interceptedResponses.set(url, responseData);

        // Save to file if configured
        if (this.config.saveToFile && responseData.jsonData) {
          await this.saveResponseToFile(responseData);
        }

        logger.debug('Response intercepted', { 
          url: this.truncateUrl(url), 
          status,
          hasJsonData: !!responseData.jsonData 
        });
      }

    } catch (error) {
      logger.error('Response handling failed', { 
        url: this.truncateUrl(url), 
        error: error.message 
      });
    }
  }

  /**
   * Handle WebSocket connections
   */
  handleWebSocket(webSocket) {
    const url = webSocket.url();
    const connectionId = Date.now() + Math.random();

    logger.info('WebSocket connection detected', { url, connectionId });

    const connectionData = {
      id: connectionId,
      url,
      connected: true,
      messages: [],
      timestamp: new Date().toISOString()
    };

    this.webSocketConnections.set(connectionId, connectionData);

    // Monitor WebSocket messages
    webSocket.on('framesent', (event) => {
      const message = {
        type: 'sent',
        payload: event.payload,
        timestamp: new Date().toISOString()
      };
      
      connectionData.messages.push(message);
      
      logger.debug('WebSocket message sent', { 
        url: this.truncateUrl(url),
        connectionId,
        payloadSize: event.payload.length 
      });

      // Try to parse JSON payload
      try {
        const jsonPayload = JSON.parse(event.payload);
        message.jsonData = jsonPayload;
        
        logger.info('WebSocket JSON message sent', { 
          url: this.truncateUrl(url),
          connectionId,
          messageType: jsonPayload.type || 'unknown'
        });
      } catch (error) {
        // Not JSON, ignore
      }
    });

    webSocket.on('framereceived', (event) => {
      const message = {
        type: 'received',
        payload: event.payload,
        timestamp: new Date().toISOString()
      };
      
      connectionData.messages.push(message);
      
      logger.debug('WebSocket message received', { 
        url: this.truncateUrl(url),
        connectionId,
        payloadSize: event.payload.length 
      });

      // Try to parse JSON payload
      try {
        const jsonPayload = JSON.parse(event.payload);
        message.jsonData = jsonPayload;
        
        logger.info('WebSocket JSON message received', { 
          url: this.truncateUrl(url),
          connectionId,
          messageType: jsonPayload.type || 'unknown'
        });

        // Save WebSocket data if configured
        if (this.config.saveToFile) {
          this.saveWebSocketMessage(connectionData, message);
        }
      } catch (error) {
        // Not JSON, ignore
      }
    });

    webSocket.on('close', () => {
      connectionData.connected = false;
      connectionData.closedAt = new Date().toISOString();
      
      logger.info('WebSocket connection closed', { 
        url: this.truncateUrl(url),
        connectionId,
        messageCount: connectionData.messages.length 
      });
    });

    webSocket.on('socketerror', (error) => {
      logger.error('WebSocket error', { 
        url: this.truncateUrl(url),
        connectionId,
        error: error.message 
      });
    });
  }

  /**
   * Check if request should be filtered out
   */
  shouldFilterRequest(url) {
    // Check exclude patterns
    for (const pattern of this.config.excludePatterns) {
      if (pattern instanceof RegExp && pattern.test(url)) {
        return true;
      }
      if (typeof pattern === 'string' && url.includes(pattern)) {
        return true;
      }
    }

    // Check include patterns (if any)
    if (this.config.filterPatterns.length > 0) {
      for (const pattern of this.config.filterPatterns) {
        if (pattern instanceof RegExp && pattern.test(url)) {
          return false;
        }
        if (typeof pattern === 'string' && url.includes(pattern)) {
          return false;
        }
      }
      return true; // Not in include patterns
    }

    return false; // Don't filter
  }

  /**
   * Check if URL is an API endpoint
   */
  isApiEndpoint(url, method) {
    // Common API patterns
    const apiPatterns = [
      /\/api\//,
      /\/v\d+\//,
      /\.json$/,
      /\/graphql/,
      /\/rest\//,
      /\/ajax\//,
      /\/data\//
    ];

    // Check for API patterns in URL
    for (const pattern of apiPatterns) {
      if (pattern.test(url)) {
        return true;
      }
    }

    // Check for POST/PUT/PATCH requests (likely API calls)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      return true;
    }

    // Check for XHR/Fetch requests with JSON content
    return url.includes('flashscore') && (
      url.includes('feed') ||
      url.includes('match') ||
      url.includes('league') ||
      url.includes('live') ||
      url.includes('fixtures')
    );
  }

  /**
   * Check if response is JSON
   */
  isJsonResponse(response) {
    const contentType = response.headers()['content-type'] || '';
    return contentType.includes('application/json') || 
           contentType.includes('text/json') ||
           contentType.includes('application/javascript');
  }

  /**
   * Truncate URL for logging
   */
  truncateUrl(url, maxLength = 100) {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create output directory', { 
        dir: this.config.outputDir,
        error: error.message 
      });
    }
  }

  /**
   * Save response to file
   */
  async saveResponseToFile(responseData) {
    try {
      const filename = this.generateFilename(responseData.url, 'response');
      const filepath = path.join(this.config.outputDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(responseData, null, 2));
      
      logger.debug('Response saved to file', { filepath });
    } catch (error) {
      logger.error('Failed to save response to file', { error: error.message });
    }
  }

  /**
   * Save WebSocket message to file
   */
  async saveWebSocketMessage(connectionData, message) {
    try {
      const filename = this.generateFilename(connectionData.url, 'websocket');
      const filepath = path.join(this.config.outputDir, filename);
      
      const data = {
        connection: {
          id: connectionData.id,
          url: connectionData.url,
          timestamp: connectionData.timestamp
        },
        message
      };
      
      await fs.appendFile(filepath, JSON.stringify(data) + '\n');
      
      logger.debug('WebSocket message saved to file', { filepath });
    } catch (error) {
      logger.error('Failed to save WebSocket message to file', { error: error.message });
    }
  }

  /**
   * Generate filename for saved data
   */
  generateFilename(url, type) {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/\./g, '_');
    const pathname = urlObj.pathname.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    return `${type}_${hostname}_${pathname}_${timestamp}.json`;
  }

  /**
   * Get discovered API endpoints
   */
  getApiEndpoints() {
    return Array.from(this.apiEndpoints);
  }

  /**
   * Get intercepted requests
   */
  getInterceptedRequests() {
    return Array.from(this.interceptedRequests.values());
  }

  /**
   * Get intercepted responses
   */
  getInterceptedResponses() {
    return Array.from(this.interceptedResponses.values());
  }

  /**
   * Get WebSocket connections
   */
  getWebSocketConnections() {
    return Array.from(this.webSocketConnections.values());
  }

  /**
   * Get responses by URL pattern
   */
  getResponsesByPattern(pattern) {
    const responses = [];
    
    for (const [url, response] of this.interceptedResponses) {
      if (pattern instanceof RegExp && pattern.test(url)) {
        responses.push(response);
      } else if (typeof pattern === 'string' && url.includes(pattern)) {
        responses.push(response);
      }
    }
    
    return responses;
  }

  /**
   * Get WebSocket messages by URL pattern
   */
  getWebSocketMessagesByPattern(pattern) {
    const messages = [];
    
    for (const connection of this.webSocketConnections.values()) {
      if (pattern instanceof RegExp && pattern.test(connection.url)) {
        messages.push(...connection.messages);
      } else if (typeof pattern === 'string' && connection.url.includes(pattern)) {
        messages.push(...connection.messages);
      }
    }
    
    return messages;
  }

  /**
   * Clear captured data
   */
  clearCapturedData() {
    this.interceptedRequests.clear();
    this.interceptedResponses.clear();
    this.webSocketConnections.clear();
    this.apiEndpoints.clear();
    this.requestCounter = 0;
    
    logger.info('Captured network data cleared');
  }

  /**
   * Get interception statistics
   */
  getStatistics() {
    return {
      isActive: this.isActive,
      requestCount: this.interceptedRequests.size,
      responseCount: this.interceptedResponses.size,
      apiEndpointCount: this.apiEndpoints.size,
      webSocketConnectionCount: this.webSocketConnections.size,
      totalWebSocketMessages: Array.from(this.webSocketConnections.values())
        .reduce((total, conn) => total + conn.messages.length, 0)
    };
  }
}

module.exports = NetworkInterceptor;
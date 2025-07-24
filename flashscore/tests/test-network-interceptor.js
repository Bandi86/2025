const NetworkInterceptor = require('../src/scraper/NetworkInterceptor');

console.log('Testing NetworkInterceptor...');

// Mock page object for testing
const createMockPage = () => {
  const eventHandlers = new Map();
  const routes = new Map();
  
  return {
    route: async (pattern, handler) => {
      routes.set(pattern, handler);
      console.log(`  Mock route registered: ${pattern}`);
    },
    
    unroute: async (pattern) => {
      routes.delete(pattern);
      console.log(`  Mock route unregistered: ${pattern}`);
    },
    
    on: (event, handler) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event).push(handler);
      console.log(`  Mock event listener added: ${event}`);
    },
    
    removeAllListeners: (event) => {
      eventHandlers.delete(event);
      console.log(`  Mock event listeners removed: ${event}`);
    },
    
    // Helper method to simulate events
    _emit: (event, ...args) => {
      const handlers = eventHandlers.get(event) || [];
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.log(`  Event handler error: ${error.message}`);
        }
      });
    },
    
    // Helper method to simulate route handling
    _handleRoute: async (url, method = 'GET') => {
      const handler = routes.get('**/*');
      if (handler) {
        const mockRoute = {
          continue: async () => console.log(`  Route continued: ${method} ${url}`)
        };
        const mockRequest = {
          url: () => url,
          method: () => method,
          headers: () => ({ 'user-agent': 'test' }),
          postData: () => null,
          resourceType: () => 'xhr'
        };
        await handler(mockRoute, mockRequest);
      }
    }
  };
};

// Mock response object
const createMockResponse = (url, status = 200, body = '{"test": "data"}') => ({
  url: () => url,
  status: () => status,
  statusText: () => 'OK',
  headers: () => ({ 'content-type': 'application/json' }),
  text: async () => body,
  request: () => ({
    url: () => url,
    method: () => 'GET',
    resourceType: () => 'xhr'
  })
});

// Mock WebSocket object
const createMockWebSocket = (url) => {
  const eventHandlers = new Map();
  
  return {
    url: () => url,
    
    on: (event, handler) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event).push(handler);
    },
    
    // Helper method to simulate events
    _emit: (event, data) => {
      const handlers = eventHandlers.get(event) || [];
      handlers.forEach(handler => handler(data));
    }
  };
};

// Test 1: Constructor
console.log('\n1. Testing constructor...');
try {
  const mockPage = createMockPage();
  const interceptor = new NetworkInterceptor(mockPage);
  console.log('✓ Constructor with page:', 'PASS');
  console.log('✓ Default config:', interceptor.config.captureResponses ? 'PASS' : 'FAIL');
  console.log('✓ Initial state:', !interceptor.isActive ? 'PASS' : 'FAIL');
  
  const customConfig = {
    captureResponses: false,
    maxResponseSize: 512 * 1024,
    saveToFile: true
  };
  const customInterceptor = new NetworkInterceptor(mockPage, customConfig);
  console.log('✓ Custom config:', !customInterceptor.config.captureResponses ? 'PASS' : 'FAIL');
  
  try {
    new NetworkInterceptor(null);
    console.log('✗ Should throw error without page');
  } catch (error) {
    console.log('✓ Throws error without page:', 'PASS');
  }
} catch (error) {
  console.log('✗ Constructor test failed:', error.message);
}

// Test 2: URL filtering
console.log('\n2. Testing URL filtering...');
try {
  const mockPage = createMockPage();
  const interceptor = new NetworkInterceptor(mockPage);
  
  // Test exclude patterns
  const excludeTests = [
    { url: 'https://example.com/style.css', expected: true },
    { url: 'https://example.com/script.js', expected: true },
    { url: 'https://example.com/image.png', expected: true },
    { url: 'https://google-analytics.com/collect', expected: true },
    { url: 'https://example.com/api/data', expected: false }
  ];
  
  excludeTests.forEach((test, index) => {
    const result = interceptor.shouldFilterRequest(test.url);
    console.log(`✓ Exclude test ${index + 1}:`, result === test.expected ? 'PASS' : 'FAIL');
  });
  
  // Test include patterns
  const includeInterceptor = new NetworkInterceptor(mockPage, {
    filterPatterns: [/\/api\//, 'flashscore']
  });
  
  const includeTests = [
    { url: 'https://example.com/api/data', expected: false },
    { url: 'https://flashscore.com/feed', expected: false },
    { url: 'https://example.com/page.html', expected: true }
  ];
  
  includeTests.forEach((test, index) => {
    const result = includeInterceptor.shouldFilterRequest(test.url);
    console.log(`✓ Include test ${index + 1}:`, result === test.expected ? 'PASS' : 'FAIL');
  });
} catch (error) {
  console.log('✗ URL filtering test failed:', error.message);
}

// Test 3: API endpoint detection
console.log('\n3. Testing API endpoint detection...');
try {
  const mockPage = createMockPage();
  const interceptor = new NetworkInterceptor(mockPage);
  
  const apiTests = [
    { url: 'https://example.com/api/users', method: 'GET', expected: true },
    { url: 'https://example.com/v1/data', method: 'GET', expected: true },
    { url: 'https://example.com/data.json', method: 'GET', expected: true },
    { url: 'https://example.com/form', method: 'POST', expected: true },
    { url: 'https://flashscore.com/feed/live', method: 'GET', expected: true },
    { url: 'https://example.com/page.html', method: 'GET', expected: false }
  ];
  
  apiTests.forEach((test, index) => {
    const result = interceptor.isApiEndpoint(test.url, test.method);
    console.log(`✓ API detection test ${index + 1}:`, result === test.expected ? 'PASS' : 'FAIL');
  });
} catch (error) {
  console.log('✗ API endpoint detection test failed:', error.message);
}

// Test 4: JSON response detection
console.log('\n4. Testing JSON response detection...');
try {
  const mockPage = createMockPage();
  const interceptor = new NetworkInterceptor(mockPage);
  
  const jsonTests = [
    { headers: { 'content-type': 'application/json' }, expected: true },
    { headers: { 'content-type': 'text/json' }, expected: true },
    { headers: { 'content-type': 'application/javascript' }, expected: true },
    { headers: { 'content-type': 'text/html' }, expected: false },
    { headers: { 'content-type': 'image/png' }, expected: false }
  ];
  
  jsonTests.forEach((test, index) => {
    const mockResponse = { headers: () => test.headers };
    const result = interceptor.isJsonResponse(mockResponse);
    console.log(`✓ JSON detection test ${index + 1}:`, result === test.expected ? 'PASS' : 'FAIL');
  });
} catch (error) {
  console.log('✗ JSON response detection test failed:', error.message);
}

// Test 5: Start/Stop interception
console.log('\n5. Testing start/stop interception...');
async function testStartStopInterception() {
  try {
    const mockPage = createMockPage();
    const interceptor = new NetworkInterceptor(mockPage);
    
    await interceptor.startInterception();
    console.log('✓ Start interception:', interceptor.isActive ? 'PASS' : 'FAIL');
    
    await interceptor.stopInterception();
    console.log('✓ Stop interception:', !interceptor.isActive ? 'PASS' : 'FAIL');
    
    // Test double start
    await interceptor.startInterception();
    await interceptor.startInterception(); // Should warn but not fail
    console.log('✓ Double start handled gracefully:', 'PASS');
    
    await interceptor.stopInterception();
  } catch (error) {
    console.log('✗ Start/stop interception test failed:', error.message);
  }
}

// Test 6: Request handling
console.log('\n6. Testing request handling...');
async function testRequestHandling() {
  try {
    const mockPage = createMockPage();
    const interceptor = new NetworkInterceptor(mockPage);
    
    await interceptor.startInterception();
    
    // Simulate API request
    await mockPage._handleRoute('https://flashscore.com/api/matches', 'GET');
    
    const requests = interceptor.getInterceptedRequests();
    console.log('✓ Request captured:', requests.length > 0 ? 'PASS' : 'FAIL');
    
    const apiEndpoints = interceptor.getApiEndpoints();
    console.log('✓ API endpoint discovered:', apiEndpoints.length > 0 ? 'PASS' : 'FAIL');
    
    await interceptor.stopInterception();
  } catch (error) {
    console.log('✗ Request handling test failed:', error.message);
  }
}

// Test 7: Response handling
console.log('\n7. Testing response handling...');
async function testResponseHandling() {
  try {
    const mockPage = createMockPage();
    const interceptor = new NetworkInterceptor(mockPage);
    
    await interceptor.startInterception();
    
    // Simulate API response
    const mockResponse = createMockResponse('https://flashscore.com/api/matches', 200, '{"matches": []}');
    mockPage._emit('response', mockResponse);
    
    // Give it a moment to process
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const responses = interceptor.getInterceptedResponses();
    console.log('✓ Response captured:', responses.length > 0 ? 'PASS' : 'FAIL');
    
    if (responses.length > 0) {
      console.log('✓ JSON data parsed:', responses[0].jsonData ? 'PASS' : 'FAIL');
    }
    
    await interceptor.stopInterception();
  } catch (error) {
    console.log('✗ Response handling test failed:', error.message);
  }
}

// Test 8: WebSocket handling
console.log('\n8. Testing WebSocket handling...');
async function testWebSocketHandling() {
  try {
    const mockPage = createMockPage();
    const interceptor = new NetworkInterceptor(mockPage);
    
    await interceptor.startInterception();
    
    // Simulate WebSocket connection
    const mockWebSocket = createMockWebSocket('wss://flashscore.com/live');
    mockPage._emit('websocket', mockWebSocket);
    
    // Simulate WebSocket messages
    mockWebSocket._emit('framereceived', { payload: '{"type": "match_update", "data": {}}' });
    mockWebSocket._emit('framesent', { payload: '{"type": "subscribe", "match_id": "123"}' });
    
    const connections = interceptor.getWebSocketConnections();
    console.log('✓ WebSocket connection captured:', connections.length > 0 ? 'PASS' : 'FAIL');
    
    if (connections.length > 0) {
      console.log('✓ WebSocket messages captured:', connections[0].messages.length >= 2 ? 'PASS' : 'FAIL');
      console.log('✓ JSON message parsed:', connections[0].messages[0].jsonData ? 'PASS' : 'FAIL');
    }
    
    await interceptor.stopInterception();
  } catch (error) {
    console.log('✗ WebSocket handling test failed:', error.message);
  }
}

// Test 9: Data retrieval methods
console.log('\n9. Testing data retrieval methods...');
async function testDataRetrieval() {
  try {
    const mockPage = createMockPage();
    const interceptor = new NetworkInterceptor(mockPage);
    
    await interceptor.startInterception();
    
    // Add some test data
    await mockPage._handleRoute('https://flashscore.com/api/matches', 'GET');
    const mockResponse = createMockResponse('https://flashscore.com/api/matches');
    mockPage._emit('response', mockResponse);
    
    // Test pattern-based retrieval
    const matchingResponses = interceptor.getResponsesByPattern(/matches/);
    console.log('✓ Pattern-based response retrieval:', matchingResponses.length > 0 ? 'PASS' : 'FAIL');
    
    const stringPatternResponses = interceptor.getResponsesByPattern('flashscore');
    console.log('✓ String pattern response retrieval:', stringPatternResponses.length > 0 ? 'PASS' : 'FAIL');
    
    // Test statistics
    const stats = interceptor.getStatistics();
    console.log('✓ Statistics generation:', stats.isActive && stats.requestCount >= 0 ? 'PASS' : 'FAIL');
    
    // Test clear data
    interceptor.clearCapturedData();
    const clearedStats = interceptor.getStatistics();
    console.log('✓ Data clearing:', clearedStats.requestCount === 0 ? 'PASS' : 'FAIL');
    
    await interceptor.stopInterception();
  } catch (error) {
    console.log('✗ Data retrieval test failed:', error.message);
  }
}

// Test 10: Utility methods
console.log('\n10. Testing utility methods...');
try {
  const mockPage = createMockPage();
  const interceptor = new NetworkInterceptor(mockPage);
  
  // Test URL truncation
  const longUrl = 'https://example.com/' + 'a'.repeat(200);
  const truncated = interceptor.truncateUrl(longUrl, 50);
  console.log('✓ URL truncation:', truncated.length <= 53 && truncated.endsWith('...') ? 'PASS' : 'FAIL'); // 50 + '...'
  
  // Test filename generation
  const filename = interceptor.generateFilename('https://example.com/api/data', 'response');
  console.log('✓ Filename generation:', filename.includes('response') && filename.includes('example_com') ? 'PASS' : 'FAIL');
} catch (error) {
  console.log('✗ Utility methods test failed:', error.message);
}

// Run all async tests
async function runAllTests() {
  await testStartStopInterception();
  await testRequestHandling();
  await testResponseHandling();
  await testWebSocketHandling();
  await testDataRetrieval();
  
  console.log('\nNetworkInterceptor tests completed!');
  console.log('Note: These are basic tests with mocked objects.');
  console.log('Integration tests with real Playwright pages would provide more comprehensive validation.');
}

runAllTests();
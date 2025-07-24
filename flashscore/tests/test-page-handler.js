const PageHandler = require('../src/scraper/PageHandler');

console.log('Testing PageHandler...');

// Mock page object for testing
const createMockPage = () => {
  let scrollHeight = 1000;
  let scrollY = 0;
  let requestCount = 0;
  
  return {
    locator: (selector) => ({
      first: () => ({
        isVisible: async (options = {}) => {
          // Simulate element visibility based on selector
          if (selector.includes('loading')) return false;
          if (selector.includes('target')) return scrollY > 500;
          return true;
        },
        waitFor: async (options = {}) => {
          // Simulate waiting for element state
          return true;
        },
        click: async (options = {}) => {
          console.log(`  Mock click on: ${selector}`);
        },
        hover: async (options = {}) => {
          console.log(`  Mock hover on: ${selector}`);
        },
        fill: async (text) => {
          console.log(`  Mock fill on: ${selector} with: ${text}`);
        }
      }),
      all: async () => {
        // Simulate multiple elements based on scroll position
        const itemCount = Math.floor(scrollY / 100) + 5;
        return Array(itemCount).fill().map((_, i) => ({ id: i }));
      }
    }),
    
    evaluate: async (fn, ...args) => {
      if (fn.toString().includes('scrollBy')) {
        scrollY += args[0] || 500;
        return;
      }
      if (fn.toString().includes('scrollTo')) {
        scrollY = args[1] || 0;
        return;
      }
      if (fn.toString().includes('scrollHeight')) {
        // Simulate growing content
        scrollHeight = Math.max(scrollHeight, scrollY + 1000);
        return scrollHeight;
      }
      return scrollHeight;
    },
    
    waitForTimeout: async (ms) => {
      // Simulate timeout
      return new Promise(resolve => setTimeout(resolve, Math.min(ms, 10))); // Speed up for testing
    },
    
    waitForSelector: async (selector, options = {}) => {
      // Simulate selector waiting
      if (selector.includes('nonexistent')) {
        throw new Error('Selector not found');
      }
      return { selector };
    },
    
    waitForFunction: async (fn, args, options = {}) => {
      // Simulate function waiting
      return true;
    },
    
    waitForLoadState: async (state, options = {}) => {
      // Simulate load state waiting
      return true;
    },
    
    on: (event, handler) => {
      // Mock event listener
    },
    
    off: (event, handler) => {
      // Mock event listener removal
    }
  };
};

// Test 1: Constructor
console.log('\n1. Testing constructor...');
try {
  const mockPage = createMockPage();
  const handler = new PageHandler(mockPage);
  console.log('✓ Constructor with page:', 'PASS');
  
  const customConfig = {
    scrollDelay: 500,
    maxScrollAttempts: 5,
    elementTimeout: 5000
  };
  const handlerWithConfig = new PageHandler(mockPage, customConfig);
  console.log('✓ Constructor with custom config:', 
    handlerWithConfig.config.scrollDelay === 500 ? 'PASS' : 'FAIL');
  
  try {
    new PageHandler(null);
    console.log('✗ Should throw error without page');
  } catch (error) {
    console.log('✓ Throws error without page:', 'PASS');
  }
} catch (error) {
  console.log('✗ Constructor test failed:', error.message);
}

// Test 2: isElementVisible
console.log('\n2. Testing isElementVisible...');
async function testIsElementVisible() {
  try {
    const mockPage = createMockPage();
    const handler = new PageHandler(mockPage);
    
    const visible = await handler.isElementVisible('.visible-element');
    console.log('✓ Element visibility check:', visible ? 'PASS' : 'FAIL');
    
    const invisible = await handler.isElementVisible('.loading');
    console.log('✓ Loading element visibility:', !invisible ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('✗ isElementVisible test failed:', error.message);
  }
}

// Test 3: scrollToLoadContent
console.log('\n3. Testing scrollToLoadContent...');
async function testScrollToLoadContent() {
  try {
    const mockPage = createMockPage();
    const handler = new PageHandler(mockPage, { scrollDelay: 10, maxScrollAttempts: 3 });
    
    const result = await handler.scrollToLoadContent({
      maxScrolls: 3,
      scrollStep: 200,
      delay: 10
    });
    console.log('✓ Basic scroll-to-load:', result ? 'PASS' : 'FAIL');
    
    const targetResult = await handler.scrollToLoadContent({
      targetSelector: '.target-element',
      maxScrolls: 5,
      delay: 10
    });
    console.log('✓ Scroll with target selector:', targetResult ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('✗ scrollToLoadContent test failed:', error.message);
  }
}

// Test 4: waitForDynamicContent
console.log('\n4. Testing waitForDynamicContent...');
async function testWaitForDynamicContent() {
  try {
    const mockPage = createMockPage();
    const handler = new PageHandler(mockPage);
    
    const result = await handler.waitForDynamicContent({
      selectors: ['.content', '.data'],
      timeout: 1000
    });
    console.log('✓ Wait for dynamic content:', result ? 'PASS' : 'FAIL');
    
    const networkResult = await handler.waitForDynamicContent({
      networkIdle: true,
      timeout: 1000
    });
    console.log('✓ Wait with network idle:', networkResult ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('✗ waitForDynamicContent test failed:', error.message);
  }
}

// Test 5: detectAndInteract
console.log('\n5. Testing detectAndInteract...');
async function testDetectAndInteract() {
  try {
    const mockPage = createMockPage();
    const handler = new PageHandler(mockPage, { retryDelay: 10 });
    
    const elementConfig = {
      selectors: ['.button', '.btn'],
      fallbackSelectors: ['.fallback-btn'],
      retryCount: 2
    };
    
    const result = await handler.detectAndInteract(elementConfig, 'click');
    console.log('✓ Detect and click:', result ? 'PASS' : 'FAIL');
    
    const hoverResult = await handler.detectAndInteract(elementConfig, 'hover');
    console.log('✓ Detect and hover:', hoverResult ? 'PASS' : 'FAIL');
    
    const fillResult = await handler.detectAndInteract(elementConfig, 'fill', { text: 'test' });
    console.log('✓ Detect and fill:', fillResult ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('✗ detectAndInteract test failed:', error.message);
  }
}

// Test 6: handleInfiniteScroll
console.log('\n6. Testing handleInfiniteScroll...');
async function testHandleInfiniteScroll() {
  try {
    const mockPage = createMockPage();
    const handler = new PageHandler(mockPage);
    
    const result = await handler.handleInfiniteScroll({
      itemSelector: '.item',
      maxItems: 15,
      maxScrollTime: 1000,
      scrollDelay: 10
    });
    
    console.log('✓ Infinite scroll with max items:', 
      result.itemCount >= 15 ? 'PASS' : 'FAIL');
    console.log('  - Final item count:', result.itemCount);
    console.log('  - Scroll count:', result.scrollCount);
    
    const timeResult = await handler.handleInfiniteScroll({
      maxScrollTime: 100,
      scrollDelay: 10
    });
    console.log('✓ Infinite scroll with time limit:', 
      timeResult.duration <= 200 ? 'PASS' : 'FAIL'); // Allow some buffer
  } catch (error) {
    console.log('✗ handleInfiniteScroll test failed:', error.message);
  }
}

// Test 7: waitForPageReady
console.log('\n7. Testing waitForPageReady...');
async function testWaitForPageReady() {
  try {
    const mockPage = createMockPage();
    const handler = new PageHandler(mockPage);
    
    const result = await handler.waitForPageReady({
      waitForNetworkIdle: true,
      waitForDOMContentLoaded: true,
      timeout: 1000
    });
    console.log('✓ Wait for page ready:', result ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('✗ waitForPageReady test failed:', error.message);
  }
}

// Test 8: smartWait
console.log('\n8. Testing smartWait...');
async function testSmartWait() {
  try {
    const mockPage = createMockPage();
    const handler = new PageHandler(mockPage);
    
    const result = await handler.smartWait({
      selectors: ['.content'],
      networkIdle: true,
      loadingIndicators: true,
      timeout: 1000
    });
    console.log('✓ Smart wait:', result ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('✗ smartWait test failed:', error.message);
  }
}

// Test 9: Error handling
console.log('\n9. Testing error handling...');
async function testErrorHandling() {
  try {
    const mockPage = createMockPage();
    const handler = new PageHandler(mockPage);
    
    // Test with nonexistent selector
    try {
      await handler.detectAndInteract({
        selectors: ['.nonexistent'],
        retryCount: 1
      }, 'click');
      console.log('✗ Should have thrown error for nonexistent element');
    } catch (error) {
      console.log('✓ Correctly handles nonexistent element:', 'PASS');
    }
    
    // Test invalid action
    try {
      await handler.detectAndInteract({
        selectors: ['.button']
      }, 'invalid-action');
      console.log('✗ Should have thrown error for invalid action');
    } catch (error) {
      console.log('✓ Correctly handles invalid action:', 'PASS');
    }
  } catch (error) {
    console.log('✗ Error handling test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testIsElementVisible();
  await testScrollToLoadContent();
  await testWaitForDynamicContent();
  await testDetectAndInteract();
  await testHandleInfiniteScroll();
  await testWaitForPageReady();
  await testSmartWait();
  await testErrorHandling();
  
  console.log('\nPageHandler tests completed!');
  console.log('Note: These are basic tests with mocked page object.');
  console.log('Integration tests with real browser would provide more comprehensive validation.');
}

runAllTests();
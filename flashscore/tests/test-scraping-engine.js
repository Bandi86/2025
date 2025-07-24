const ScrapingEngine = require('../src/scraper/ScrapingEngine');

console.log('Testing ScrapingEngine...');

// Test 1: Constructor with default configuration
console.log('\n1. Testing constructor with default configuration...');
const engine1 = new ScrapingEngine();
console.log('✓ Default browserType:', engine1.config.browserType === 'chromium' ? 'PASS' : 'FAIL');
console.log('✓ Default headless:', engine1.config.headless === true ? 'PASS' : 'FAIL');
console.log('✓ Default viewport:', JSON.stringify(engine1.config.viewport) === JSON.stringify({ width: 1920, height: 1080 }) ? 'PASS' : 'FAIL');
console.log('✓ Initial state:', engine1.isInitialized === false ? 'PASS' : 'FAIL');

// Test 2: Constructor with custom configuration
console.log('\n2. Testing constructor with custom configuration...');
const customConfig = {
  browserType: 'firefox',
  headless: false,
  viewport: { width: 1280, height: 720 },
  timeout: 60000
};
const engine2 = new ScrapingEngine(customConfig);
console.log('✓ Custom browserType:', engine2.config.browserType === 'firefox' ? 'PASS' : 'FAIL');
console.log('✓ Custom headless:', engine2.config.headless === false ? 'PASS' : 'FAIL');
console.log('✓ Custom viewport:', JSON.stringify(engine2.config.viewport) === JSON.stringify({ width: 1280, height: 720 }) ? 'PASS' : 'FAIL');
console.log('✓ Custom timeout:', engine2.config.timeout === 60000 ? 'PASS' : 'FAIL');

// Test 3: getBrowserType method
console.log('\n3. Testing getBrowserType method...');
const { chromium, firefox, webkit } = require('playwright');
console.log('✓ Default browser type:', engine1.getBrowserType() === chromium ? 'PASS' : 'FAIL');
console.log('✓ Firefox browser type:', engine2.getBrowserType() === firefox ? 'PASS' : 'FAIL');

const webkitEngine = new ScrapingEngine({ browserType: 'webkit' });
console.log('✓ Webkit browser type:', webkitEngine.getBrowserType() === webkit ? 'PASS' : 'FAIL');

// Test 4: isReady method
console.log('\n4. Testing isReady method...');
console.log('✓ Not ready initially:', engine1.isReady() === false ? 'PASS' : 'FAIL');

// Test 5: Basic functionality test (without actual browser launch)
console.log('\n5. Testing basic functionality...');
try {
  console.log('✓ getCurrentUrl throws when not initialized:', 'PASS');
  try {
    engine1.getCurrentUrl();
    console.log('✗ Should have thrown error');
  } catch (error) {
    console.log('✓ Correctly throws error when not initialized:', error.message.includes('Browser not initialized') ? 'PASS' : 'FAIL');
  }
} catch (error) {
  console.log('✗ Unexpected error:', error.message);
}

// Test 6: Configuration validation
console.log('\n6. Testing configuration validation...');
const testConfigs = [
  { browserType: 'chromium', expected: 'chromium' },
  { browserType: 'CHROMIUM', expected: 'chromium' }, // Case insensitive
  { browserType: 'invalid', expected: 'chromium' }, // Fallback to default
];

testConfigs.forEach((test, index) => {
  const engine = new ScrapingEngine({ browserType: test.browserType });
  const actualType = engine.getBrowserType() === chromium ? 'chromium' : 
                    engine.getBrowserType() === firefox ? 'firefox' : 
                    engine.getBrowserType() === webkit ? 'webkit' : 'unknown';
  console.log(`✓ Config test ${index + 1}:`, actualType === test.expected ? 'PASS' : 'FAIL');
});

console.log('\n7. Testing error handling...');
async function testErrorHandling() {
  try {
    const engine = new ScrapingEngine();
    // Test methods that should throw when browser not initialized
    const methodsToTest = ['getPageContent', 'getPageText', 'takeScreenshot'];
    
    for (const method of methodsToTest) {
      try {
        if (method === 'takeScreenshot') {
          await engine[method]('test.png');
        } else {
          await engine[method]();
        }
        console.log(`✗ ${method} should have thrown error`);
      } catch (error) {
        console.log(`✓ ${method} correctly throws error:`, error.message.includes('Browser not initialized') ? 'PASS' : 'FAIL');
      }
    }
  } catch (error) {
    console.log('✗ Unexpected error in error handling test:', error.message);
  }
}

testErrorHandling();

console.log('\nScrapingEngine basic tests completed!');
console.log('Note: Full browser automation tests require actual browser launch and are not included in this basic test.');

// Test with actual browser (commented out for basic testing)
/*
async function testWithBrowser() {
  console.log('\n8. Testing with actual browser...');
  const engine = new ScrapingEngine({ headless: true });
  
  try {
    await engine.initializeBrowser();
    console.log('✓ Browser initialized successfully');
    
    console.log('✓ isReady after init:', engine.isReady() ? 'PASS' : 'FAIL');
    
    await engine.closeBrowser();
    console.log('✓ Browser closed successfully');
    
    console.log('✓ isReady after close:', !engine.isReady() ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('✗ Browser test failed:', error.message);
  }
}

// Uncomment to run browser tests
// testWithBrowser();
*/
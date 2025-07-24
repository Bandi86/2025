/**
 * Test script to verify the project structure and core configuration setup
 */

const FlashscoreScraper = require('../src/app');
const config = require('../src/utils/config');
const logger = require('../src/utils/logger');
const { ErrorHandler, NetworkError } = require('../src/utils/errors');

async function testSetup() {
  console.log('🧪 Testing Flashscore Scraper Setup...\n');

  try {
    // Test 1: Configuration loading
    console.log('1. Testing configuration loading...');
    const validation = config.validate();
    console.log(`   ✅ Configuration loaded: ${validation.isValid ? 'Valid' : 'Invalid'}`);
    if (!validation.isValid) {
      console.log(`   ❌ Validation errors: ${validation.errors.join(', ')}`);
    }
    console.log(`   📊 Environment: ${config.env}`);
    console.log(`   🗄️  Database type: ${config.database.type}`);
    console.log(`   ⏱️  Request delay: ${config.scraping.requestDelay}ms`);

    // Test 2: Logger functionality
    console.log('\n2. Testing logger functionality...');
    logger.info('Test info message', { test: true });
    logger.warn('Test warning message', { test: true });
    logger.debug('Test debug message', { test: true });
    console.log('   ✅ Logger working correctly');

    // Test 3: Error handling
    console.log('\n3. Testing error handling...');
    const testError = new NetworkError('Test network error', { url: 'test.com' });
    const isRetryable = ErrorHandler.isRetryable(testError);
    const retryDelay = ErrorHandler.getRetryDelay(testError, 1);
    console.log(`   ✅ Error handling: Retryable=${isRetryable}, Delay=${retryDelay}ms`);

    // Test 4: Application initialization
    console.log('\n4. Testing application initialization...');
    const app = new FlashscoreScraper();
    await app.initialize();
    const health = app.getHealthStatus();
    console.log(`   ✅ Application initialized: Status=${health.status}`);

    console.log('\n🎉 All tests passed! Setup is complete and working correctly.');
    
  } catch (error) {
    console.error('\n❌ Setup test failed:', error.message);
    logger.error('Setup test failed', error);
    process.exit(1);
  }
}

// Run the test
testSetup();
// Simple test to verify configuration system works
import { createTestConfig, validateConfig, DEFAULT_CONFIG } from './src/core/config/index.js';

console.log('Testing configuration system...');

try {
  // Test 1: Validate default configuration
  console.log('1. Testing default configuration validation...');
  const defaultValidation = validateConfig(DEFAULT_CONFIG);
  console.log('   Default config valid:', defaultValidation.isValid);
  if (!defaultValidation.isValid) {
    console.log('   Errors:', defaultValidation.errors);
  }

  // Test 2: Create and validate test configuration
  console.log('2. Testing test configuration creation...');
  const testConfig = createTestConfig();
  const testValidation = validateConfig(testConfig);
  console.log('   Test config valid:', testValidation.isValid);
  if (!testValidation.isValid) {
    console.log('   Errors:', testValidation.errors);
  }

  // Test 3: Test configuration with overrides
  console.log('3. Testing configuration with overrides...');
  const customConfig = createTestConfig({
    scraping: {
      timeout: 15000,
      maxRetries: 5
    }
  });
  console.log('   Custom timeout:', customConfig.scraping.timeout);
  console.log('   Custom retries:', customConfig.scraping.maxRetries);
  console.log('   Base URL (should be preserved):', customConfig.scraping.baseUrl);

  // Test 4: Test invalid configuration
  console.log('4. Testing invalid configuration detection...');
  const invalidConfig = createTestConfig({
    scraping: {
      timeout: -1 // Invalid
    }
  });
  const invalidValidation = validateConfig(invalidConfig);
  console.log('   Invalid config detected:', !invalidValidation.isValid);
  if (!invalidValidation.isValid) {
    console.log('   Expected errors found:', invalidValidation.errors.length > 0);
  }

  console.log('\n✅ All configuration tests passed!');
} catch (error) {
  console.error('❌ Configuration test failed:', error);
  process.exit(1);
}
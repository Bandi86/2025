/**
 * Simple integration test for the logging system
 */

import { getDefaultLogger, createLogger, setGlobalLogLevel } from './default-logger.js';
import { PerformanceLogger } from './performance-logger.js';
import { LogLevel } from '../../types/core.js';

// Test basic logging functionality
function testBasicLogging(): void {
  console.log('Testing basic logging...');
  
  const logger = getDefaultLogger();
  
  logger.info('Test info message', { test: true });
  logger.debug('Test debug message', { debug: true });
  logger.warn('Test warning message', { warning: true });
  logger.error('Test error message', new Error('Test error'), { error: true });
  
  console.log('✓ Basic logging test completed');
}

// Test named loggers
function testNamedLoggers(): void {
  console.log('Testing named loggers...');
  
  const scrapingLogger = createLogger('scraping-test');
  const exportLogger = createLogger('export-test');
  
  scrapingLogger.info('Scraping logger test', { component: 'scraper' });
  exportLogger.info('Export logger test', { component: 'exporter' });
  
  console.log('✓ Named loggers test completed');
}

// Test performance logging
function testPerformanceLogging(): void {
  console.log('Testing performance logging...');
  
  const logger = getDefaultLogger();
  const perfLogger = new PerformanceLogger(logger);
  
  const timer = perfLogger.startTimer('test-operation');
  
  // Simulate some work
  const start = Date.now();
  while (Date.now() - start < 100) {
    // Busy wait for 100ms
  }
  
  perfLogger.endTimer(timer);
  perfLogger.logMemoryUsage('test-memory');
  
  console.log('✓ Performance logging test completed');
}

// Test child loggers
function testChildLoggers(): void {
  console.log('Testing child loggers...');
  
  const parentLogger = getDefaultLogger();
  const childLogger = parentLogger.child({ 
    component: 'test-component',
    sessionId: 'test-session-123'
  });
  
  childLogger.info('Child logger test message');
  
  console.log('✓ Child loggers test completed');
}

// Test log levels
function testLogLevels(): void {
  console.log('Testing log levels...');
  
  const testLogger = createLogger('level-test');
  
  // Test with INFO level
  testLogger.setLevel(LogLevel.INFO);
  console.log('Setting level to INFO:');
  testLogger.debug('This debug should NOT appear');
  testLogger.info('This info should appear');
  
  // Test with DEBUG level
  testLogger.setLevel(LogLevel.DEBUG);
  console.log('Setting level to DEBUG:');
  testLogger.debug('This debug should appear');
  testLogger.info('This info should also appear');
  
  console.log('✓ Log levels test completed');
}

// Run all tests
function runTests(): void {
  console.log('=== Logging System Integration Test ===\n');
  
  try {
    testBasicLogging();
    console.log();
    
    testNamedLoggers();
    console.log();
    
    testPerformanceLogging();
    console.log();
    
    testChildLoggers();
    console.log();
    
    testLogLevels();
    console.log();
    
    console.log('=== All Tests Completed Successfully ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { runTests };

// Run tests if this file is executed directly
if (process.argv[1]?.endsWith('test-integration.ts') || process.argv[1]?.endsWith('test-integration.js')) {
  runTests();
}
/**
 * Demonstration of the logging system
 */

import { getDefaultLogger, createLogger } from './default-logger.js';
import { PerformanceLogger } from './performance-logger.js';
import { logContextManager } from './utils/log-context.js';
import { correlationIdGenerator } from './utils/correlation-id.js';
import { LogLevel } from '../../types/core.js';

async function demonstrateLogging(): Promise<void> {
  console.log('=== Flashscore Scraper Logging System Demo ===\n');

  // 1. Basic logging
  console.log('1. Basic Logging:');
  const logger = getDefaultLogger();
  
  logger.info('Application started', {
    version: '1.0.0',
    environment: 'development'
  });

  logger.debug('Debug information', {
    selector: '.match-row',
    elementCount: 25
  });

  logger.warn('Potential issue detected', {
    issue: 'Selector not found',
    fallback: 'Using alternative selector'
  });

  logger.error('An error occurred', new Error('Sample error'), {
    operation: 'data-extraction',
    url: 'https://example.com'
  });

  // 2. Named loggers
  console.log('\n2. Named Loggers:');
  const scrapingLogger = createLogger('scraping-service');
  const exportLogger = createLogger('export-service');

  scrapingLogger.info('Starting match scraping', {
    country: 'england',
    league: 'premier-league'
  });

  exportLogger.info('Exporting data', {
    format: 'json',
    recordCount: 100
  });

  // 3. Performance logging
  console.log('\n3. Performance Logging:');
  const perfLogger = new PerformanceLogger(logger);

  const timer = perfLogger.startTimer('data-processing', {
    operation: 'match-extraction',
    batchSize: 50
  });

  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 1500));

  perfLogger.endTimer(timer);

  // Log memory usage
  perfLogger.logMemoryUsage('after-processing');

  // 4. Context-aware logging
  console.log('\n4. Context-Aware Logging:');
  const correlationId = correlationIdGenerator.generate();
  
  await logContextManager.runAsync({
    correlationId,
    operation: 'scrape-league',
    userId: 'user-123'
  }, async () => {
    logger.info('Processing league data');
    
    // Simulate nested operations
    await processMatches();
    await exportResults();
  });

  // 5. Child loggers
  console.log('\n5. Child Loggers:');
  const childLogger = logger.child({
    component: 'browser-manager',
    sessionId: 'session-456'
  });

  childLogger.info('Browser initialized');
  childLogger.debug('Page loaded', { url: 'https://example.com' });

  // 6. Different log levels
  console.log('\n6. Different Log Levels:');
  const testLogger = createLogger('test-logger');
  
  testLogger.setLevel(LogLevel.DEBUG);
  testLogger.debug('This debug message will be shown');
  
  testLogger.setLevel(LogLevel.ERROR);
  testLogger.debug('This debug message will NOT be shown');
  testLogger.error('This error message will be shown', new Error('Test error'));

  console.log('\n=== Demo Complete ===');
}

async function processMatches(): Promise<void> {
  const logger = getDefaultLogger();
  
  logContextManager.updateContext({
    operation: 'process-matches',
    matchCount: 10
  });

  logger.info('Processing individual matches');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  logger.info('Matches processed successfully');
}

async function exportResults(): Promise<void> {
  const logger = getDefaultLogger();
  
  logContextManager.updateContext({
    operation: 'export-results',
    format: 'json'
  });

  logger.info('Exporting processed results');
  
  // Simulate export time
  await new Promise(resolve => setTimeout(resolve, 300));
  
  logger.info('Results exported successfully');
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateLogging().catch(console.error);
}

export { demonstrateLogging };
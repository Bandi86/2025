// Manual test for ErrorHandler to verify functionality
const { 
  ErrorHandler, 
  ScraperError, 
  NetworkError, 
  ParsingError, 
  DatabaseError, 
  RateLimitError,
  ConfigurationError,
  QueueError,
  ValidationError
} = require('../src/utils/errors');

console.log('Testing ErrorHandler functionality...\n');

// Mock logger for testing
const mockLogger = {
  error: (msg, data) => console.log(`ERROR: ${msg}`, JSON.stringify(data, null, 2)),
  warn: (msg, data) => console.log(`WARN: ${msg}`, JSON.stringify(data, null, 2)),
  info: (msg, data) => console.log(`INFO: ${msg}`, JSON.stringify(data, null, 2)),
  debug: (msg, data) => console.log(`DEBUG: ${msg}`, JSON.stringify(data, null, 2))
};

const errorHandler = new ErrorHandler(mockLogger);

// Test 1: Error Creation and Classification
console.log('=== Test 1: Error Creation and Classification ===');

const timeoutError = errorHandler.createError('Connection timeout occurred', 'scraping');
console.log('Timeout Error:', timeoutError.constructor.name, timeoutError.code);

const rateLimitError = errorHandler.createError('Rate limit exceeded - 429', 'api-request');
console.log('Rate Limit Error:', rateLimitError.constructor.name, rateLimitError.code);

const parsingError = errorHandler.createError('Selector not found on page', 'data-extraction');
console.log('Parsing Error:', parsingError.constructor.name, parsingError.code);

const dbError = errorHandler.createError('SQLite database locked', 'data-storage');
console.log('Database Error:', dbError.constructor.name, dbError.code);

console.log('\n=== Test 2: Error Handling and Logging ===');

const originalError = new Error('Test error');
const handledError = errorHandler.handle(originalError, 'test-context', { userId: '123' });
console.log('Handled Error Type:', handledError.constructor.name);
console.log('Has context:', !!handledError.details.context);
console.log('Has metadata:', !!handledError.details.userId);

console.log('\n=== Test 3: Error Tracking ===');

// Generate some errors for tracking
for (let i = 0; i < 3; i++) {
  errorHandler.handle(new NetworkError('Network issue'), 'test');
}

const stats = errorHandler.getErrorStats();
console.log('Error Stats:', JSON.stringify(stats, null, 2));

console.log('\n=== Test 4: Retry Logic ===');

const networkErr = new NetworkError('Connection failed');
const configErr = new ConfigurationError('Config missing');

console.log('Network Error Retryable:', ErrorHandler.isRetryable(networkErr));
console.log('Config Error Retryable:', ErrorHandler.isRetryable(configErr));

const delay1 = ErrorHandler.getRetryDelay(networkErr, 1);
const delay2 = ErrorHandler.getRetryDelay(networkErr, 2);
console.log('Retry Delays:', { attempt1: delay1, attempt2: delay2 });

console.log('\n=== Test 5: Alert System ===');

let alertTriggered = false;
errorHandler.registerAlertCallback('DATABASE_ERROR', (alertData) => {
  console.log('ALERT TRIGGERED:', JSON.stringify(alertData, null, 2));
  alertTriggered = true;
});

// Trigger database errors to exceed threshold (2)
errorHandler.handle(new DatabaseError('DB error 1'), 'test');
errorHandler.handle(new DatabaseError('DB error 2'), 'test');

console.log('Alert was triggered:', alertTriggered);

console.log('\n=== Test 6: Error Serialization ===');

const testError = new ScraperError('Test message', 'TEST_CODE', { key: 'value' });
const serialized = testError.toJSON();
console.log('Serialized Error:', JSON.stringify(serialized, null, 2));

console.log('\n=== All Tests Completed Successfully! ===');
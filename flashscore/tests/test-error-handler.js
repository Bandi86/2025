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

describe('ErrorHandler', () => {
  let errorHandler;
  let mockLogger;

  beforeEach(() => {
    // Mock logger
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };
    
    errorHandler = new ErrorHandler(mockLogger);
  });

  describe('Error Creation and Classification', () => {
    test('should create NetworkError for timeout errors', () => {
      const error = errorHandler.createError('Connection timeout occurred', 'scraping');
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.details.context).toBe('scraping');
    });

    test('should create RateLimitError for rate limit errors', () => {
      const error = errorHandler.createError('Rate limit exceeded - 429', 'api-request');
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
    });

    test('should create ParsingError for parsing errors', () => {
      const error = errorHandler.createError('Selector not found on page', 'data-extraction');
      expect(error).toBeInstanceOf(ParsingError);
      expect(error.code).toBe('PARSING_ERROR');
    });

    test('should create DatabaseError for database errors', () => {
      const error = errorHandler.createError('SQLite database locked', 'data-storage');
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.code).toBe('DATABASE_ERROR');
    });

    test('should create ValidationError for validation errors', () => {
      const error = errorHandler.createError('Invalid data format', 'data-validation');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    test('should create QueueError for queue errors', () => {
      const error = errorHandler.createError('Job failed in queue', 'task-processing');
      expect(error).toBeInstanceOf(QueueError);
      expect(error.code).toBe('QUEUE_ERROR');
    });

    test('should create ConfigurationError for config errors', () => {
      const error = errorHandler.createError('Missing required config', 'initialization');
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.code).toBe('CONFIGURATION_ERROR');
    });

    test('should create ScraperError for unknown errors', () => {
      const error = errorHandler.createError('Unknown error occurred', 'general');
      expect(error).toBeInstanceOf(ScraperError);
      expect(error.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('Error Handling and Logging', () => {
    test('should handle error with comprehensive logging', () => {
      const originalError = new Error('Test error');
      const handledError = errorHandler.handle(originalError, 'test-context', { userId: '123' });

      expect(handledError).toBeInstanceOf(ScraperError);
      expect(handledError.details.context).toBe('test-context');
      expect(handledError.details.userId).toBe('123');
      expect(handledError.details.handledAt).toBeDefined();
      expect(handledError.details.processId).toBe(process.pid);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should log critical errors with error level', () => {
      const dbError = new DatabaseError('Database connection failed');
      errorHandler.handle(dbError, 'database-operation');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Critical error occurred',
        expect.objectContaining({
          errorCode: 'DATABASE_ERROR',
          errorName: 'DatabaseError'
        })
      );
    });

    test('should log network errors with warn level', () => {
      const networkError = new NetworkError('Connection timeout');
      errorHandler.handle(networkError, 'network-request');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Network/Rate limit error occurred',
        expect.objectContaining({
          errorCode: 'NETWORK_ERROR',
          errorName: 'NetworkError'
        })
      );
    });
  });

  describe('Error Tracking and Alerting', () => {
    test('should track error occurrences', () => {
      const error = new NetworkError('Connection failed');
      
      errorHandler.handle(error, 'test');
      errorHandler.handle(error, 'test');
      errorHandler.handle(error, 'test');

      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType.NETWORK_ERROR).toBe(3);
    });

    test('should trigger alert when threshold is exceeded', () => {
      const error = new DatabaseError('DB error');
      const alertCallback = jest.fn();
      
      errorHandler.registerAlertCallback('DATABASE_ERROR', alertCallback);
      
      // Trigger enough errors to exceed threshold (2 for DATABASE_ERROR)
      errorHandler.handle(error, 'test');
      errorHandler.handle(error, 'test');

      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'DATABASE_ERROR',
          currentCount: 2,
          threshold: 2,
          severity: 'CRITICAL'
        })
      );
    });

    test('should provide error statistics', () => {
      const networkError = new NetworkError('Network issue');
      const parsingError = new ParsingError('Parse issue');
      
      errorHandler.handle(networkError, 'test');
      errorHandler.handle(networkError, 'test');
      errorHandler.handle(parsingError, 'test');

      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType.NETWORK_ERROR).toBe(2);
      expect(stats.errorsByType.PARSING_ERROR).toBe(1);
      expect(stats.lastHourErrors).toBe(3);
    });
  });

  describe('Retry Logic', () => {
    test('should identify retryable errors', () => {
      const networkError = new NetworkError('Connection failed');
      const rateLimitError = new RateLimitError('Rate limited');
      const configError = new ConfigurationError('Config missing');

      expect(ErrorHandler.isRetryable(networkError)).toBe(true);
      expect(ErrorHandler.isRetryable(rateLimitError)).toBe(true);
      expect(ErrorHandler.isRetryable(configError)).toBe(false);
    });

    test('should calculate retry delays with exponential backoff', () => {
      const networkError = new NetworkError('Connection failed');
      
      const delay1 = ErrorHandler.getRetryDelay(networkError, 1);
      const delay2 = ErrorHandler.getRetryDelay(networkError, 2);
      const delay3 = ErrorHandler.getRetryDelay(networkError, 3);

      expect(delay1).toBeGreaterThan(500);
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
      expect(delay3).toBeLessThanOrEqual(30000); // Max delay
    });

    test('should apply minimum delay for rate limit errors', () => {
      const rateLimitError = new RateLimitError('Rate limited');
      
      const delay = ErrorHandler.getRetryDelay(rateLimitError, 1);
      expect(delay).toBeGreaterThanOrEqual(5000); // Minimum 5 seconds
    });
  });

  describe('Alert Severity', () => {
    test('should assign correct severity levels', () => {
      expect(errorHandler.getAlertSeverity('DATABASE_ERROR')).toBe('CRITICAL');
      expect(errorHandler.getAlertSeverity('CONFIGURATION_ERROR')).toBe('CRITICAL');
      expect(errorHandler.getAlertSeverity('NETWORK_ERROR')).toBe('HIGH');
      expect(errorHandler.getAlertSeverity('RATE_LIMIT_ERROR')).toBe('HIGH');
      expect(errorHandler.getAlertSeverity('PARSING_ERROR')).toBe('MEDIUM');
      expect(errorHandler.getAlertSeverity('UNKNOWN_ERROR')).toBe('MEDIUM');
    });
  });

  describe('Error Detection Helpers', () => {
    test('should detect timeout errors correctly', () => {
      expect(errorHandler.isTimeoutError(null, 'Connection timeout')).toBe(true);
      expect(errorHandler.isTimeoutError({ code: 'ETIMEDOUT' }, 'Error')).toBe(true);
      expect(errorHandler.isTimeoutError(null, 'Normal error')).toBe(false);
    });

    test('should detect rate limit errors correctly', () => {
      expect(errorHandler.isRateLimitError(null, 'Rate limit exceeded')).toBe(true);
      expect(errorHandler.isRateLimitError({ status: 429 }, 'Error')).toBe(true);
      expect(errorHandler.isRateLimitError(null, 'Normal error')).toBe(false);
    });

    test('should detect connection errors correctly', () => {
      expect(errorHandler.isConnectionError(null, 'Connection refused')).toBe(true);
      expect(errorHandler.isConnectionError({ code: 'ECONNRESET' }, 'Error')).toBe(true);
      expect(errorHandler.isConnectionError(null, 'Normal error')).toBe(false);
    });
  });
});

describe('Custom Error Classes', () => {
  test('should create ScraperError with proper structure', () => {
    const error = new ScraperError('Test message', 'TEST_CODE', { key: 'value' });
    
    expect(error.name).toBe('ScraperError');
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details.key).toBe('value');
    expect(error.timestamp).toBeDefined();
  });

  test('should serialize error to JSON', () => {
    const error = new ScraperError('Test message', 'TEST_CODE', { key: 'value' });
    const json = error.toJSON();
    
    expect(json.name).toBe('ScraperError');
    expect(json.message).toBe('Test message');
    expect(json.code).toBe('TEST_CODE');
    expect(json.details.key).toBe('value');
    expect(json.timestamp).toBeDefined();
    expect(json.stack).toBeDefined();
  });

  test('should create specific error types with correct codes', () => {
    const networkError = new NetworkError('Network issue');
    const parsingError = new ParsingError('Parse issue');
    const dbError = new DatabaseError('DB issue');
    const rateLimitError = new RateLimitError('Rate limit issue');
    const configError = new ConfigurationError('Config issue');
    const queueError = new QueueError('Queue issue');
    const validationError = new ValidationError('Validation issue');

    expect(networkError.code).toBe('NETWORK_ERROR');
    expect(parsingError.code).toBe('PARSING_ERROR');
    expect(dbError.code).toBe('DATABASE_ERROR');
    expect(rateLimitError.code).toBe('RATE_LIMIT_ERROR');
    expect(configError.code).toBe('CONFIGURATION_ERROR');
    expect(queueError.code).toBe('QUEUE_ERROR');
    expect(validationError.code).toBe('VALIDATION_ERROR');
  });
});
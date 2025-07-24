# Logging System

A comprehensive logging system for the Flashscore scraper built on Winston with structured logging, performance monitoring, and context management.

## Features

- **Structured Logging**: JSON and formatted output with metadata
- **Multiple Transports**: Console, file, and rotating file transports
- **Performance Monitoring**: Built-in timing and memory usage tracking
- **Context Management**: Automatic correlation IDs and request context
- **Log Sanitization**: Automatic removal of sensitive information
- **Configurable Levels**: Debug, Info, Warn, Error levels
- **Child Loggers**: Hierarchical loggers with inherited metadata

## Quick Start

```typescript
import { getDefaultLogger, createLogger } from './core/logging/index.js';

// Get the default logger
const logger = getDefaultLogger();

// Basic logging
logger.info('Application started', { version: '1.0.0' });
logger.error('An error occurred', error, { operation: 'scraping' });

// Create named loggers
const scrapingLogger = createLogger('scraping-service');
scrapingLogger.debug('Processing matches', { count: 25 });
```

## Configuration

The logging system can be configured through environment variables:

```bash
# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Log format (json for structured logging)
LOG_FORMAT=json

# Log directory (for file transports)
LOG_DIR=logs

# Log file name
LOG_FILE=app.log

# Sensitive fields to mask (comma-separated)
LOG_SENSITIVE_FIELDS=password,token,secret
```

## Performance Logging

```typescript
import { PerformanceLogger } from './core/logging/index.js';

const logger = getDefaultLogger();
const perfLogger = new PerformanceLogger(logger);

// Time operations
const timer = perfLogger.startTimer('data-scraping');
// ... perform operation
perfLogger.endTimer(timer);

// Log memory usage
perfLogger.logMemoryUsage('after-processing');

// Log system metrics
perfLogger.logSystemMetrics();
```

## Context Management

```typescript
import { logContextManager } from './core/logging/utils/log-context.js';

// Run with context
await logContextManager.runAsync({
  correlationId: 'req-123',
  operation: 'scrape-matches',
  userId: 'user-456'
}, async () => {
  logger.info('Processing request'); // Automatically includes context
});
```

## Child Loggers

```typescript
// Create child logger with additional metadata
const childLogger = logger.child({
  component: 'browser-manager',
  sessionId: 'session-123'
});

childLogger.info('Browser initialized'); // Includes parent + child metadata
```

## Transport Configuration

### Console Transport
```typescript
{
  type: TransportType.CONSOLE,
  level: LogLevel.INFO,
  options: {
    colorize: true,
    timestamp: true
  }
}
```

### File Transport
```typescript
{
  type: TransportType.FILE,
  level: LogLevel.INFO,
  options: {
    filename: 'logs/app.log',
    maxsize: 10485760, // 10MB
    maxFiles: 5
  }
}
```

### Rotating File Transport
```typescript
{
  type: TransportType.ROTATING_FILE,
  level: LogLevel.INFO,
  options: {
    filename: 'logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  }
}
```

## Log Formats

### Default Format
```
2024-01-15 10:30:45 [INFO] [scraping-service] Processing matches (operation: scrape-matches, duration: 1500ms)
```

### JSON Format
```json
{
  "@timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Processing matches",
  "service": "flashscore-scraper",
  "logger": "scraping-service",
  "operation": "scrape-matches",
  "duration": 1500,
  "correlationId": "req-123"
}
```

### Structured Format
```json
{
  "@timestamp": "2024-01-15T10:30:45.123Z",
  "@version": "1",
  "level": "info",
  "message": "Processing matches",
  "service": "flashscore-scraper",
  "version": "1.0.0",
  "environment": "production",
  "hostname": "server-01",
  "pid": 12345,
  "logger": "scraping-service",
  "correlationId": "req-123"
}
```

## Security Features

### Automatic Sanitization
The logging system automatically sanitizes sensitive information:

- Passwords, tokens, API keys
- Authorization headers
- Credit card numbers
- Custom sensitive fields

### Configurable Sanitization
```typescript
import { defaultSanitizer } from './core/logging/utils/log-sanitizer.js';

// Add custom sensitive field
defaultSanitizer.addSensitiveField('custom-secret');

// Remove sensitive field
defaultSanitizer.removeSensitiveField('password');
```

## Integration Examples

### Scraping Service Integration
```typescript
export class MatchScrapingService {
  private logger = createLogger('match-scraping');
  private perfLogger = new PerformanceLogger(this.logger);

  async scrapeMatches(url: string): Promise<MatchData[]> {
    const timer = this.perfLogger.startTimer('scrape-matches', { url });
    
    try {
      this.logger.info('Starting match scraping', { url });
      
      const matches = await this.extractMatches(url);
      
      this.perfLogger.endTimer(timer);
      this.logger.info('Match scraping completed', { 
        matchCount: matches.length 
      });
      
      return matches;
    } catch (error) {
      this.perfLogger.endTimer(timer);
      this.logger.error('Match scraping failed', error, { url });
      throw error;
    }
  }
}
```

### CLI Integration
```typescript
export class CLI {
  private logger = getDefaultLogger();

  async run(args: string[]): Promise<void> {
    const correlationId = correlationIdGenerator.generate();
    
    await logContextManager.runAsync({
      correlationId,
      operation: 'cli-run',
      args: args.join(' ')
    }, async () => {
      this.logger.info('CLI operation started', { args });
      
      try {
        await this.processCommand(args);
        this.logger.info('CLI operation completed');
      } catch (error) {
        this.logger.error('CLI operation failed', error);
        process.exit(1);
      }
    });
  }
}
```

## Best Practices

1. **Use Appropriate Log Levels**
   - `DEBUG`: Detailed information for debugging
   - `INFO`: General application flow
   - `WARN`: Unexpected but recoverable situations
   - `ERROR`: Error conditions that need attention

2. **Include Relevant Context**
   ```typescript
   logger.info('Processing league', {
     country: 'england',
     league: 'premier-league',
     season: '2023-24'
   });
   ```

3. **Use Performance Logging for Operations**
   ```typescript
   const timer = perfLogger.startTimer('browser-navigation');
   await page.goto(url);
   perfLogger.endTimer(timer);
   ```

4. **Create Named Loggers for Components**
   ```typescript
   const browserLogger = createLogger('browser-manager');
   const cacheLogger = createLogger('cache-service');
   ```

5. **Use Context for Request Tracking**
   ```typescript
   await logContextManager.runAsync({
     correlationId: generateId(),
     operation: 'scrape-session'
   }, async () => {
     // All logs in this scope include the context
   });
   ```

## Testing

Run the logging tests:
```bash
npm test -- src/core/logging
```

Run the demo:
```bash
npm run start -- src/core/logging/demo.ts
```

## Architecture

The logging system follows a layered architecture:

- **Interfaces**: TypeScript interfaces for all components
- **Core**: Logger and LoggerFactory implementations
- **Transports**: Console, file, and rotating file transports
- **Formatters**: Default, JSON, and structured formatters
- **Utils**: Context management, sanitization, correlation IDs
- **Performance**: Performance monitoring and metrics

This design ensures modularity, testability, and extensibility while providing a rich set of logging features for the Flashscore scraper application.
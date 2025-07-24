/**
 * Example of how to integrate the logging system throughout the application
 */

import { getDefaultLogger, createLogger } from './default-logger.js';
import { PerformanceLogger } from './performance-logger.js';
import { logContextManager, withAsyncLogContext } from './utils/log-context.js';
import { correlationIdGenerator } from './utils/correlation-id.js';
import { LogLevel } from '../../types/core.js';

// Example service class showing logging integration
export class ExampleScrapingService {
  private logger = createLogger('scraping-service');
  private performanceLogger = new PerformanceLogger(this.logger);

  async scrapeMatches(country: string, league: string): Promise<any[]> {
    const correlationId = correlationIdGenerator.generate();
    
    // Update context with operation details
    logContextManager.updateContext({
      correlationId,
      operation: 'scrapeMatches',
      country,
      league
    });

    this.logger.info('Starting match scraping', {
      country,
      league,
      correlationId
    });

    const timer = this.performanceLogger.startTimer('scrapeMatches', {
      country,
      league
    });

    try {
      // Simulate scraping work
      const matches = await this.performScrapingWork(country, league);
      
      this.performanceLogger.endTimer(timer);
      
      this.logger.info('Match scraping completed successfully', {
        matchCount: matches.length,
        country,
        league
      });

      return matches;
    } catch (error) {
      this.performanceLogger.endTimer(timer);
      
      this.logger.error('Match scraping failed', error as Error, {
        country,
        league,
        correlationId
      });
      
      throw error;
    }
  }

  private async performScrapingWork(country: string, league: string): Promise<any[]> {
    const childLogger = this.logger.child({ 
      component: 'scraper-worker',
      country,
      league 
    });

    childLogger.debug('Initializing browser');
    
    // Simulate browser operations
    await this.simulateDelay(1000);
    
    childLogger.debug('Navigating to league page');
    
    // Simulate navigation
    await this.simulateDelay(2000);
    
    childLogger.info('Extracting match data');
    
    // Simulate data extraction
    await this.simulateDelay(3000);
    
    // Log memory usage periodically
    this.performanceLogger.logMemoryUsage('data-extraction');
    
    const matches = [
      { id: '1', home: 'Team A', away: 'Team B' },
      { id: '2', home: 'Team C', away: 'Team D' }
    ];
    
    childLogger.debug('Match data extracted', { matchCount: matches.length });
    
    return matches;
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Example CLI integration
export class ExampleCLI {
  private logger = getDefaultLogger();

  async run(args: string[]): Promise<void> {
    const correlationId = correlationIdGenerator.generate();
    
    // Set up logging context for the entire CLI operation
    const context = {
      correlationId,
      operation: 'cli-run',
      args: args.join(' '),
      startTime: new Date()
    };

    await logContextManager.runAsync(context, async () => {
      this.logger.info('CLI operation started', { args });

      try {
        await this.processCommand(args);
        this.logger.info('CLI operation completed successfully');
      } catch (error) {
        this.logger.error('CLI operation failed', error as Error);
        process.exit(1);
      }
    });
  }

  private async processCommand(args: string[]): Promise<void> {
    const command = args[0];
    
    switch (command) {
      case 'scrape':
        await this.handleScrapeCommand(args.slice(1));
        break;
      case 'export':
        await this.handleExportCommand(args.slice(1));
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  private async handleScrapeCommand(args: string[]): Promise<void> {
    this.logger.info('Processing scrape command', { args });
    
    const service = new ExampleScrapingService();
    const matches = await service.scrapeMatches('england', 'premier-league');
    
    this.logger.info('Scrape command completed', { 
      matchCount: matches.length 
    });
  }

  private async handleExportCommand(args: string[]): Promise<void> {
    this.logger.info('Processing export command', { args });
    
    // Simulate export work
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.logger.info('Export command completed');
  }
}

// Example error handling with logging
export class ExampleErrorHandler {
  private logger = createLogger('error-handler');

  handleError(error: Error, context?: any): void {
    const errorContext = {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      context
    };

    if (error.name === 'NetworkError') {
      this.logger.warn('Network error occurred', errorContext);
    } else if (error.name === 'ValidationError') {
      this.logger.error('Validation error occurred', error, errorContext);
    } else {
      this.logger.error('Unexpected error occurred', error, errorContext);
    }
  }
}

// Example configuration-based logging setup
export function setupApplicationLogging(): void {
  const logger = getDefaultLogger();
  
  // Log application startup
  logger.info('Application starting', {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  });

  // Set up global error handlers with logging
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error, {
      type: 'uncaughtException',
      fatal: true
    });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', reason as Error, {
      type: 'unhandledRejection',
      promise: promise.toString()
    });
  });

  // Set up graceful shutdown with logging
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    // Perform cleanup
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
    // Perform cleanup
    process.exit(0);
  });
}

// Example usage in different log levels
export function demonstrateLogLevels(): void {
  const logger = createLogger('demo');

  // Debug level - detailed information for debugging
  logger.debug('Detailed debug information', {
    selector: '.match-row',
    elementCount: 25,
    processingTime: 150
  });

  // Info level - general information about application flow
  logger.info('Processing league data', {
    league: 'Premier League',
    season: '2023-24',
    matchCount: 380
  });

  // Warn level - something unexpected but not necessarily an error
  logger.warn('Selector not found, using fallback', {
    originalSelector: '.new-selector',
    fallbackSelector: '.old-selector',
    url: 'https://example.com/matches'
  });

  // Error level - errors that need attention
  logger.error('Failed to scrape match data', new Error('Network timeout'), {
    url: 'https://example.com/match/123',
    retryAttempt: 3,
    timeout: 30000
  });
}

// Example performance monitoring
export async function demonstratePerformanceLogging(): Promise<void> {
  const logger = createLogger('performance-demo');
  const perfLogger = new PerformanceLogger(logger);

  // Monitor overall operation
  const overallTimer = perfLogger.startTimer('full-scraping-session');

  // Monitor individual operations
  const browserTimer = perfLogger.startTimer('browser-initialization');
  await new Promise(resolve => setTimeout(resolve, 1000));
  perfLogger.endTimer(browserTimer);

  const scrapingTimer = perfLogger.startTimer('data-scraping');
  await new Promise(resolve => setTimeout(resolve, 3000));
  perfLogger.endTimer(scrapingTimer);

  // Log memory usage at key points
  perfLogger.logMemoryUsage('after-data-scraping');

  // Log system metrics
  perfLogger.logSystemMetrics();

  perfLogger.endTimer(overallTimer);
}
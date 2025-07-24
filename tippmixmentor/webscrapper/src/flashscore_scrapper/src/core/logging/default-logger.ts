/**
 * Default logger configuration and factory
 */

import * as path from 'path';
import { LogLevel } from '../../types/core.js';
import { LoggerFactory } from './logger-factory.js';
import { ILogger, LoggerConfig, TransportType } from './interfaces.js';
import { logContextManager } from './utils/log-context.js';
import { defaultSanitizer } from './utils/log-sanitizer.js';

// Global logger factory instance
let globalLoggerFactory: LoggerFactory | null = null;

/**
 * Get or create the default logger factory
 */
function getLoggerFactory(): LoggerFactory {
  if (!globalLoggerFactory) {
    const defaultConfig: Partial<LoggerConfig> = {
      level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
      format: {
        timestamp: true,
        level: true,
        message: true,
        meta: true,
        colorize: process.env.NODE_ENV !== 'production',
        json: process.env.LOG_FORMAT === 'json',
        prettyPrint: process.env.NODE_ENV !== 'production'
      },
      transports: createDefaultTransports(),
      exitOnError: false,
      handleExceptions: true,
      handleRejections: true,
      defaultMeta: {
        service: 'flashscore-scraper',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    globalLoggerFactory = new LoggerFactory(defaultConfig);
  }

  return globalLoggerFactory;
}

/**
 * Create default transports based on environment
 */
function createDefaultTransports() {
  const transports = [];

  // Always add console transport
  transports.push({
    type: TransportType.CONSOLE,
    level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
    options: {
      colorize: process.env.NODE_ENV !== 'production',
      timestamp: true
    }
  });

  // Add file transport in production or if LOG_FILE is set
  if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE) {
    const logDir = process.env.LOG_DIR || 'logs';
    const logFile = process.env.LOG_FILE || 'app.log';
    
    transports.push({
      type: TransportType.ROTATING_FILE,
      level: LogLevel.INFO,
      options: {
        filename: path.join(logDir, logFile.replace('.log', '-%DATE%.log')),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true
      }
    });

    // Add error-specific log file
    transports.push({
      type: TransportType.ROTATING_FILE,
      level: LogLevel.ERROR,
      options: {
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true
      }
    });
  }

  return transports;
}

/**
 * Get the default logger instance
 */
export function getDefaultLogger(): ILogger {
  const factory = getLoggerFactory();
  let logger = factory.getLogger('default');
  
  if (!logger) {
    logger = factory.createLogger('default');
  }

  return createContextAwareLogger(logger);
}

/**
 * Create a named logger instance
 */
export function createLogger(name: string, config?: Partial<LoggerConfig>): ILogger {
  const factory = getLoggerFactory();
  const logger = factory.createLogger(name, config as LoggerConfig);
  return createContextAwareLogger(logger);
}

/**
 * Create a context-aware logger that automatically includes context metadata
 */
function createContextAwareLogger(logger: ILogger): ILogger {
  return {
    debug: (message: string, meta = {}) => {
      const contextMeta = logContextManager.getContextMetadata();
      const sanitizedMeta = defaultSanitizer.sanitize({ ...contextMeta, ...meta });
      logger.debug(defaultSanitizer.sanitizeMessage(message), sanitizedMeta);
    },

    info: (message: string, meta = {}) => {
      const contextMeta = logContextManager.getContextMetadata();
      const sanitizedMeta = defaultSanitizer.sanitize({ ...contextMeta, ...meta });
      logger.info(defaultSanitizer.sanitizeMessage(message), sanitizedMeta);
    },

    warn: (message: string, meta = {}) => {
      const contextMeta = logContextManager.getContextMetadata();
      const sanitizedMeta = defaultSanitizer.sanitize({ ...contextMeta, ...meta });
      logger.warn(defaultSanitizer.sanitizeMessage(message), sanitizedMeta);
    },

    error: (message: string, error?: Error, meta = {}) => {
      const contextMeta = logContextManager.getContextMetadata();
      const sanitizedMeta = defaultSanitizer.sanitize({ ...contextMeta, ...meta });
      logger.error(defaultSanitizer.sanitizeMessage(message), error, sanitizedMeta);
    },

    log: (level: LogLevel, message: string, meta = {}) => {
      const contextMeta = logContextManager.getContextMetadata();
      const sanitizedMeta = defaultSanitizer.sanitize({ ...contextMeta, ...meta });
      logger.log(level, defaultSanitizer.sanitizeMessage(message), sanitizedMeta);
    },

    child: (defaultMeta) => {
      const childLogger = logger.child(defaultMeta);
      return createContextAwareLogger(childLogger);
    },

    setLevel: (level: LogLevel) => logger.setLevel(level),
    getLevel: () => logger.getLevel()
  };
}

/**
 * Set global log level for all loggers
 */
export function setGlobalLogLevel(level: LogLevel): void {
  const factory = getLoggerFactory();
  factory.setGlobalLevel(level);
}

/**
 * Shutdown all loggers gracefully
 */
export async function shutdownLogging(): Promise<void> {
  if (globalLoggerFactory) {
    await globalLoggerFactory.shutdown();
    globalLoggerFactory = null;
  }
}

/**
 * Configure logging from environment variables
 */
export function configureLoggingFromEnv(): void {
  // Set log level from environment
  const logLevel = process.env.LOG_LEVEL as LogLevel;
  if (logLevel && Object.values(LogLevel).includes(logLevel)) {
    setGlobalLogLevel(logLevel);
  }

  // Configure sanitizer
  const sensitiveFields = process.env.LOG_SENSITIVE_FIELDS;
  if (sensitiveFields) {
    const fields = sensitiveFields.split(',').map(f => f.trim());
    fields.forEach(field => defaultSanitizer.addSensitiveField(field));
  }
}

// Auto-configure on module load
configureLoggingFromEnv();
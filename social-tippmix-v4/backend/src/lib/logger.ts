import winston from 'winston';
import path from 'path';

// Log levels in order of priority
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors for console output
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    let log = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// File format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Transports array
const transports: winston.transport[] = [
  // Console transport for development
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: logFormat,
  }),

  // File transport for errors
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  format: fileFormat,
  transports,
  // Don't exit on error
  exitOnError: false,
});

// Create stream for HTTP logging (Morgan)
logger.stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
} as any;

export default logger;

// Helper functions for structured logging
export const logError = (message: string, error?: Error | any, meta?: any) => {
  logger.error(message, {
    error: error?.message || error,
    stack: error?.stack,
    ...meta,
  });
};

export const logWarning = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logHttp = (message: string, meta?: any) => {
  logger.http(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Request logging helper
export const logRequest = (req: any, res: any, meta?: any) => {
  logger.http('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    statusCode: res.statusCode,
    responseTime: res.getHeader('X-Response-Time'),
    ...meta,
  });
};

// Database operation logging
export const logDatabase = (operation: string, table: string, meta?: any) => {
  logger.debug('Database Operation', {
    operation,
    table,
    ...meta,
  });
};

// Authentication logging
export const logAuth = (action: string, userId?: string, meta?: any) => {
  logger.info('Authentication', {
    action,
    userId,
    ...meta,
  });
};

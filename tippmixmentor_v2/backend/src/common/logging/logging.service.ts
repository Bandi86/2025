import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LoggingService implements LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    this.initializeLogger();
  }

  private initializeLogger() {
    const logLevel = this.configService.get('LOG_LEVEL', 'info');
    const environment = this.configService.get('NODE_ENV', 'development');

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          message,
          stack,
          ...meta,
        });
      })
    );

    // Define transports
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ];

    // Add file transport for production
    if (environment === 'production') {
      transports.push(
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat,
        }),
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: logFormat,
        })
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  log(message: string, context?: string, meta?: any) {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string, meta?: any) {
    this.logger.error(message, { trace, context, ...meta });
  }

  warn(message: string, context?: string, meta?: any) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: any) {
    this.logger.debug(message, { context, ...meta });
  }

  verbose(message: string, context?: string, meta?: any) {
    this.logger.verbose(message, { context, ...meta });
  }

  // Custom methods for API logging
  logRequest(method: string, url: string, ip: string, userAgent: string, userId?: string) {
    this.log('API Request', 'API', {
      method,
      url,
      ip,
      userAgent,
      userId,
      type: 'request',
    });
  }

  logResponse(method: string, url: string, statusCode: number, responseTime: number, userId?: string) {
    this.log('API Response', 'API', {
      method,
      url,
      statusCode,
      responseTime,
      userId,
      type: 'response',
    });
  }

  logError(error: Error, context?: string, meta?: any) {
    this.error(error.message, error.stack, context, meta);
  }

  logPerformance(operation: string, duration: number, context?: string, meta?: any) {
    this.log('Performance Metric', 'PERFORMANCE', {
      operation,
      duration,
      context,
      ...meta,
    });
  }
} 
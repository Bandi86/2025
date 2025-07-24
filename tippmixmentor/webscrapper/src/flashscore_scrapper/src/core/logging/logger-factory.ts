/**
 * Logger factory for creating and managing logger instances
 */

import * as winston from 'winston';
import { LogLevel } from '../../types/core.js';
import type { ILoggerFactory, ILogger, LoggerConfig } from './interfaces.js';
import { Logger } from './logger.js';
import { createWinstonTransports } from './transports/winston-transport-factory.js';
import { createDefaultFormat } from './formatters/default-formatter.js';

export class LoggerFactory implements ILoggerFactory {
  private loggers: Map<string, Logger> = new Map();
  private globalLevel: LogLevel = LogLevel.INFO;
  private defaultConfig: Partial<LoggerConfig>;

  constructor(defaultConfig?: Partial<LoggerConfig>) {
    this.defaultConfig = {
      level: LogLevel.INFO,
      format: {
        timestamp: true,
        level: true,
        message: true,
        meta: true,
        colorize: true,
        json: false,
        prettyPrint: true
      },
      transports: [
        {
          type: 'console' as any,
          level: LogLevel.INFO,
          options: {}
        }
      ],
      exitOnError: false,
      handleExceptions: true,
      handleRejections: true,
      ...defaultConfig
    };
  }

  createLogger(name: string, config?: LoggerConfig): ILogger {
    const finalConfig: LoggerConfig = {
      ...this.defaultConfig,
      ...config,
      level: config?.level || this.globalLevel
    } as LoggerConfig;

    // Create Winston logger
    const winstonLogger = winston.createLogger({
      level: finalConfig.level,
      format: createDefaultFormat(finalConfig.format),
      transports: createWinstonTransports(finalConfig.transports),
      exitOnError: finalConfig.exitOnError,
      handleExceptions: finalConfig.handleExceptions,
      handleRejections: finalConfig.handleRejections,
      defaultMeta: {
        service: 'flashscore-scraper',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        hostname: require('os').hostname(),
        pid: process.pid,
        ...finalConfig.defaultMeta
      }
    });

    const logger = new Logger(name, finalConfig, winstonLogger);
    this.loggers.set(name, logger);

    return logger;
  }

  getLogger(name: string): ILogger | null {
    return this.loggers.get(name) || null;
  }

  setGlobalLevel(level: LogLevel): void {
    this.globalLevel = level;
    
    // Update all existing loggers
    this.loggers.forEach((logger) => {
      logger.setLevel(level);
    });
  }

  async shutdown(): Promise<void> {
    const shutdownPromises: Promise<void>[] = [];

    this.loggers.forEach((logger) => {
      const winstonLogger = logger.getWinstonLogger();
      
      shutdownPromises.push(
        new Promise<void>((resolve) => {
          winstonLogger.end(() => {
            resolve();
          });
        })
      );
    });

    await Promise.all(shutdownPromises);
    this.loggers.clear();
  }

  /**
   * Get all registered logger names
   */
  getLoggerNames(): string[] {
    return Array.from(this.loggers.keys());
  }

  /**
   * Remove a logger from the factory
   */
  removeLogger(name: string): boolean {
    const logger = this.loggers.get(name);
    if (logger) {
      const winstonLogger = logger.getWinstonLogger();
      winstonLogger.end();
      return this.loggers.delete(name);
    }
    return false;
  }
}
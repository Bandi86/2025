/**
 * Winston-based logger implementation
 */

import * as winston from 'winston';
import { LogLevel } from '../../types/core.js';
import type { ILogger, LogMetadata, LoggerConfig } from './interfaces.js';

export class Logger implements ILogger {
  private winstonLogger: winston.Logger;
  private name: string;
  private defaultMeta: LogMetadata;

  constructor(name: string, config: LoggerConfig, winstonLogger: winston.Logger) {
    this.name = name;
    this.winstonLogger = winstonLogger;
    this.defaultMeta = config.defaultMeta || {};
  }

  debug(message: string, meta: LogMetadata = {}): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta: LogMetadata = {}): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta: LogMetadata = {}): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error, meta: LogMetadata = {}): void {
    const errorMeta = error ? {
      ...meta,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : meta;
    
    this.log(LogLevel.ERROR, message, errorMeta);
  }

  log(level: LogLevel, message: string, meta: LogMetadata = {}): void {
    const combinedMeta = {
      ...this.defaultMeta,
      ...meta,
      logger: this.name,
      timestamp: new Date().toISOString()
    };

    this.winstonLogger.log(level, message, combinedMeta);
  }

  child(defaultMeta: LogMetadata): ILogger {
    const childConfig: LoggerConfig = {
      level: this.getLevel(),
      format: {} as any, // Will be handled by winston logger
      transports: [],
      defaultMeta: { ...this.defaultMeta, ...defaultMeta },
      exitOnError: false,
      handleExceptions: false,
      handleRejections: false
    };

    return new Logger(`${this.name}.child`, childConfig, this.winstonLogger);
  }

  setLevel(level: LogLevel): void {
    this.winstonLogger.level = level;
  }

  getLevel(): LogLevel {
    return this.winstonLogger.level as LogLevel;
  }

  /**
   * Get the underlying Winston logger instance
   */
  getWinstonLogger(): winston.Logger {
    return this.winstonLogger;
  }

  /**
   * Get the logger name
   */
  getName(): string {
    return this.name;
  }
}
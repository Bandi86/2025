/**
 * Console transport implementation using Winston
 */

import * as winston from 'winston';
import { LogLevel } from '../../../types/core.js';

export interface ConsoleTransportOptions {
  level?: LogLevel;
  colorize?: boolean;
  timestamp?: boolean;
  handleExceptions?: boolean;
  handleRejections?: boolean;
}

export function createConsoleTransport(options: ConsoleTransportOptions = {}): winston.transports.ConsoleTransportInstance {
  return new winston.transports.Console({
    level: options.level || LogLevel.INFO,
    handleExceptions: options.handleExceptions || false,
    handleRejections: options.handleRejections || false,
    format: winston.format.combine(
      winston.format.colorize({ all: options.colorize !== false }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length > 0 ? 
          `\n${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      })
    )
  });
}
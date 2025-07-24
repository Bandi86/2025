/**
 * Factory for creating Winston transports based on configuration
 */

import * as winston from 'winston';
import { TransportConfig, TransportType } from '../interfaces.js';
import { createConsoleTransport } from './console-transport.js';
import { createFileTransport } from './file-transport.js';
import { createRotatingFileTransport } from './rotating-file-transport.js';

export function createWinstonTransports(configs: TransportConfig[]): winston.transport[] {
  return configs.map(config => createWinstonTransport(config));
}

export function createWinstonTransport(config: TransportConfig): winston.transport {
  switch (config.type) {
    case TransportType.CONSOLE:
      return createConsoleTransport(config.options);

    case TransportType.FILE:
      return createFileTransport({
        filename: config.options.filename || 'logs/app.log',
        ...config.options,
        level: config.level
      });

    case TransportType.ROTATING_FILE:
      return createRotatingFileTransport({
        filename: config.options.filename || 'logs/app-%DATE%.log',
        ...config.options,
        level: config.level
      });

    case TransportType.HTTP:
      return new winston.transports.Http({
        level: config.level,
        ...config.options
      });

    default:
      throw new Error(`Unsupported transport type: ${config.type}`);
  }
}
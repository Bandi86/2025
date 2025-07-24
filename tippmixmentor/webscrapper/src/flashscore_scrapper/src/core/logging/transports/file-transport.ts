/**
 * File transport implementation using Winston
 */

import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { LogLevel } from '../../../types/core.js';

export interface FileTransportOptions {
  level?: LogLevel;
  filename: string;
  maxsize?: number;
  maxFiles?: number;
  tailable?: boolean;
  zippedArchive?: boolean;
  handleExceptions?: boolean;
  handleRejections?: boolean;
  format?: winston.Logform.Format;
}

export function createFileTransport(options: FileTransportOptions): winston.transports.FileTransportInstance {
  // Ensure directory exists
  const dir = path.dirname(options.filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new winston.transports.File({
    level: options.level || LogLevel.INFO,
    filename: options.filename,
    maxsize: options.maxsize || 10 * 1024 * 1024, // 10MB default
    maxFiles: options.maxFiles || 5,
    tailable: options.tailable !== false,
    zippedArchive: options.zippedArchive || false,
    handleExceptions: options.handleExceptions || false,
    handleRejections: options.handleRejections || false,
    format: options.format || winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  });
}
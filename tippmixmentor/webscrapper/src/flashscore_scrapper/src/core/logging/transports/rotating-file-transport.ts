/**
 * Rotating file transport implementation using Winston Daily Rotate File
 */

import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';
import { LogLevel } from '../../../types/core.js';

export interface RotatingFileTransportOptions {
  level?: LogLevel;
  filename: string;
  datePattern?: string;
  maxSize?: string;
  maxFiles?: string | number;
  frequency?: string;
  utc?: boolean;
  extension?: string;
  createSymlink?: boolean;
  symlinkName?: string;
  zippedArchive?: boolean;
  handleExceptions?: boolean;
  handleRejections?: boolean;
  format?: winston.Logform.Format;
}

export function createRotatingFileTransport(options: RotatingFileTransportOptions): any {
  // Ensure directory exists
  const dir = path.dirname(options.filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const transport = new (DailyRotateFile as any)({
    level: options.level || LogLevel.INFO,
    filename: options.filename,
    datePattern: options.datePattern || 'YYYY-MM-DD',
    maxSize: options.maxSize || '20m',
    maxFiles: options.maxFiles || '14d',
    frequency: options.frequency,
    utc: options.utc || false,
    extension: options.extension || '.log',
    createSymlink: options.createSymlink || false,
    symlinkName: options.symlinkName,
    zippedArchive: options.zippedArchive || true,
    handleExceptions: options.handleExceptions || false,
    handleRejections: options.handleRejections || false,
    format: options.format || winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  });

  // Add event listeners for rotation events
  transport.on('rotate', (oldFilename: string, newFilename: string) => {
    console.log(`Log file rotated from ${oldFilename} to ${newFilename}`);
  });

  transport.on('archive', (zipFilename: string) => {
    console.log(`Log file archived: ${zipFilename}`);
  });

  transport.on('logRemoved', (removedFilename: string) => {
    console.log(`Old log file removed: ${removedFilename}`);
  });

  return transport;
}
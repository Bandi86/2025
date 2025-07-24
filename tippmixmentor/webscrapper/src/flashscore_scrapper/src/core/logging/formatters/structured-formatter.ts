/**
 * Structured log formatter for enterprise logging
 */

import * as winston from 'winston';
import * as os from 'os';

export interface StructuredFormatterOptions {
  service?: string;
  version?: string;
  environment?: string;
  includeHostname?: boolean;
  includePid?: boolean;
  includeMemoryUsage?: boolean;
}

export function createStructuredFormat(options: StructuredFormatterOptions = {}): winston.Logform.Format {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      const structured: any = {
        '@timestamp': info.timestamp,
        '@version': '1',
        service: options.service || info.service || 'flashscore-scraper',
        version: options.version || info.version || process.env.npm_package_version || '1.0.0',
        environment: options.environment || info.environment || process.env.NODE_ENV || 'development',
        logger: info.logger || 'default',
        ...info
      };

      // Add system information if requested
      if (options.includeHostname !== false) {
        structured.hostname = os.hostname();
      }

      if (options.includePid !== false) {
        structured.pid = process.pid;
      }

      if (options.includeMemoryUsage) {
        const memUsage = process.memoryUsage();
        structured.memory = {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external
        };
      }

      // Remove Winston-specific fields
      delete structured.splat;
      try {
        delete structured[Symbol.for('message')];
        delete structured[Symbol.for('level')];
      } catch (e) {
        // Ignore symbol deletion errors
      }

      return JSON.stringify(structured);
    })
  );
}
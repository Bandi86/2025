/**
 * Default log formatter using Winston formats
 */

import * as winston from 'winston';
import { LogFormat } from '../interfaces.js';

export function createDefaultFormat(formatConfig: LogFormat): winston.Logform.Format {
  const formats: winston.Logform.Format[] = [];

  // Add timestamp if requested
  if (formatConfig.timestamp) {
    formats.push(winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }));
  }

  // Add errors format to handle Error objects
  formats.push(winston.format.errors({ stack: true }));

  // Add JSON format if requested
  if (formatConfig.json) {
    formats.push(winston.format.json({
      space: formatConfig.prettyPrint ? 2 : 0
    }));
  } else {
    // Custom format for non-JSON output
    formats.push(winston.format.printf(({ timestamp, level, message, service, logger, operation, duration, memoryUsage, ...meta }) => {
      let output = '';
      
      if (timestamp) {
        output += `${timestamp} `;
      }
      
      if (level) {
        output += `[${level.toUpperCase()}] `;
      }
      
      if (service) {
        output += `[${service}] `;
      }
      
      if (logger) {
        output += `[${logger}] `;
      }
      
      output += message;
      
      // Add operation context if available
      if (operation) {
        output += ` (operation: ${operation}`;
        if (duration !== undefined) {
          output += `, duration: ${duration}ms`;
        }
        if (memoryUsage !== undefined) {
          const memUsage = typeof memoryUsage === 'number' ? memoryUsage : 0;
          output += `, memory: ${Math.round(memUsage / 1024 / 1024)}MB`;
        }
        output += ')';
      }
      
      // Add metadata if present and requested
      if (formatConfig.meta && Object.keys(meta).length > 0) {
        if (formatConfig.prettyPrint) {
          output += `\n${JSON.stringify(meta, null, 2)}`;
        } else {
          output += ` ${JSON.stringify(meta)}`;
        }
      }
      
      return output;
    }));
  }

  // Add colorization if requested (should be last for console output)
  if (formatConfig.colorize) {
    formats.push(winston.format.colorize({ all: true }));
  }

  return winston.format.combine(...formats);
}
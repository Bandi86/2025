/**
 * JSON log formatter for structured logging
 */

import * as winston from 'winston';

export interface JsonFormatterOptions {
  space?: number;
  replacer?: (key: string, value: any) => any;
  stable?: boolean;
}

export function createJsonFormat(options: JsonFormatterOptions = {}): winston.Logform.Format {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json({
      space: options.space || 0,
      replacer: options.replacer,
      // stable: options.stable || false // Not supported in current winston version
    })
  );
}

export function createPrettyJsonFormat(): winston.Logform.Format {
  return createJsonFormat({ space: 2 });
}
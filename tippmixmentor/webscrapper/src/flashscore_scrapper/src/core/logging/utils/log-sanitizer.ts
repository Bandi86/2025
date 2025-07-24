/**
 * Log sanitization utilities to remove sensitive information
 */

import { LogMetadata } from '../interfaces.js';

export interface SanitizationOptions {
  sensitiveFields?: string[];
  maskValue?: string;
  maxStringLength?: number;
  maxObjectDepth?: number;
}

const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'credit_card',
  'ssn',
  'social_security',
  'api_key',
  'private_key',
  'access_token',
  'refresh_token'
];

const DEFAULT_OPTIONS: Required<SanitizationOptions> = {
  sensitiveFields: DEFAULT_SENSITIVE_FIELDS,
  maskValue: '[REDACTED]',
  maxStringLength: 1000,
  maxObjectDepth: 10
};

export class LogSanitizer {
  private options: Required<SanitizationOptions>;

  constructor(options: SanitizationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Sanitize log metadata by removing or masking sensitive information
   */
  sanitize(metadata: LogMetadata): LogMetadata {
    return this.sanitizeValue(metadata, 0) as LogMetadata;
  }

  /**
   * Sanitize a message string
   */
  sanitizeMessage(message: string): string {
    let sanitized = message;

    // Mask potential sensitive patterns
    const patterns = [
      /password[=:]\s*[^\s&]+/gi,
      /token[=:]\s*[^\s&]+/gi,
      /key[=:]\s*[^\s&]+/gi,
      /authorization[=:]\s*[^\s&]+/gi,
      /bearer\s+[^\s&]+/gi,
      /api[_-]?key[=:]\s*[^\s&]+/gi
    ];

    patterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, (match) => {
        const parts = match.split(/[=:]/);
        return parts.length > 1 ? `${parts[0]}=${this.options.maskValue}` : this.options.maskValue;
      });
    });

    // Truncate if too long
    if (sanitized.length > this.options.maxStringLength) {
      sanitized = sanitized.substring(0, this.options.maxStringLength) + '...[TRUNCATED]';
    }

    return sanitized;
  }

  /**
   * Recursively sanitize a value
   */
  private sanitizeValue(value: any, depth: number): any {
    // Prevent infinite recursion
    if (depth > this.options.maxObjectDepth) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.truncateString(value);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: this.sanitizeMessage(value.message),
        stack: this.truncateString(value.stack || '')
      };
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item, depth + 1));
    }

    if (typeof value === 'object') {
      const sanitized: any = {};

      for (const [key, val] of Object.entries(value)) {
        if (this.isSensitiveField(key)) {
          sanitized[key] = this.options.maskValue;
        } else {
          sanitized[key] = this.sanitizeValue(val, depth + 1);
        }
      }

      return sanitized;
    }

    // For functions and other types, convert to string and truncate
    return this.truncateString(String(value));
  }

  /**
   * Check if a field name is considered sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return this.options.sensitiveFields.some(sensitive => 
      lowerFieldName.includes(sensitive.toLowerCase())
    );
  }

  /**
   * Truncate a string if it's too long
   */
  private truncateString(str: string): string {
    if (str.length > this.options.maxStringLength) {
      return str.substring(0, this.options.maxStringLength) + '...[TRUNCATED]';
    }
    return str;
  }

  /**
   * Add a sensitive field pattern
   */
  addSensitiveField(field: string): void {
    if (!this.options.sensitiveFields.includes(field)) {
      this.options.sensitiveFields.push(field);
    }
  }

  /**
   * Remove a sensitive field pattern
   */
  removeSensitiveField(field: string): void {
    const index = this.options.sensitiveFields.indexOf(field);
    if (index > -1) {
      this.options.sensitiveFields.splice(index, 1);
    }
  }
}

// Default sanitizer instance
export const defaultSanitizer = new LogSanitizer();
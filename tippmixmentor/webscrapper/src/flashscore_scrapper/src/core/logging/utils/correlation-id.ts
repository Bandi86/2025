/**
 * Correlation ID utilities for tracking requests across services
 */

import { v4 as uuidv4 } from 'uuid';

export class CorrelationIdGenerator {
  private static instance: CorrelationIdGenerator;
  private prefix: string;
  private counter: number = 0;

  private constructor(prefix: string = 'req') {
    this.prefix = prefix;
  }

  static getInstance(prefix?: string): CorrelationIdGenerator {
    if (!CorrelationIdGenerator.instance) {
      CorrelationIdGenerator.instance = new CorrelationIdGenerator(prefix);
    }
    return CorrelationIdGenerator.instance;
  }

  /**
   * Generate a new correlation ID
   */
  generate(): string {
    return `${this.prefix}-${Date.now()}-${++this.counter}`;
  }

  /**
   * Generate a UUID-based correlation ID
   */
  generateUuid(): string {
    return uuidv4();
  }

  /**
   * Generate a short correlation ID (8 characters)
   */
  generateShort(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Extract correlation ID from various sources
   */
  extractFromHeaders(headers: Record<string, string | string[] | undefined>): string | null {
    const correlationHeaders = [
      'x-correlation-id',
      'x-request-id',
      'x-trace-id',
      'correlation-id',
      'request-id'
    ];

    for (const header of correlationHeaders) {
      const value = headers[header];
      if (value) {
        return Array.isArray(value) ? value[0] : value;
      }
    }

    return null;
  }

  /**
   * Validate correlation ID format
   */
  isValid(correlationId: string): boolean {
    if (!correlationId || typeof correlationId !== 'string') {
      return false;
    }

    // Check length (should be reasonable)
    if (correlationId.length < 3 || correlationId.length > 100) {
      return false;
    }

    // Check for valid characters (alphanumeric, hyphens, underscores)
    return /^[a-zA-Z0-9\-_]+$/.test(correlationId);
  }

  /**
   * Sanitize correlation ID
   */
  sanitize(correlationId: string): string {
    if (!correlationId) {
      return this.generate();
    }

    // Remove invalid characters
    const sanitized = correlationId.replace(/[^a-zA-Z0-9\-_]/g, '');
    
    // Ensure minimum length
    if (sanitized.length < 3) {
      return this.generate();
    }

    // Truncate if too long
    return sanitized.substring(0, 50);
  }
}

// Default instance
export const correlationIdGenerator = CorrelationIdGenerator.getInstance();

/**
 * Middleware function to generate or extract correlation ID
 */
export function ensureCorrelationId(headers?: Record<string, string | string[] | undefined>): string {
  if (headers) {
    const existing = correlationIdGenerator.extractFromHeaders(headers);
    if (existing && correlationIdGenerator.isValid(existing)) {
      return existing;
    }
  }
  
  return correlationIdGenerator.generate();
}
import { CacheValidator as ICacheValidator, CacheEntry, CacheValidationResult } from '../../types/cache.js';
import crypto from 'crypto';

/**
 * Validates cache entries using checksums and timestamps
 */
export class CacheValidator<T> implements ICacheValidator<T> {
  /**
   * Validate cache entry data integrity
   */
  validate(data: T): boolean {
    if (data === null || data === undefined) {
      return false;
    }

    // Basic type validation
    if (typeof data === 'object' && data !== null) {
      try {
        JSON.stringify(data);
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate checksum for data
   */
  generateChecksum(data: T): string {
    try {
      const serialized = JSON.stringify(data, this.sortObjectKeys);
      return crypto
        .createHash('sha256')
        .update(serialized)
        .digest('hex');
    } catch (error) {
      throw new Error(`Failed to generate checksum: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(entry: CacheEntry<T>): boolean {
    const now = new Date();
    const expirationTime = new Date(entry.timestamp.getTime() + entry.ttl);
    return now > expirationTime;
  }

  /**
   * Validate cache entry completely
   */
  validateEntry(entry: CacheEntry<T>): CacheValidationResult {
    // Check if expired
    if (this.isExpired(entry)) {
      return {
        isValid: false,
        reason: 'Entry has expired',
        shouldRefresh: true
      };
    }

    // Validate data integrity
    if (!this.validate(entry.data)) {
      return {
        isValid: false,
        reason: 'Data validation failed',
        shouldRefresh: true
      };
    }

    // Verify checksum
    const currentChecksum = this.generateChecksum(entry.data);
    if (currentChecksum !== entry.checksum) {
      return {
        isValid: false,
        reason: 'Checksum mismatch - data may be corrupted',
        shouldRefresh: true
      };
    }

    return {
      isValid: true,
      shouldRefresh: false
    };
  }

  /**
   * Check if entry should be refreshed based on age
   */
  shouldRefresh(entry: CacheEntry<T>, refreshThreshold: number = 0.8): boolean {
    const age = Date.now() - entry.timestamp.getTime();
    const maxAge = entry.ttl;
    return (age / maxAge) > refreshThreshold;
  }

  /**
   * Validate data against expected schema
   */
  validateSchema(data: T, schema: any): boolean {
    if (!schema) return true;

    try {
      // Basic schema validation - can be extended with more sophisticated validation
      if (typeof schema === 'object' && schema !== null) {
        return this.validateObjectSchema(data, schema);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sort object keys for consistent serialization
   */
  private sortObjectKeys = (key: string, value: any): any => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const sorted: any = {};
      Object.keys(value)
        .sort()
        .forEach(k => {
          sorted[k] = value[k];
        });
      return sorted;
    }
    return value;
  };

  /**
   * Validate object against schema
   */
  private validateObjectSchema(data: any, schema: any): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    for (const key in schema) {
      if (schema.hasOwnProperty(key)) {
        const schemaValue = schema[key];
        const dataValue = data[key];

        if (schemaValue.required && (dataValue === undefined || dataValue === null)) {
          return false;
        }

        if (dataValue !== undefined && schemaValue.type) {
          if (typeof dataValue !== schemaValue.type) {
            return false;
          }
        }
      }
    }

    return true;
  }
}
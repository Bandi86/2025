import { describe, it, expect, beforeEach } from '@jest/globals';
import { CacheValidator } from './cache-validator.js';
import { CacheEntry } from '../../types/cache.js';

describe('CacheValidator', () => {
  let validator: CacheValidator<any>;

  beforeEach(() => {
    validator = new CacheValidator();
  });

  describe('validate', () => {
    it('should validate valid data', () => {
      const validData = { name: 'test', value: 123 };
      
      expect(validator.validate(validData)).toBe(true);
    });

    it('should validate primitive types', () => {
      expect(validator.validate('string')).toBe(true);
      expect(validator.validate(123)).toBe(true);
      expect(validator.validate(true)).toBe(true);
    });

    it('should reject null and undefined', () => {
      expect(validator.validate(null)).toBe(false);
      expect(validator.validate(undefined)).toBe(false);
    });

    it('should reject circular references', () => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData;
      
      expect(validator.validate(circularData)).toBe(false);
    });
  });

  describe('generateChecksum', () => {
    it('should generate consistent checksums for same data', () => {
      const data = { name: 'test', value: 123 };
      const checksum1 = validator.generateChecksum(data);
      const checksum2 = validator.generateChecksum(data);
      
      expect(checksum1).toBe(checksum2);
      expect(checksum1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different checksums for different data', () => {
      const data1 = { name: 'test1', value: 123 };
      const data2 = { name: 'test2', value: 123 };
      const checksum1 = validator.generateChecksum(data1);
      const checksum2 = validator.generateChecksum(data2);
      
      expect(checksum1).not.toBe(checksum2);
    });

    it('should generate same checksum regardless of property order', () => {
      const data1 = { name: 'test', value: 123, id: 'abc' };
      const data2 = { value: 123, id: 'abc', name: 'test' };
      const checksum1 = validator.generateChecksum(data1);
      const checksum2 = validator.generateChecksum(data2);
      
      expect(checksum1).toBe(checksum2);
    });

    it('should handle nested objects', () => {
      const data = {
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark', notifications: true }
      };
      
      expect(() => validator.generateChecksum(data)).not.toThrow();
      expect(validator.generateChecksum(data)).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should throw error for circular references', () => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData;
      
      expect(() => validator.generateChecksum(circularData)).toThrow();
    });
  });

  describe('isExpired', () => {
    it('should detect expired entries', () => {
      const expiredEntry: CacheEntry<any> = {
        data: { test: 'data' },
        timestamp: new Date(Date.now() - 2000), // 2 seconds ago
        ttl: 1000, // 1 second TTL
        checksum: 'test-checksum',
        accessCount: 1,
        lastAccessed: new Date(),
        size: 100
      };
      
      expect(validator.isExpired(expiredEntry)).toBe(true);
    });

    it('should detect non-expired entries', () => {
      const validEntry: CacheEntry<any> = {
        data: { test: 'data' },
        timestamp: new Date(Date.now() - 500), // 0.5 seconds ago
        ttl: 1000, // 1 second TTL
        checksum: 'test-checksum',
        accessCount: 1,
        lastAccessed: new Date(),
        size: 100
      };
      
      expect(validator.isExpired(validEntry)).toBe(false);
    });

    it('should handle edge case of exactly expired entry', () => {
      const now = Date.now();
      const exactlyExpiredEntry: CacheEntry<any> = {
        data: { test: 'data' },
        timestamp: new Date(now - 1000), // 1 second ago
        ttl: 1000, // 1 second TTL
        checksum: 'test-checksum',
        accessCount: 1,
        lastAccessed: new Date(),
        size: 100
      };
      
      // Should be expired (or very close to it)
      expect(validator.isExpired(exactlyExpiredEntry)).toBe(true);
    });
  });

  describe('validateEntry', () => {
    it('should validate valid entry', () => {
      const data = { name: 'test', value: 123 };
      const checksum = validator.generateChecksum(data);
      const validEntry: CacheEntry<any> = {
        data,
        timestamp: new Date(Date.now() - 500), // 0.5 seconds ago
        ttl: 1000, // 1 second TTL
        checksum,
        accessCount: 1,
        lastAccessed: new Date(),
        size: 100
      };
      
      const result = validator.validateEntry(validEntry);
      
      expect(result.isValid).toBe(true);
      expect(result.shouldRefresh).toBe(false);
    });

    it('should reject expired entry', () => {
      const data = { name: 'test', value: 123 };
      const checksum = validator.generateChecksum(data);
      const expiredEntry: CacheEntry<any> = {
        data,
        timestamp: new Date(Date.now() - 2000), // 2 seconds ago
        ttl: 1000, // 1 second TTL
        checksum,
        accessCount: 1,
        lastAccessed: new Date(),
        size: 100
      };
      
      const result = validator.validateEntry(expiredEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Entry has expired');
      expect(result.shouldRefresh).toBe(true);
    });

    it('should reject entry with invalid data', () => {
      const invalidEntry: CacheEntry<any> = {
        data: null,
        timestamp: new Date(Date.now() - 500),
        ttl: 1000,
        checksum: 'test-checksum',
        accessCount: 1,
        lastAccessed: new Date(),
        size: 100
      };
      
      const result = validator.validateEntry(invalidEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Data validation failed');
      expect(result.shouldRefresh).toBe(true);
    });

    it('should reject entry with checksum mismatch', () => {
      const data = { name: 'test', value: 123 };
      const wrongChecksum = 'wrong-checksum';
      const corruptedEntry: CacheEntry<any> = {
        data,
        timestamp: new Date(Date.now() - 500),
        ttl: 1000,
        checksum: wrongChecksum,
        accessCount: 1,
        lastAccessed: new Date(),
        size: 100
      };
      
      const result = validator.validateEntry(corruptedEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Checksum mismatch - data may be corrupted');
      expect(result.shouldRefresh).toBe(true);
    });
  });

  describe('shouldRefresh', () => {
    it('should suggest refresh for old entries', () => {
      const data = { name: 'test', value: 123 };
      const checksum = validator.generateChecksum(data);
      const oldEntry: CacheEntry<any> = {
        data,
        timestamp: new Date(Date.now() - 900), // 0.9 seconds ago
        ttl: 1000, // 1 second TTL (90% of TTL has passed)
        checksum,
        accessCount: 1,
        lastAccessed: new Date(),
        size: 100
      };
      
      expect(validator.shouldRefresh(oldEntry, 0.8)).toBe(true);
    });

    it('should not suggest refresh for fresh entries', () => {
      const data = { name: 'test', value: 123 };
      const checksum = validator.generateChecksum(data);
      const freshEntry: CacheEntry<any> = {
        data,
        timestamp: new Date(Date.now() - 100), // 0.1 seconds ago
        ttl: 1000, // 1 second TTL (10% of TTL has passed)
        checksum,
        accessCount: 1,
        lastAccessed: new Date(),
        size: 100
      };
      
      expect(validator.shouldRefresh(freshEntry, 0.8)).toBe(false);
    });

    it('should use custom refresh threshold', () => {
      const data = { name: 'test', value: 123 };
      const checksum = validator.generateChecksum(data);
      const entry: CacheEntry<any> = {
        data,
        timestamp: new Date(Date.now() - 600), // 0.6 seconds ago
        ttl: 1000, // 1 second TTL (60% of TTL has passed)
        checksum,
        accessCount: 1,
        lastAccessed: new Date(),
        size: 100
      };
      
      expect(validator.shouldRefresh(entry, 0.5)).toBe(true);
      expect(validator.shouldRefresh(entry, 0.7)).toBe(false);
    });
  });

  describe('validateSchema', () => {
    it('should validate data against schema', () => {
      const data = { name: 'John', age: 30, active: true };
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true },
        active: { type: 'boolean', required: false }
      };
      
      expect(validator.validateSchema(data, schema)).toBe(true);
    });

    it('should reject data missing required fields', () => {
      const data = { name: 'John' };
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true }
      };
      
      expect(validator.validateSchema(data, schema)).toBe(false);
    });

    it('should reject data with wrong types', () => {
      const data = { name: 'John', age: 'thirty' };
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true }
      };
      
      expect(validator.validateSchema(data, schema)).toBe(false);
    });

    it('should handle null schema', () => {
      const data = { name: 'John', age: 30 };
      
      expect(validator.validateSchema(data, null)).toBe(true);
    });

    it('should handle non-object data', () => {
      const schema = {
        name: { type: 'string', required: true }
      };
      
      expect(validator.validateSchema('string', schema)).toBe(false);
      expect(validator.validateSchema(null, schema)).toBe(false);
    });
  });
});
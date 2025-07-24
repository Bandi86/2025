import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FileSystemCache } from './filesystem-cache.js';
import { CacheOptions } from '../../types/cache.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('FileSystemCache', () => {
  let cache: FileSystemCache;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-test-'));
    
    const options: Partial<CacheOptions> = {
      ttl: 1000, // 1 second for testing
      maxEntries: 5,
      compressionEnabled: false, // Disable compression for easier testing
      cleanupInterval: 100 // 100ms for faster testing
    };
    
    cache = new FileSystemCache(tempDir, options);
  });

  afterEach(async () => {
    // Cleanup
    cache.destroy();
    
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('set and get', () => {
    it('should store and retrieve data', async () => {
      const key = 'test-key';
      const value = { name: 'test', value: 123 };
      
      await cache.set(key, value);
      const retrieved = await cache.get(key);
      
      expect(retrieved).toEqual(value);
    });

    it('should handle different data types', async () => {
      const testCases = [
        { key: 'string', value: 'hello world' },
        { key: 'number', value: 42 },
        { key: 'boolean', value: true },
        { key: 'array', value: [1, 2, 3] },
        { key: 'object', value: { nested: { data: 'test' } } }
      ];
      
      for (const testCase of testCases) {
        await cache.set(testCase.key, testCase.value);
        const retrieved = await cache.get(testCase.key);
        expect(retrieved).toEqual(testCase.value);
      }
    });

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle custom TTL', async () => {
      const key = 'custom-ttl';
      const value = 'test-value';
      const customTtl = 500; // 0.5 seconds
      
      await cache.set(key, value, customTtl);
      
      // Should exist immediately
      expect(await cache.get(key)).toBe(value);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Should be expired
      expect(await cache.get(key)).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing keys', async () => {
      const key = 'existing-key';
      const value = 'test-value';
      
      await cache.set(key, value);
      expect(await cache.has(key)).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      expect(await cache.has('non-existent-key')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      const key = 'expired-key';
      const value = 'test-value';
      const shortTtl = 100; // 0.1 seconds
      
      await cache.set(key, value, shortTtl);
      
      // Should exist initially
      expect(await cache.has(key)).toBe(true);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      expect(await cache.has(key)).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing entries', async () => {
      const key = 'delete-test';
      const value = 'test-value';
      
      await cache.set(key, value);
      expect(await cache.has(key)).toBe(true);
      
      await cache.delete(key);
      expect(await cache.has(key)).toBe(false);
    });

    it('should handle deletion of non-existent keys gracefully', async () => {
      await expect(cache.delete('non-existent-key')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all entries', async () => {
      const entries = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' }
      ];
      
      for (const entry of entries) {
        await cache.set(entry.key, entry.value);
      }
      
      expect(await cache.size()).toBe(3);
      
      await cache.clear();
      
      expect(await cache.size()).toBe(0);
      
      for (const entry of entries) {
        expect(await cache.has(entry.key)).toBe(false);
      }
    });
  });

  describe('size and keys', () => {
    it('should track cache size correctly', async () => {
      expect(await cache.size()).toBe(0);
      
      await cache.set('key1', 'value1');
      expect(await cache.size()).toBe(1);
      
      await cache.set('key2', 'value2');
      expect(await cache.size()).toBe(2);
      
      await cache.delete('key1');
      expect(await cache.size()).toBe(1);
    });

    it('should return all cache keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      
      for (const key of keys) {
        await cache.set(key, `value-${key}`);
      }
      
      const retrievedKeys = await cache.keys();
      
      // Convert to sets for comparison (order doesn't matter)
      expect(new Set(retrievedKeys)).toEqual(new Set(keys));
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries during cleanup', async () => {
      const shortTtl = 100; // 0.1 seconds
      
      await cache.set('key1', 'value1', shortTtl);
      await cache.set('key2', 'value2', shortTtl);
      await cache.set('key3', 'value3', 10000); // Long TTL
      
      expect(await cache.size()).toBe(3);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const cleanedCount = await cache.cleanup();
      
      expect(cleanedCount).toBe(2);
      expect(await cache.size()).toBe(1);
      expect(await cache.has('key3')).toBe(true);
    });
  });

  describe('TTL behavior', () => {
    it('should automatically expire entries', async () => {
      const key = 'ttl-test';
      const value = 'test-value';
      const ttl = 200; // 0.2 seconds
      
      await cache.set(key, value, ttl);
      
      // Should exist immediately
      expect(await cache.get(key)).toBe(value);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Should be expired and return null
      expect(await cache.get(key)).toBeNull();
    });

    it('should update access metadata on get', async () => {
      const key = 'access-test';
      const value = 'test-value';
      
      await cache.set(key, value);
      
      // First access
      await cache.get(key);
      
      // Second access
      await cache.get(key);
      
      // The access count should be updated (we can't directly test this
      // without exposing internal state, but we can verify the entry still exists)
      expect(await cache.has(key)).toBe(true);
    });
  });

  describe('max entries enforcement', () => {
    it('should enforce maximum number of entries', async () => {
      // Cache is configured with maxEntries: 5
      const keys = ['key1', 'key2', 'key3', 'key4', 'key5', 'key6', 'key7'];
      
      for (const key of keys) {
        await cache.set(key, `value-${key}`);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Should not exceed max entries
      const finalSize = await cache.size();
      expect(finalSize).toBeLessThanOrEqual(5);
      
      // Oldest entries should be evicted
      const remainingKeys = await cache.keys();
      expect(remainingKeys.length).toBeLessThanOrEqual(5);
    });
  });

  describe('error handling', () => {
    it('should handle corrupted cache files gracefully', async () => {
      const key = 'corrupted-test';
      const value = 'test-value';
      
      await cache.set(key, value);
      
      // Corrupt the cache file
      const filePath = path.join(tempDir, 'flashscore_corrupted-test.cache');
      await fs.writeFile(filePath, 'corrupted data');
      
      // Should return null for corrupted data
      const result = await cache.get(key);
      expect(result).toBeNull();
    });

    it('should handle file system errors gracefully', async () => {
      // This test is harder to implement without mocking fs
      // For now, we'll just ensure the methods don't throw
      await expect(cache.get('test')).resolves.not.toThrow();
      await expect(cache.set('test', 'value')).resolves.not.toThrow();
      await expect(cache.delete('test')).resolves.not.toThrow();
    });
  });
});
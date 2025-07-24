import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CacheManager } from './cache-manager.js';
import { CacheOptions, ICacheEventListener, CacheEvent, CacheEventType } from '../../types/cache.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-manager-test-'));
    
    const options: Partial<CacheOptions> = {
      ttl: 1000, // 1 second for testing
      maxEntries: 10,
      compressionEnabled: false,
      cleanupInterval: 100
    };
    
    cacheManager = new CacheManager(tempDir, options);
  });

  afterEach(async () => {
    // Cleanup
    cacheManager.destroy();
    
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('basic operations', () => {
    it('should store and retrieve data', async () => {
      const key = 'test-key';
      const value = { name: 'test', value: 123 };
      
      await cacheManager.set(key, value);
      const retrieved = await cacheManager.get(key);
      
      expect(retrieved).toEqual(value);
    });

    it('should handle has operation', async () => {
      const key = 'has-test';
      const value = 'test-value';
      
      expect(await cacheManager.has(key)).toBe(false);
      
      await cacheManager.set(key, value);
      expect(await cacheManager.has(key)).toBe(true);
    });

    it('should delete entries', async () => {
      const key = 'delete-test';
      const value = 'test-value';
      
      await cacheManager.set(key, value);
      expect(await cacheManager.has(key)).toBe(true);
      
      await cacheManager.delete(key);
      expect(await cacheManager.has(key)).toBe(false);
    });

    it('should clear all entries', async () => {
      const entries = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' }
      ];
      
      for (const entry of entries) {
        await cacheManager.set(entry.key, entry.value);
      }
      
      expect(await cacheManager.size()).toBe(3);
      
      await cacheManager.clear();
      
      expect(await cacheManager.size()).toBe(0);
    });
  });

  describe('statistics tracking', () => {
    it('should track hit and miss statistics', async () => {
      const key = 'stats-test';
      const value = 'test-value';
      
      // Initial stats
      let stats = await cacheManager.getStats();
      expect(stats.hitCount).toBe(0);
      expect(stats.missCount).toBe(0);
      expect(stats.hitRate).toBe(0);
      
      // Miss
      await cacheManager.get('non-existent');
      stats = await cacheManager.getStats();
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBe(0);
      
      // Set and hit
      await cacheManager.set(key, value);
      await cacheManager.get(key);
      stats = await cacheManager.getStats();
      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should update statistics after operations', async () => {
      const key = 'stats-update-test';
      const value = 'test-value';
      
      await cacheManager.set(key, value);
      
      let stats = await cacheManager.getStats();
      expect(stats.totalEntries).toBe(1);
      
      await cacheManager.delete(key);
      
      stats = await cacheManager.getStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('event system', () => {
    it('should emit events for cache operations', async () => {
      const events: CacheEvent[] = [];
      
      const listener: ICacheEventListener = {
        onCacheEvent: (event: CacheEvent) => {
          events.push(event);
        }
      };
      
      cacheManager.addEventListener(listener);
      
      const key = 'event-test';
      const value = 'test-value';
      
      // Set operation
      await cacheManager.set(key, value);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(CacheEventType.SET);
      expect(events[0].key).toBe(key);
      
      // Get operation (hit)
      await cacheManager.get(key);
      expect(events).toHaveLength(2);
      expect(events[1].type).toBe(CacheEventType.HIT);
      expect(events[1].key).toBe(key);
      
      // Get operation (miss)
      await cacheManager.get('non-existent');
      expect(events).toHaveLength(3);
      expect(events[2].type).toBe(CacheEventType.MISS);
      expect(events[2].key).toBe('non-existent');
      
      // Delete operation
      await cacheManager.delete(key);
      expect(events).toHaveLength(4);
      expect(events[3].type).toBe(CacheEventType.DELETE);
      expect(events[3].key).toBe(key);
      
      // Clear operation
      await cacheManager.clear();
      expect(events).toHaveLength(5);
      expect(events[4].type).toBe(CacheEventType.CLEAR);
      expect(events[4].key).toBe('*');
    });

    it('should handle event listener removal', async () => {
      const events: CacheEvent[] = [];
      
      const listener: ICacheEventListener = {
        onCacheEvent: (event: CacheEvent) => {
          events.push(event);
        }
      };
      
      cacheManager.addEventListener(listener);
      
      await cacheManager.set('test', 'value');
      expect(events).toHaveLength(1);
      
      cacheManager.removeEventListener(listener);
      
      await cacheManager.set('test2', 'value2');
      expect(events).toHaveLength(1); // No new events
    });
  });

  describe('pattern invalidation', () => {
    it('should invalidate entries matching pattern', async () => {
      const entries = [
        { key: 'user:123:profile', value: 'profile1' },
        { key: 'user:123:settings', value: 'settings1' },
        { key: 'user:456:profile', value: 'profile2' },
        { key: 'post:789:content', value: 'content1' }
      ];
      
      for (const entry of entries) {
        await cacheManager.set(entry.key, entry.value);
      }
      
      expect(await cacheManager.size()).toBe(4);
      
      // Invalidate all user:123 entries
      const invalidatedCount = await cacheManager.invalidatePattern('user:123:*');
      
      expect(invalidatedCount).toBe(2);
      expect(await cacheManager.size()).toBe(2);
      expect(await cacheManager.has('user:123:profile')).toBe(false);
      expect(await cacheManager.has('user:123:settings')).toBe(false);
      expect(await cacheManager.has('user:456:profile')).toBe(true);
      expect(await cacheManager.has('post:789:content')).toBe(true);
    });

    it('should handle wildcard patterns', async () => {
      const entries = [
        { key: 'cache:data:item1', value: 'value1' },
        { key: 'cache:data:item2', value: 'value2' },
        { key: 'cache:meta:info', value: 'info' },
        { key: 'temp:data:item3', value: 'value3' }
      ];
      
      for (const entry of entries) {
        await cacheManager.set(entry.key, entry.value);
      }
      
      // Invalidate all cache entries
      const invalidatedCount = await cacheManager.invalidatePattern('cache:*');
      
      expect(invalidatedCount).toBe(3);
      expect(await cacheManager.has('temp:data:item3')).toBe(true);
    });
  });

  describe('export and import', () => {
    it('should export cache data', async () => {
      const entries = [
        { key: 'export-key1', value: { data: 'value1' } },
        { key: 'export-key2', value: { data: 'value2' } },
        { key: 'export-key3', value: 'simple-value' }
      ];
      
      for (const entry of entries) {
        await cacheManager.set(entry.key, entry.value);
      }
      
      const exportData = await cacheManager.export();
      
      expect(exportData.version).toBe('1.0.0');
      expect(exportData.exportedAt).toBeInstanceOf(Date);
      expect(exportData.entries).toHaveLength(3);
      
      // Check that all entries are included
      const exportedKeys = exportData.entries.map(e => e.key);
      expect(exportedKeys).toContain('export-key1');
      expect(exportedKeys).toContain('export-key2');
      expect(exportedKeys).toContain('export-key3');
    });

    it('should import cache data', async () => {
      const importData = {
        version: '1.0.0',
        exportedAt: new Date(),
        entries: [
          {
            key: 'import-key1',
            data: { imported: 'value1' },
            metadata: {
              key: 'import-key1',
              created: new Date(),
              expires: new Date(Date.now() + 10000),
              size: 100,
              checksum: 'test-checksum',
              tags: []
            }
          },
          {
            key: 'import-key2',
            data: 'simple-imported-value',
            metadata: {
              key: 'import-key2',
              created: new Date(),
              expires: new Date(Date.now() + 10000),
              size: 50,
              checksum: 'test-checksum2',
              tags: []
            }
          }
        ]
      };
      
      await cacheManager.import(importData);
      
      expect(await cacheManager.size()).toBe(2);
      expect(await cacheManager.get('import-key1')).toEqual({ imported: 'value1' });
      expect(await cacheManager.get('import-key2')).toBe('simple-imported-value');
    });
  });

  describe('cleanup operations', () => {
    it('should cleanup expired entries', async () => {
      const shortTtl = 100; // 0.1 seconds
      
      await cacheManager.set('temp1', 'value1', shortTtl);
      await cacheManager.set('temp2', 'value2', shortTtl);
      await cacheManager.set('permanent', 'value3', 10000); // Long TTL
      
      expect(await cacheManager.size()).toBe(3);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const cleanedCount = await cacheManager.cleanup();
      
      expect(cleanedCount).toBe(2);
      expect(await cacheManager.size()).toBe(1);
      expect(await cacheManager.has('permanent')).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should provide access to key generator', () => {
      const keyGenerator = cacheManager.getKeyGenerator();
      
      expect(keyGenerator).toBeDefined();
      expect(typeof keyGenerator.generateMatchKey).toBe('function');
    });

    it('should provide access to validator', () => {
      const validator = cacheManager.getValidator();
      
      expect(validator).toBeDefined();
      expect(typeof validator.validate).toBe('function');
    });
  });

  describe('warmup functionality', () => {
    it('should handle warmup operation', async () => {
      // Set some data first
      await cacheManager.set('warm1', 'value1');
      await cacheManager.set('warm2', 'value2');
      
      // Warmup should not throw
      await expect(cacheManager.warmup(['warm1', 'warm2', 'non-existent'])).resolves.not.toThrow();
    });
  });
});
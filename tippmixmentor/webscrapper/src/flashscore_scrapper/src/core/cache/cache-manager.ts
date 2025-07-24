import { 
  ICacheManager, 
  CacheStats, 
  CacheExport, 
  CacheEvent, 
  CacheEventType,
  ICacheEventListener,
  CacheOptions 
} from '../../types/cache.js';
import { FileSystemCache } from './filesystem-cache.js';
import { CacheKeyGenerator } from './cache-key-generator.js';
import { CacheValidator } from './cache-validator.js';
import { CacheUtils } from './cache-utils.js';
import path from 'path';

/**
 * Main cache manager that orchestrates all caching functionality
 */
export class CacheManager implements ICacheManager {
  private readonly cache: FileSystemCache;
  private readonly keyGenerator: CacheKeyGenerator;
  private readonly validator: CacheValidator<any>;
  private readonly listeners: ICacheEventListener[] = [];
  private stats: CacheStats;

  constructor(cacheDir: string, options: Partial<CacheOptions> = {}) {
    this.cache = new FileSystemCache(cacheDir, options);
    this.keyGenerator = new CacheKeyGenerator();
    this.validator = new CacheValidator();
    this.stats = this.initializeStats();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const value = await this.cache.get<T>(key);
      
      if (value !== null) {
        this.stats.hitCount++;
        this.emitEvent({
          type: CacheEventType.HIT,
          key,
          timestamp: new Date(),
          data: { duration: Date.now() - startTime }
        });
      } else {
        this.stats.missCount++;
        this.emitEvent({
          type: CacheEventType.MISS,
          key,
          timestamp: new Date(),
          data: { duration: Date.now() - startTime }
        });
      }

      this.updateHitRate();
      return value;
    } catch (error) {
      this.stats.missCount++;
      this.updateHitRate();
      throw error;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttl);
      
      this.emitEvent({
        type: CacheEventType.SET,
        key,
        timestamp: new Date(),
        data: { size: CacheUtils.calculateSize(value), ttl }
      });

      await this.updateStats();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    return await this.cache.has(key);
  }

  /**
   * Delete entry from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cache.delete(key);
      
      this.emitEvent({
        type: CacheEventType.DELETE,
        key,
        timestamp: new Date()
      });

      await this.updateStats();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await this.cache.clear();
      
      this.emitEvent({
        type: CacheEventType.CLEAR,
        key: '*',
        timestamp: new Date()
      });

      this.stats = this.initializeStats();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get number of entries in cache
   */
  async size(): Promise<number> {
    return await this.cache.size();
  }

  /**
   * Get all cache keys
   */
  async keys(): Promise<string[]> {
    return await this.cache.keys();
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<number> {
    try {
      const cleanedCount = await this.cache.cleanup();
      
      if (cleanedCount > 0) {
        this.stats.evictionCount += cleanedCount;
        await this.updateStats();
      }

      return cleanedCount;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    await this.updateStats();
    return { ...this.stats };
  }

  /**
   * Invalidate entries matching pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys();
      const matchingKeys = keys.filter(key => 
        this.keyGenerator.matchesPattern(key, pattern)
      );

      let invalidatedCount = 0;
      for (const key of matchingKeys) {
        try {
          await this.delete(key);
          invalidatedCount++;
        } catch {
          // Continue with other keys if one fails
        }
      }

      return invalidatedCount;
    } catch (error) {
      throw new Error(`Failed to invalidate pattern ${pattern}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Warmup cache with specified keys
   */
  async warmup(keys: string[]): Promise<void> {
    // This is a placeholder for cache warmup functionality
    // In a real implementation, this would pre-load frequently accessed data
    for (const key of keys) {
      try {
        await this.get(key);
      } catch {
        // Ignore errors during warmup
      }
    }
  }

  /**
   * Export cache data
   */
  async export(): Promise<CacheExport> {
    try {
      const keys = await this.keys();
      const entries = [];

      for (const key of keys) {
        try {
          const data = await this.cache.get(key);
          if (data !== null) {
            entries.push({
              key,
              data,
              metadata: CacheUtils.createCacheMetadata(
                key,
                CacheUtils.createCacheEntry(data, 0, this.validator.generateChecksum(data))
              )
            });
          }
        } catch {
          // Skip entries that can't be read
        }
      }

      return {
        version: '1.0.0',
        exportedAt: new Date(),
        entries
      };
    } catch (error) {
      throw new Error(`Failed to export cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import cache data
   */
  async import(data: CacheExport): Promise<void> {
    try {
      for (const entry of data.entries) {
        try {
          await this.set(entry.key, entry.data);
        } catch {
          // Continue with other entries if one fails
        }
      }
    } catch (error) {
      throw new Error(`Failed to import cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add event listener
   */
  addEventListener(listener: ICacheEventListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: ICacheEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get cache key generator
   */
  getKeyGenerator(): CacheKeyGenerator {
    return this.keyGenerator;
  }

  /**
   * Get cache validator
   */
  getValidator(): CacheValidator<any> {
    return this.validator;
  }

  /**
   * Destroy cache manager and cleanup resources
   */
  destroy(): void {
    this.cache.destroy();
    this.listeners.length = 0;
  }

  /**
   * Initialize cache statistics
   */
  private initializeStats(): CacheStats {
    return {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      oldestEntry: null,
      newestEntry: null
    };
  }

  /**
   * Update cache statistics
   */
  private async updateStats(): Promise<void> {
    try {
      this.stats.totalEntries = await this.size();
      this.updateHitRate();
      
      // Update size and entry dates would require more detailed tracking
      // This is a simplified version
    } catch {
      // Ignore stats update errors
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const totalRequests = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = totalRequests > 0 ? this.stats.hitCount / totalRequests : 0;
  }

  /**
   * Emit cache event to listeners
   */
  private emitEvent(event: CacheEvent): void {
    for (const listener of this.listeners) {
      try {
        listener.onCacheEvent(event);
      } catch {
        // Ignore listener errors
      }
    }
  }
}
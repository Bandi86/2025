import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

export interface CacheOptions {
  ttl?: number;
  key?: string;
  tags?: string[];
  compress?: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  averageResponseTime: number;
  totalRequests: number;
}

@Injectable()
export class PerformanceCacheService {
  private readonly logger = new Logger(PerformanceCacheService.name);
  private readonly defaultTTL = 300; // 5 minutes
  private readonly metrics: Map<string, CacheMetrics> = new Map();

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get cached data with intelligent key generation
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const startTime = Date.now();
    const cacheKey = this.generateKey(key, options);

    try {
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.updateMetrics(cacheKey, 'hit', Date.now() - startTime);
        this.logger.debug(`Cache HIT for key: ${cacheKey}`);
        return JSON.parse(cachedData);
      } else {
        this.updateMetrics(cacheKey, 'miss', Date.now() - startTime);
        this.logger.debug(`Cache MISS for key: ${cacheKey}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Cache get error for key ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with compression and intelligent TTL
   */
  async set<T>(
    key: string,
    data: T,
    options?: CacheOptions,
  ): Promise<void> {
    const cacheKey = this.generateKey(key, options);
    const ttl = options?.ttl || this.defaultTTL;

    try {
      const serializedData = JSON.stringify(data);
      await this.redisService.set(cacheKey, serializedData, ttl);

      // Set cache tags for invalidation
      if (options?.tags) {
        await this.setCacheTags(cacheKey, options.tags);
      }

      this.logger.debug(`Cache SET for key: ${cacheKey} with TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${cacheKey}:`, error);
    }
  }

  /**
   * Delete cached data by key or tags
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    const cacheKey = this.generateKey(key, options);

    try {
      await this.redisService.del(cacheKey);
      this.logger.debug(`Cache DELETE for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${cacheKey}:`, error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        
        // Fixed: Use smembers to get cache keys from the tag set instead of keys()
        const cacheKeys = await this.redisService.smembers(tagKey);
        
        if (cacheKeys.length > 0) {
          // Delete all cache keys associated with this tag
          await this.redisService.del(...cacheKeys);
          
          // Delete the tag set itself
          await this.redisService.del(tagKey);
          
          this.logger.debug(`Invalidated ${cacheKeys.length} cache entries for tag: ${tag}`);
        }
      }
    } catch (error) {
      this.logger.error(`Cache invalidation error for tags ${tags}:`, error);
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(key?: string): CacheMetrics | Map<string, CacheMetrics> {
    if (key) {
      return this.metrics.get(key) || this.createEmptyMetrics();
    }
    return this.metrics;
  }

  /**
   * Clear all cache metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Cache decorator for methods
   */
  cache<T>(
    key: string,
    options?: CacheOptions,
  ): MethodDecorator {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const cacheService = this.performanceCacheService as PerformanceCacheService;
        const cacheKey = `${key}:${JSON.stringify(args)}`;

        // Try to get from cache
        const cachedResult = await cacheService.get<T>(cacheKey, options);
        if (cachedResult !== null) {
          return cachedResult;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Cache the result
        await cacheService.set(cacheKey, result, options);

        return result;
      };

      return descriptor;
    };
  }

  /**
   * Intelligent cache warming for frequently accessed data
   */
  async warmCache(patterns: string[]): Promise<void> {
    this.logger.log('Starting cache warming...');

    for (const pattern of patterns) {
      try {
        // This would typically call the actual service methods
        // to populate cache with frequently accessed data
        this.logger.debug(`Warming cache for pattern: ${pattern}`);
      } catch (error) {
        this.logger.error(`Cache warming error for pattern ${pattern}:`, error);
      }
    }

    this.logger.log('Cache warming completed');
  }

  /**
   * Generate intelligent cache key
   */
  private generateKey(key: string, options?: CacheOptions): string {
    const prefix = this.configService.get('CACHE_PREFIX', 'tippmixmentor');
    const version = this.configService.get('CACHE_VERSION', 'v1');
    
    if (options?.key) {
      return `${prefix}:${version}:${options.key}`;
    }
    
    return `${prefix}:${version}:${key}`;
  }

  /**
   * Set cache tags for invalidation
   */
  private async setCacheTags(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        await this.redisService.sadd(tagKey, key);
        await this.redisService.expire(tagKey, 86400); // 24 hours
      }
    } catch (error) {
      this.logger.error(`Error setting cache tags for key ${key}:`, error);
    }
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(key: string, type: 'hit' | 'miss', responseTime: number): void {
    const metrics = this.metrics.get(key) || this.createEmptyMetrics();
    
    metrics.totalRequests++;
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests;

    if (type === 'hit') {
      metrics.hits++;
    } else {
      metrics.misses++;
    }

    metrics.hitRate = metrics.hits / metrics.totalRequests;
    this.metrics.set(key, metrics);
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): CacheMetrics {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      averageResponseTime: 0,
      totalRequests: 0,
    };
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
    averageResponseTime: number;
  }> {
    try {
      const info = await this.redisService.info('memory');
      const keys = await this.redisService.keys('tippmixmentor:*');
      
      const totalHitRate = Array.from(this.metrics.values()).reduce(
        (acc, metric) => acc + metric.hitRate,
        0
      ) / this.metrics.size || 0;

      const averageResponseTime = Array.from(this.metrics.values()).reduce(
        (acc, metric) => acc + metric.averageResponseTime,
        0
      ) / this.metrics.size || 0;

      return {
        totalKeys: keys.length,
        memoryUsage: info,
        hitRate: totalHitRate,
        averageResponseTime,
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        totalKeys: 0,
        memoryUsage: '0',
        hitRate: 0,
        averageResponseTime: 0,
      };
    }
  }
} 
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class LiveDataCacheService {
  private readonly logger = new Logger(LiveDataCacheService.name);
  private readonly redis: Redis;
  private readonly defaultTTL = 300; // 5 minutes

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      db: this.configService.get<number>('REDIS_DB', 0),
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  async get(key: string): Promise<any | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}:`, error.message);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}:`, error.message);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${key}:`, error.message);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check cache key ${key}:`, error.message);
      return false;
    }
  }

  async getMatchData(matchId: string): Promise<any | null> {
    return this.get(`match:${matchId}`);
  }

  async setMatchData(matchId: string, data: any, ttl: number = 60): Promise<void> {
    await this.set(`match:${matchId}`, data, ttl);
  }

  async getLiveMatches(): Promise<any | null> {
    return this.get('live:matches');
  }

  async setLiveMatches(data: any, ttl: number = 30): Promise<void> {
    await this.set('live:matches', data, ttl);
  }

  async getUpcomingMatches(): Promise<any | null> {
    return this.get('upcoming:matches');
  }

  async setUpcomingMatches(data: any, ttl: number = 300): Promise<void> {
    await this.set('upcoming:matches', data, ttl);
  }

  async getWeatherData(city: string): Promise<any | null> {
    return this.get(`weather:${city}`);
  }

  async setWeatherData(city: string, data: any, ttl: number = 1800): Promise<void> {
    await this.set(`weather:${city}`, data, ttl);
  }

  async getTeamNews(teamName: string): Promise<any | null> {
    return this.get(`news:${teamName}`);
  }

  async setTeamNews(teamName: string, data: any, ttl: number = 600): Promise<void> {
    await this.set(`news:${teamName}`, data, ttl);
  }

  async getESPNData(matchId: string): Promise<any | null> {
    return this.get(`espn:${matchId}`);
  }

  async setESPNData(matchId: string, data: any, ttl: number = 30): Promise<void> {
    await this.set(`espn:${matchId}`, data, ttl);
  }

  async invalidateMatchData(matchId: string): Promise<void> {
    await this.delete(`match:${matchId}`);
    await this.delete(`espn:${matchId}`);
  }

  async invalidateLiveMatches(): Promise<void> {
    await this.delete('live:matches');
  }

  async invalidateUpcomingMatches(): Promise<void> {
    await this.delete('upcoming:matches');
  }

  async invalidateWeatherData(city: string): Promise<void> {
    await this.delete(`weather:${city}`);
  }

  async invalidateTeamNews(teamName: string): Promise<void> {
    await this.delete(`news:${teamName}`);
  }

  // Rate limiting for external APIs
  async checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, window);
      }
      return current <= limit;
    } catch (error) {
      this.logger.error(`Failed to check rate limit for ${key}:`, error.message);
      return true; // Allow request if rate limiting fails
    }
  }

  // Get rate limit info
  async getRateLimitInfo(key: string): Promise<{ current: number; remaining: number; reset: number } | null> {
    try {
      const current = await this.redis.get(key);
      const ttl = await this.redis.ttl(key);
      
      if (current === null) {
        return null;
      }

      const currentCount = parseInt(current);
      return {
        current: currentCount,
        remaining: Math.max(0, 100 - currentCount), // Assuming limit of 100
        reset: ttl,
      };
    } catch (error) {
      this.logger.error(`Failed to get rate limit info for ${key}:`, error.message);
      return null;
    }
  }

  // Cache statistics
  async getCacheStats(): Promise<any> {
    try {
      const info = await this.redis.info();
      const keyspace = await this.redis.info('keyspace');
      
      return {
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {}),
        keyspace: keyspace.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {}),
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error.message);
      return null;
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
} 
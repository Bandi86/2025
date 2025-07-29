import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return await this.redis.setex(key, ttl, value);
    }
    return await this.redis.set(key, value);
  }

  async del(key: string): Promise<number> {
    return await this.redis.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.redis.exists(key);
  }

  async expire(key: string, ttl: number): Promise<number> {
    return await this.redis.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.redis.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.redis.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.redis.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<number> {
    return await this.redis.hdel(key, field);
  }

  async lpush(key: string, value: string): Promise<number> {
    return await this.redis.lpush(key, value);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.redis.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.redis.lrange(key, start, stop);
  }

  async sadd(key: string, member: string): Promise<number> {
    return await this.redis.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    return await this.redis.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.redis.smembers(key);
  }

  async sismember(key: string, member: string): Promise<number> {
    return await this.redis.sismember(key, member);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return await this.redis.zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number, withScores?: boolean): Promise<string[]> {
    if (withScores) {
      return await this.redis.zrange(key, start, stop, 'WITHSCORES');
    }
    return await this.redis.zrange(key, start, stop);
  }

  async zscore(key: string, member: string): Promise<string | null> {
    return await this.redis.zscore(key, member);
  }

  async flushdb(): Promise<'OK'> {
    return await this.redis.flushdb();
  }

  async flushall(): Promise<'OK'> {
    return await this.redis.flushall();
  }

  async ping(): Promise<'PONG'> {
    return await this.redis.ping();
  }

  async quit(): Promise<'OK'> {
    return await this.redis.quit();
  }
} 
import { ICacheKeyGenerator } from '../../types/cache.js';
import crypto from 'crypto';

/**
 * Generates consistent cache keys for different data types
 */
export class CacheKeyGenerator implements ICacheKeyGenerator {
  private readonly separator = ':';
  private readonly prefix = 'flashscore';

  /**
   * Generate cache key for match data
   */
  generateMatchKey(matchId: string): string {
    return this.buildKey('match', matchId);
  }

  /**
   * Generate cache key for league data
   */
  generateLeagueKey(country: string, league: string): string {
    return this.buildKey('league', country, league);
  }

  /**
   * Generate cache key for season data
   */
  generateSeasonKey(country: string, league: string, season: string): string {
    return this.buildKey('season', country, league, season);
  }

  /**
   * Generate cache key for country data
   */
  generateCountryKey(country: string): string {
    return this.buildKey('country', country);
  }

  /**
   * Generate custom cache key with prefix and parts
   */
  generateCustomKey(prefix: string, ...parts: string[]): string {
    return this.buildKey(prefix, ...parts);
  }

  /**
   * Generate cache key for URL-based data
   */
  generateUrlKey(url: string): string {
    const urlHash = this.hashString(url);
    return this.buildKey('url', urlHash);
  }

  /**
   * Generate cache key for search results
   */
  generateSearchKey(query: string, filters?: Record<string, any>): string {
    const queryHash = this.hashString(query);
    const filtersHash = filters ? this.hashString(JSON.stringify(filters)) : '';
    return filtersHash 
      ? this.buildKey('search', queryHash, filtersHash)
      : this.buildKey('search', queryHash);
  }

  /**
   * Build cache key from parts
   */
  private buildKey(...parts: string[]): string {
    const sanitizedParts = [this.prefix, ...parts]
      .map(part => this.sanitizeKeyPart(part))
      .filter(part => part.length > 0);
    
    return sanitizedParts.join(this.separator);
  }

  /**
   * Sanitize individual key parts
   */
  private sanitizeKeyPart(part: string): string {
    return part
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Generate hash for string content
   */
  private hashString(content: string): string {
    return crypto
      .createHash('md5')
      .update(content)
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * Parse cache key to extract components
   */
  parseKey(key: string): { prefix: string; type: string; parts: string[] } {
    const parts = key.split(this.separator);
    if (parts.length < 2 || parts[0] !== this.prefix) {
      throw new Error(`Invalid cache key format: ${key}`);
    }

    return {
      prefix: parts[0],
      type: parts[1],
      parts: parts.slice(2)
    };
  }

  /**
   * Check if key matches pattern
   */
  matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(
      pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
    );
    return regex.test(key);
  }
}
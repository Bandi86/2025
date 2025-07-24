import { describe, it, expect } from '@jest/globals';
import { CacheKeyGenerator } from './cache-key-generator.js';

describe('CacheKeyGenerator', () => {
  let generator: CacheKeyGenerator;

  beforeEach(() => {
    generator = new CacheKeyGenerator();
  });

  describe('generateMatchKey', () => {
    it('should generate consistent match keys', () => {
      const matchId = 'match123';
      const key1 = generator.generateMatchKey(matchId);
      const key2 = generator.generateMatchKey(matchId);
      
      expect(key1).toBe(key2);
      expect(key1).toBe('flashscore:match:match123');
    });

    it('should sanitize match IDs', () => {
      const matchId = 'Match@123#Special!';
      const key = generator.generateMatchKey(matchId);
      
      expect(key).toBe('flashscore:match:match_123_special');
    });
  });

  describe('generateLeagueKey', () => {
    it('should generate consistent league keys', () => {
      const country = 'England';
      const league = 'Premier League';
      const key1 = generator.generateLeagueKey(country, league);
      const key2 = generator.generateLeagueKey(country, league);
      
      expect(key1).toBe(key2);
      expect(key1).toBe('flashscore:league:england:premier_league');
    });

    it('should handle special characters in country and league names', () => {
      const country = 'São Paulo';
      const league = 'Série A';
      const key = generator.generateLeagueKey(country, league);
      
      expect(key).toBe('flashscore:league:s_o_paulo:s_rie_a');
    });
  });

  describe('generateSeasonKey', () => {
    it('should generate consistent season keys', () => {
      const country = 'Spain';
      const league = 'La Liga';
      const season = '2023-24';
      const key1 = generator.generateSeasonKey(country, league, season);
      const key2 = generator.generateSeasonKey(country, league, season);
      
      expect(key1).toBe(key2);
      expect(key1).toBe('flashscore:season:spain:la_liga:2023-24');
    });
  });

  describe('generateCountryKey', () => {
    it('should generate consistent country keys', () => {
      const country = 'Germany';
      const key1 = generator.generateCountryKey(country);
      const key2 = generator.generateCountryKey(country);
      
      expect(key1).toBe(key2);
      expect(key1).toBe('flashscore:country:germany');
    });
  });

  describe('generateCustomKey', () => {
    it('should generate custom keys with prefix and parts', () => {
      const key = generator.generateCustomKey('stats', 'team1', 'vs', 'team2');
      
      expect(key).toBe('flashscore:stats:team1:vs:team2');
    });

    it('should handle empty parts', () => {
      const key = generator.generateCustomKey('test', '', 'valid', '');
      
      expect(key).toBe('flashscore:test:valid');
    });
  });

  describe('generateUrlKey', () => {
    it('should generate consistent URL keys', () => {
      const url = 'https://example.com/match/123';
      const key1 = generator.generateUrlKey(url);
      const key2 = generator.generateUrlKey(url);
      
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^flashscore:url:[a-f0-9]{8}$/);
    });

    it('should generate different keys for different URLs', () => {
      const url1 = 'https://example.com/match/123';
      const url2 = 'https://example.com/match/456';
      const key1 = generator.generateUrlKey(url1);
      const key2 = generator.generateUrlKey(url2);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('generateSearchKey', () => {
    it('should generate search keys with query only', () => {
      const query = 'Manchester United';
      const key = generator.generateSearchKey(query);
      
      expect(key).toMatch(/^flashscore:search:[a-f0-9]{8}$/);
    });

    it('should generate search keys with query and filters', () => {
      const query = 'Manchester United';
      const filters = { league: 'Premier League', season: '2023-24' };
      const key = generator.generateSearchKey(query, filters);
      
      expect(key).toMatch(/^flashscore:search:[a-f0-9]{8}:[a-f0-9]{8}$/);
    });

    it('should generate consistent keys for same query and filters', () => {
      const query = 'Liverpool';
      const filters = { league: 'Premier League' };
      const key1 = generator.generateSearchKey(query, filters);
      const key2 = generator.generateSearchKey(query, filters);
      
      expect(key1).toBe(key2);
    });
  });

  describe('parseKey', () => {
    it('should parse valid cache keys', () => {
      const key = 'flashscore:match:match123';
      const parsed = generator.parseKey(key);
      
      expect(parsed).toEqual({
        prefix: 'flashscore',
        type: 'match',
        parts: ['match123']
      });
    });

    it('should parse keys with multiple parts', () => {
      const key = 'flashscore:league:england:premier_league';
      const parsed = generator.parseKey(key);
      
      expect(parsed).toEqual({
        prefix: 'flashscore',
        type: 'league',
        parts: ['england', 'premier_league']
      });
    });

    it('should throw error for invalid key format', () => {
      const invalidKey = 'invalid:key:format';
      
      expect(() => generator.parseKey(invalidKey)).toThrow('Invalid cache key format');
    });
  });

  describe('matchesPattern', () => {
    it('should match wildcard patterns', () => {
      const key = 'flashscore:match:match123';
      
      expect(generator.matchesPattern(key, 'flashscore:match:*')).toBe(true);
      expect(generator.matchesPattern(key, 'flashscore:*')).toBe(true);
      expect(generator.matchesPattern(key, '*:match:*')).toBe(true);
    });

    it('should match single character patterns', () => {
      const key = 'flashscore:match:match1';
      
      expect(generator.matchesPattern(key, 'flashscore:match:match?')).toBe(true);
      expect(generator.matchesPattern(key, 'flashscore:match:match??')).toBe(false);
    });

    it('should not match non-matching patterns', () => {
      const key = 'flashscore:match:match123';
      
      expect(generator.matchesPattern(key, 'flashscore:league:*')).toBe(false);
      expect(generator.matchesPattern(key, 'other:*')).toBe(false);
    });
  });
});
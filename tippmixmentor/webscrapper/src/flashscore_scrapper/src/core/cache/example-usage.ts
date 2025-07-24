/**
 * Example usage of the intelligent caching system
 * This demonstrates how to integrate caching into the Flashscore scraper
 */

import { CacheManager } from './cache-manager.js';
import { MatchData } from '../../types/core.js';
import path from 'path';

// Example: Cached scraping service
export class CachedScrapingService {
  private cacheManager: CacheManager;

  constructor(cacheDir: string = './cache') {
    this.cacheManager = new CacheManager(cacheDir, {
      ttl: 3600000, // 1 hour default TTL
      maxEntries: 1000,
      compressionEnabled: true,
      cleanupInterval: 300000 // 5 minutes
    });

    // Add event listener for cache monitoring
    this.cacheManager.addEventListener({
      onCacheEvent: (event) => {
        console.log(`Cache ${event.type}: ${event.key} at ${event.timestamp.toISOString()}`);
      }
    });
  }

  /**
   * Get match data with caching
   */
  async getMatchData(matchId: string): Promise<MatchData | null> {
    const keyGenerator = this.cacheManager.getKeyGenerator();
    const cacheKey = keyGenerator.generateMatchKey(matchId);

    // Try to get from cache first
    let matchData = await this.cacheManager.get<MatchData>(cacheKey);
    
    if (matchData) {
      console.log(`✅ Cache hit for match ${matchId}`);
      return matchData;
    }

    console.log(`❌ Cache miss for match ${matchId}, scraping...`);
    
    // Simulate scraping (replace with actual scraping logic)
    matchData = await this.scrapeMatchData(matchId);
    
    if (matchData) {
      // Cache the scraped data
      await this.cacheManager.set(cacheKey, matchData);
      console.log(`💾 Cached match data for ${matchId}`);
    }

    return matchData;
  }

  /**
   * Get league matches with caching
   */
  async getLeagueMatches(country: string, league: string): Promise<MatchData[]> {
    const keyGenerator = this.cacheManager.getKeyGenerator();
    const cacheKey = keyGenerator.generateLeagueKey(country, league);

    // Try cache first
    let matches = await this.cacheManager.get<MatchData[]>(cacheKey);
    
    if (matches) {
      console.log(`✅ Cache hit for league ${country}/${league}`);
      return matches;
    }

    console.log(`❌ Cache miss for league ${country}/${league}, scraping...`);
    
    // Simulate scraping
    matches = await this.scrapeLeagueMatches(country, league);
    
    if (matches) {
      // Cache with shorter TTL for league data (more dynamic)
      await this.cacheManager.set(cacheKey, matches, 1800000); // 30 minutes
      console.log(`💾 Cached ${matches.length} matches for ${country}/${league}`);
    }

    return matches || [];
  }

  /**
   * Invalidate cache for specific patterns
   */
  async invalidateLeague(country: string, league: string): Promise<void> {
    const keyGenerator = this.cacheManager.getKeyGenerator();
    const pattern = keyGenerator.generateLeagueKey(country, league) + '*';
    
    const invalidatedCount = await this.cacheManager.invalidatePattern(pattern);
    console.log(`🗑️ Invalidated ${invalidatedCount} cache entries for ${country}/${league}`);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    const stats = await this.cacheManager.getStats();
    
    console.log('📊 Cache Statistics:');
    console.log(`   Total entries: ${stats.totalEntries}`);
    console.log(`   Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
    console.log(`   Hits: ${stats.hitCount}, Misses: ${stats.missCount}`);
    console.log(`   Evictions: ${stats.evictionCount}`);
    
    return stats;
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    const cleanedCount = await this.cacheManager.cleanup();
    console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
  }

  /**
   * Export cache for backup
   */
  async exportCache(filePath: string): Promise<void> {
    const exportData = await this.cacheManager.export();
    
    // In a real implementation, you'd save this to a file
    console.log(`📤 Exported ${exportData.entries.length} cache entries`);
    console.log(`   Export timestamp: ${exportData.exportedAt.toISOString()}`);
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    this.cacheManager.destroy();
  }

  // Simulated scraping methods (replace with actual implementation)
  private async scrapeMatchData(matchId: string): Promise<MatchData | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      id: matchId,
      stage: 'Final',
      date: new Date(),
      status: 'finished',
      home: { name: 'Team A' },
      away: { name: 'Team B' },
      result: { home: '2', away: '1' },
      information: [],
      statistics: []
    };
  }

  private async scrapeLeagueMatches(country: string, league: string): Promise<MatchData[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      {
        id: 'match1',
        stage: 'Round 1',
        date: new Date(),
        status: 'finished',
        home: { name: 'Team A' },
        away: { name: 'Team B' },
        result: { home: '1', away: '0' },
        information: [],
        statistics: []
      },
      {
        id: 'match2',
        stage: 'Round 1',
        date: new Date(),
        status: 'finished',
        home: { name: 'Team C' },
        away: { name: 'Team D' },
        result: { home: '2', away: '2' },
        information: [],
        statistics: []
      }
    ];
  }
}

// Example usage
export async function demonstrateCaching() {
  console.log('🚀 Demonstrating intelligent caching system...\n');

  const cachedService = new CachedScrapingService('./demo-cache');

  try {
    // Test 1: Match data caching
    console.log('1. Testing match data caching:');
    await cachedService.getMatchData('match123'); // Cache miss
    await cachedService.getMatchData('match123'); // Cache hit
    
    // Test 2: League data caching
    console.log('\n2. Testing league data caching:');
    await cachedService.getLeagueMatches('England', 'Premier League'); // Cache miss
    await cachedService.getLeagueMatches('England', 'Premier League'); // Cache hit
    
    // Test 3: Cache statistics
    console.log('\n3. Cache statistics:');
    await cachedService.getCacheStats();
    
    // Test 4: Cache invalidation
    console.log('\n4. Testing cache invalidation:');
    await cachedService.invalidateLeague('England', 'Premier League');
    
    // Test 5: Cache export
    console.log('\n5. Testing cache export:');
    await cachedService.exportCache('./cache-backup.json');
    
    // Test 6: Cleanup
    console.log('\n6. Testing cleanup:');
    await cachedService.cleanup();
    
  } finally {
    cachedService.destroy();
  }

  console.log('\n✅ Caching demonstration completed!');
}

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateCaching().catch(console.error);
}
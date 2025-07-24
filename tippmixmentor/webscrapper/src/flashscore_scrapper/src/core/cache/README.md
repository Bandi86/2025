# Intelligent Caching System

This module provides a comprehensive, file-system based caching solution with TTL support, data validation, and intelligent cleanup mechanisms for the Flashscore scraper.

## Features

- **File-system based storage** with configurable compression
- **TTL (Time To Live) support** with automatic expiration
- **Data validation** using checksums and timestamps
- **Pattern-based invalidation** for bulk cache operations
- **Event system** for monitoring cache operations
- **Statistics tracking** for performance monitoring
- **Export/Import functionality** for backup and migration
- **Automatic cleanup** of expired entries
- **Memory-efficient** with configurable size limits

## Quick Start

```typescript
import { CacheManager } from './core/cache/index.js';

// Create cache manager
const cache = new CacheManager('./cache', {
  ttl: 3600000,        // 1 hour default TTL
  maxEntries: 1000,    // Maximum number of entries
  compressionEnabled: true,
  cleanupInterval: 300000  // 5 minutes cleanup interval
});

// Store data
await cache.set('my-key', { data: 'value' });

// Retrieve data
const data = await cache.get('my-key');

// Check if key exists
const exists = await cache.has('my-key');

// Delete entry
await cache.delete('my-key');
```

## Core Components

### CacheManager

The main orchestrator that provides high-level caching operations:

```typescript
const cacheManager = new CacheManager('./cache-dir', options);

// Basic operations
await cacheManager.set(key, value, ttl?);
const value = await cacheManager.get(key);
await cacheManager.delete(key);
await cacheManager.clear();

// Advanced operations
await cacheManager.invalidatePattern('user:*');
const stats = await cacheManager.getStats();
const exportData = await cacheManager.export();
```

### CacheKeyGenerator

Generates consistent, safe cache keys for different data types:

```typescript
const keyGen = new CacheKeyGenerator();

const matchKey = keyGen.generateMatchKey('match123');
// Result: 'flashscore:match:match123'

const leagueKey = keyGen.generateLeagueKey('England', 'Premier League');
// Result: 'flashscore:league:england:premier_league'

const seasonKey = keyGen.generateSeasonKey('Spain', 'La Liga', '2023-24');
// Result: 'flashscore:season:spain:la_liga:2023-24'
```

### CacheValidator

Validates cache entries using checksums and timestamps:

```typescript
const validator = new CacheValidator();

// Validate data integrity
const isValid = validator.validate(data);

// Generate checksum
const checksum = validator.generateChecksum(data);

// Check if entry is expired
const isExpired = validator.isExpired(cacheEntry);

// Complete entry validation
const result = validator.validateEntry(cacheEntry);
```

### FileSystemCache

Low-level file-system cache implementation:

```typescript
const fsCache = new FileSystemCache('./cache', {
  ttl: 3600000,
  maxEntries: 500,
  compressionEnabled: true
});

await fsCache.set('key', value);
const retrieved = await fsCache.get('key');
```

## Configuration Options

```typescript
interface CacheOptions {
  ttl: number;                    // Default TTL in milliseconds
  maxSize: number;                // Maximum cache size in bytes
  maxEntries: number;             // Maximum number of entries
  compressionEnabled: boolean;    // Enable gzip compression
  persistToDisk: boolean;         // Enable disk persistence
  diskPath?: string;              // Custom disk path
  cleanupInterval: number;        // Cleanup interval in milliseconds
}
```

## Usage Patterns

### Basic Caching

```typescript
// Simple key-value caching
await cache.set('user:123', userData);
const user = await cache.get('user:123');
```

### TTL-based Caching

```typescript
// Cache with custom TTL (5 minutes)
await cache.set('temp-data', data, 300000);
```

### Pattern-based Operations

```typescript
// Cache multiple related entries
await cache.set('user:123:profile', profileData);
await cache.set('user:123:settings', settingsData);
await cache.set('user:123:preferences', prefsData);

// Invalidate all user:123 entries
await cache.invalidatePattern('user:123:*');
```

### Event Monitoring

```typescript
cache.addEventListener({
  onCacheEvent: (event) => {
    console.log(`${event.type}: ${event.key} at ${event.timestamp}`);
  }
});
```

### Statistics and Monitoring

```typescript
const stats = await cache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Cache hits: ${stats.hitCount}`);
console.log(`Cache misses: ${stats.missCount}`);
```

## Integration with Scraping Services

```typescript
class CachedScrapingService {
  constructor() {
    this.cache = new CacheManager('./scraper-cache');
  }

  async getMatchData(matchId: string): Promise<MatchData> {
    const keyGen = this.cache.getKeyGenerator();
    const cacheKey = keyGen.generateMatchKey(matchId);
    
    // Try cache first
    let data = await this.cache.get(cacheKey);
    if (data) return data;
    
    // Scrape if not cached
    data = await this.scrapeMatch(matchId);
    await this.cache.set(cacheKey, data);
    
    return data;
  }
}
```

## Cache Key Strategies

The system provides several key generation strategies:

- **Match keys**: `flashscore:match:{matchId}`
- **League keys**: `flashscore:league:{country}:{league}`
- **Season keys**: `flashscore:season:{country}:{league}:{season}`
- **Country keys**: `flashscore:country:{country}`
- **URL keys**: `flashscore:url:{urlHash}`
- **Search keys**: `flashscore:search:{queryHash}:{filtersHash?}`
- **Custom keys**: `flashscore:{prefix}:{...parts}`

## Error Handling

The cache system handles errors gracefully:

- **File system errors**: Logged as warnings, operations continue
- **Corrupted data**: Automatically removed from cache
- **Expired entries**: Automatically cleaned up
- **Invalid checksums**: Entries are invalidated and removed

## Performance Considerations

- **Compression**: Reduces disk usage but adds CPU overhead
- **TTL**: Shorter TTLs reduce stale data but increase cache misses
- **Max entries**: Prevents unlimited growth but may cause evictions
- **Cleanup interval**: More frequent cleanup uses more CPU but keeps cache clean

## Testing

The module includes comprehensive tests:

```bash
# Run all cache tests
npm test -- --testPathPatterns="src/core/cache"

# Run manual tests
node --loader ts-node/esm src/core/cache/manual-test.ts

# Run example demonstration
node --loader ts-node/esm src/core/cache/run-example.ts
```

## File Structure

```
src/core/cache/
├── index.ts                    # Module exports
├── cache-manager.ts           # Main cache orchestrator
├── filesystem-cache.ts        # File-system implementation
├── cache-key-generator.ts     # Key generation utilities
├── cache-validator.ts         # Data validation
├── cache-utils.ts            # Utility functions
├── example-usage.ts          # Usage examples
├── manual-test.ts           # Manual testing
├── run-example.ts           # Example runner
├── README.md                # This documentation
└── *.test.ts               # Unit tests
```

## Requirements Satisfied

This implementation satisfies all the requirements from the task:

- ✅ **3.1**: File-system based cache with TTL support
- ✅ **3.2**: Cache key generation strategies for different data types
- ✅ **3.3**: Cache validation using checksums and timestamps
- ✅ **3.4**: Cache cleanup and invalidation mechanisms
- ✅ **3.5**: Comprehensive tests for cache operations and TTL behavior

The system is production-ready and provides enterprise-grade caching capabilities for the Flashscore scraper project.
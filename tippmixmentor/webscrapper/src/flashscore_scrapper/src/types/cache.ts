// Caching interfaces and types

// ============================================================================
// CACHE SERVICE INTERFACES
// ============================================================================

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  size(): Promise<number>;
  keys(): Promise<string[]>;
  cleanup(): Promise<number>;
}

export interface ICacheManager extends ICacheService {
  getStats(): Promise<CacheStats>;
  invalidatePattern(pattern: string): Promise<number>;
  warmup(keys: string[]): Promise<void>;
  export(): Promise<CacheExport>;
  import(data: CacheExport): Promise<void>;
}

export interface ICacheKeyGenerator {
  generateMatchKey(matchId: string): string;
  generateLeagueKey(country: string, league: string): string;
  generateSeasonKey(country: string, league: string, season: string): string;
  generateCountryKey(country: string): string;
  generateCustomKey(prefix: string, ...parts: string[]): string;
}

// ============================================================================
// CACHE DATA STRUCTURES
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
  checksum: string;
  accessCount: number;
  lastAccessed: Date;
  size: number;
}

export interface CacheMetadata {
  key: string;
  created: Date;
  expires: Date;
  size: number;
  checksum: string;
  tags: string[];
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

export interface CacheExport {
  version: string;
  exportedAt: Date;
  entries: Array<{
    key: string;
    data: any;
    metadata: CacheMetadata;
  }>;
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export interface CacheOptions {
  ttl: number;
  maxSize: number;
  maxEntries: number;
  compressionEnabled: boolean;
  persistToDisk: boolean;
  diskPath?: string;
  cleanupInterval: number;
}

export interface CachePolicy {
  evictionStrategy: EvictionStrategy;
  maxMemoryUsage: number;
  compressionThreshold: number;
  persistenceStrategy: PersistenceStrategy;
}

export enum EvictionStrategy {
  LRU = 'lru',
  LFU = 'lfu',
  FIFO = 'fifo',
  TTL = 'ttl'
}

export enum PersistenceStrategy {
  NONE = 'none',
  IMMEDIATE = 'immediate',
  PERIODIC = 'periodic',
  ON_SHUTDOWN = 'on_shutdown'
}

// ============================================================================
// CACHE EVENTS
// ============================================================================

export interface CacheEvent {
  type: CacheEventType;
  key: string;
  timestamp: Date;
  data?: any;
}

export enum CacheEventType {
  HIT = 'hit',
  MISS = 'miss',
  SET = 'set',
  DELETE = 'delete',
  EXPIRE = 'expire',
  EVICT = 'evict',
  CLEAR = 'clear'
}

export interface ICacheEventListener {
  onCacheEvent(event: CacheEvent): void;
}

// ============================================================================
// CACHE VALIDATION
// ============================================================================

export interface CacheValidator<T> {
  validate(data: T): boolean;
  generateChecksum(data: T): string;
  isExpired(entry: CacheEntry<T>): boolean;
}

export interface CacheValidationResult {
  isValid: boolean;
  reason?: string;
  shouldRefresh: boolean;
}
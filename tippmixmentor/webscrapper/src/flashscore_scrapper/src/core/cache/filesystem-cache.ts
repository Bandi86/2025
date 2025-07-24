import { ICacheService, CacheEntry, CacheOptions } from '../../types/cache.js';
import { CacheValidator } from './cache-validator.js';
import { CacheUtils } from './cache-utils.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * File-system based cache implementation with TTL support
 */
export class FileSystemCache implements ICacheService {
  private readonly cacheDir: string;
  private readonly validator: CacheValidator<any>;
  private readonly options: Required<CacheOptions>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(cacheDir: string, options: Partial<CacheOptions> = {}) {
    this.cacheDir = cacheDir;
    this.validator = new CacheValidator();
    this.options = {
      ttl: options.ttl ?? 3600000, // 1 hour default
      maxSize: options.maxSize ?? 100 * 1024 * 1024, // 100MB default
      maxEntries: options.maxEntries ?? 1000,
      compressionEnabled: options.compressionEnabled ?? true,
      persistToDisk: options.persistToDisk ?? true,
      diskPath: options.diskPath ?? cacheDir,
      cleanupInterval: options.cleanupInterval ?? 300000 // 5 minutes default
    };

    this.initialize();
  }

  /**
   * Initialize cache directory and cleanup timer
   */
  private async initialize(): Promise<void> {
    try {
      await CacheUtils.ensureDirectory(this.cacheDir);
      
      // Validate cache directory permissions
      const isValid = await CacheUtils.validateCacheDirectory(this.cacheDir);
      if (!isValid) {
        throw new Error(`Cache directory is not writable: ${this.cacheDir}`);
      }

      // Start cleanup timer
      this.startCleanupTimer();
    } catch (error) {
      throw new Error(`Failed to initialize cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const filePath = CacheUtils.getFilePath(this.cacheDir, key);
      
      if (!(await CacheUtils.fileExists(filePath))) {
        return null;
      }

      const fileContent = await fs.readFile(filePath);
      let entry: CacheEntry<T>;

      if (this.options.compressionEnabled) {
        const decompressed = await CacheUtils.decompressData(fileContent);
        entry = this.deserializeEntry(decompressed);
      } else {
        const parsed = JSON.parse(fileContent.toString('utf8'));
        entry = this.deserializeEntry(parsed);
      }

      // Validate entry
      const validation = this.validator.validateEntry(entry);
      if (!validation.isValid) {
        await this.delete(key);
        return null;
      }

      // Update access metadata
      entry.accessCount++;
      entry.lastAccessed = new Date();
      await this.saveEntry(key, entry);

      return entry.data;
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const effectiveTtl = ttl ?? this.options.ttl;
      const checksum = this.validator.generateChecksum(value);
      const entry = CacheUtils.createCacheEntry(value, effectiveTtl, checksum);

      await this.saveEntry(key, entry);
      
      // Check if we need to cleanup old entries
      await this.enforceMaxEntries();
    } catch (error) {
      throw new Error(`Failed to set cache entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      const filePath = CacheUtils.getFilePath(this.cacheDir, key);
      
      if (!(await CacheUtils.fileExists(filePath))) {
        return false;
      }

      // Quick check without loading full data
      const stats = await CacheUtils.getFileStats(filePath);
      if (!stats) return false;

      // Check if file is too old (basic TTL check)
      const maxAge = this.options.ttl;
      const age = Date.now() - stats.mtime.getTime();
      
      if (age > maxAge) {
        await this.delete(key);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete entry from cache
   */
  async delete(key: string): Promise<void> {
    try {
      const filePath = CacheUtils.getFilePath(this.cacheDir, key);
      
      if (await CacheUtils.fileExists(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      
      for (const file of files) {
        if (file.endsWith('.cache')) {
          const filePath = path.join(this.cacheDir, file);
          try {
            await fs.unlink(filePath);
          } catch {
            // Ignore individual file errors
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get number of entries in cache
   */
  async size(): Promise<number> {
    try {
      const files = await fs.readdir(this.cacheDir);
      return files.filter(file => file.endsWith('.cache')).length;
    } catch {
      return 0;
    }
  }

  /**
   * Get all cache keys
   */
  async keys(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.cacheDir);
      return files
        .filter(file => file.endsWith('.cache'))
        .map(file => file.replace('.cache', '').replace(/_/g, ':'));
    } catch {
      return [];
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<number> {
    try {
      return await CacheUtils.cleanupExpiredFiles(this.cacheDir, this.options.ttl);
    } catch {
      return 0;
    }
  }

  /**
   * Save cache entry to file
   */
  private async saveEntry<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    const filePath = CacheUtils.getFilePath(this.cacheDir, key);
    const serializedEntry = this.serializeEntry(entry);
    
    let content: Buffer;
    if (this.options.compressionEnabled) {
      content = await CacheUtils.compressData(serializedEntry);
    } else {
      content = Buffer.from(JSON.stringify(serializedEntry), 'utf8');
    }

    await fs.writeFile(filePath, content);
  }

  /**
   * Serialize cache entry for storage
   */
  private serializeEntry<T>(entry: CacheEntry<T>): any {
    return {
      ...entry,
      timestamp: entry.timestamp.toISOString(),
      lastAccessed: entry.lastAccessed.toISOString()
    };
  }

  /**
   * Deserialize cache entry from storage
   */
  private deserializeEntry<T>(data: any): CacheEntry<T> {
    return {
      ...data,
      timestamp: new Date(data.timestamp),
      lastAccessed: new Date(data.lastAccessed)
    };
  }

  /**
   * Enforce maximum number of entries
   */
  private async enforceMaxEntries(): Promise<void> {
    try {
      const currentSize = await this.size();
      
      if (currentSize <= this.options.maxEntries) {
        return;
      }

      const files = await fs.readdir(this.cacheDir);
      const cacheFiles = files
        .filter(file => file.endsWith('.cache'))
        .map(file => ({
          name: file,
          path: path.join(this.cacheDir, file)
        }));

      // Sort by modification time (oldest first)
      const filesWithStats = await Promise.all(
        cacheFiles.map(async file => {
          const stats = await CacheUtils.getFileStats(file.path);
          return {
            ...file,
            mtime: stats?.mtime || new Date(0)
          };
        })
      );

      filesWithStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

      // Remove oldest files
      const filesToRemove = filesWithStats.slice(0, currentSize - this.options.maxEntries);
      
      for (const file of filesToRemove) {
        try {
          await fs.unlink(file.path);
        } catch {
          // Ignore individual file errors
        }
      }
    } catch (error) {
      console.warn('Error enforcing max entries:', error);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        console.warn('Scheduled cleanup error:', error);
      }
    }, this.options.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}
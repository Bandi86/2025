import { CacheEntry, CacheMetadata } from '../../types/cache.js';
import { promises as fs } from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Utility functions for cache operations
 */
export class CacheUtils {
  /**
   * Calculate size of data in bytes
   */
  static calculateSize(data: any): number {
    try {
      const serialized = JSON.stringify(data);
      return Buffer.byteLength(serialized, 'utf8');
    } catch {
      return 0;
    }
  }

  /**
   * Compress data using gzip
   */
  static async compressData(data: any): Promise<Buffer> {
    const serialized = JSON.stringify(data);
    return await gzip(Buffer.from(serialized, 'utf8'));
  }

  /**
   * Decompress gzipped data
   */
  static async decompressData(compressedData: Buffer): Promise<any> {
    const decompressed = await gunzip(compressedData);
    return JSON.parse(decompressed.toString('utf8'));
  }

  /**
   * Create cache entry with metadata
   */
  static createCacheEntry<T>(
    data: T,
    ttl: number,
    checksum: string
  ): CacheEntry<T> {
    const now = new Date();
    return {
      data,
      timestamp: now,
      ttl,
      checksum,
      accessCount: 0,
      lastAccessed: now,
      size: this.calculateSize(data)
    };
  }

  /**
   * Create cache metadata
   */
  static createCacheMetadata(
    key: string,
    entry: CacheEntry<any>,
    tags: string[] = []
  ): CacheMetadata {
    return {
      key,
      created: entry.timestamp,
      expires: new Date(entry.timestamp.getTime() + entry.ttl),
      size: entry.size,
      checksum: entry.checksum,
      tags
    };
  }

  /**
   * Ensure directory exists
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Generate safe filename from cache key
   */
  static generateFileName(key: string): string {
    return key
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') + '.cache';
  }

  /**
   * Get file path for cache key
   */
  static getFilePath(cacheDir: string, key: string): string {
    const fileName = this.generateFileName(key);
    return path.join(cacheDir, fileName);
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  static async getFileStats(filePath: string): Promise<{ size: number; mtime: Date } | null> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime
      };
    } catch {
      return null;
    }
  }

  /**
   * Clean up expired files in directory
   */
  static async cleanupExpiredFiles(
    cacheDir: string,
    maxAge: number
  ): Promise<number> {
    try {
      const files = await fs.readdir(cacheDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.cache')) continue;

        const filePath = path.join(cacheDir, file);
        const stats = await this.getFileStats(filePath);
        
        if (stats && (now - stats.mtime.getTime()) > maxAge) {
          try {
            await fs.unlink(filePath);
            cleanedCount++;
          } catch {
            // Ignore errors when deleting individual files
          }
        }
      }

      return cleanedCount;
    } catch {
      return 0;
    }
  }

  /**
   * Get directory size in bytes
   */
  static async getDirectorySize(dirPath: string): Promise<number> {
    try {
      const files = await fs.readdir(dirPath);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await this.getFileStats(filePath);
        if (stats) {
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration to human readable string
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Validate cache directory permissions
   */
  static async validateCacheDirectory(cacheDir: string): Promise<boolean> {
    try {
      await this.ensureDirectory(cacheDir);
      
      // Test write permissions
      const testFile = path.join(cacheDir, '.test-write');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      
      return true;
    } catch {
      return false;
    }
  }
}
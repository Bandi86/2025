import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CacheUtils } from './cache-utils.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('CacheUtils', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-utils-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('calculateSize', () => {
    it('should calculate size of different data types', () => {
      expect(CacheUtils.calculateSize('hello')).toBeGreaterThan(0);
      expect(CacheUtils.calculateSize(123)).toBeGreaterThan(0);
      expect(CacheUtils.calculateSize({ name: 'test', value: 123 })).toBeGreaterThan(0);
      expect(CacheUtils.calculateSize([1, 2, 3])).toBeGreaterThan(0);
    });

    it('should return 0 for invalid data', () => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData;
      
      expect(CacheUtils.calculateSize(circularData)).toBe(0);
    });

    it('should calculate consistent sizes', () => {
      const data = { name: 'test', value: 123 };
      const size1 = CacheUtils.calculateSize(data);
      const size2 = CacheUtils.calculateSize(data);
      
      expect(size1).toBe(size2);
      expect(size1).toBeGreaterThan(0);
    });
  });

  describe('compression', () => {
    it('should compress and decompress data', async () => {
      const originalData = {
        name: 'test data',
        values: [1, 2, 3, 4, 5],
        nested: {
          property: 'value',
          array: ['a', 'b', 'c']
        }
      };
      
      const compressed = await CacheUtils.compressData(originalData);
      expect(compressed).toBeInstanceOf(Buffer);
      expect(compressed.length).toBeGreaterThan(0);
      
      const decompressed = await CacheUtils.decompressData(compressed);
      expect(decompressed).toEqual(originalData);
    });

    it('should handle empty data', async () => {
      const emptyData = {};
      
      const compressed = await CacheUtils.compressData(emptyData);
      const decompressed = await CacheUtils.decompressData(compressed);
      
      expect(decompressed).toEqual(emptyData);
    });

    it('should handle string data', async () => {
      const stringData = 'This is a test string for compression';
      
      const compressed = await CacheUtils.compressData(stringData);
      const decompressed = await CacheUtils.decompressData(compressed);
      
      expect(decompressed).toBe(stringData);
    });
  });

  describe('createCacheEntry', () => {
    it('should create cache entry with correct properties', () => {
      const data = { name: 'test', value: 123 };
      const ttl = 1000;
      const checksum = 'test-checksum';
      
      const entry = CacheUtils.createCacheEntry(data, ttl, checksum);
      
      expect(entry.data).toEqual(data);
      expect(entry.ttl).toBe(ttl);
      expect(entry.checksum).toBe(checksum);
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.lastAccessed).toBeInstanceOf(Date);
      expect(entry.accessCount).toBe(0);
      expect(entry.size).toBeGreaterThan(0);
    });
  });

  describe('createCacheMetadata', () => {
    it('should create cache metadata with correct properties', () => {
      const key = 'test-key';
      const data = { name: 'test' };
      const ttl = 1000;
      const checksum = 'test-checksum';
      const tags = ['tag1', 'tag2'];
      
      const entry = CacheUtils.createCacheEntry(data, ttl, checksum);
      const metadata = CacheUtils.createCacheMetadata(key, entry, tags);
      
      expect(metadata.key).toBe(key);
      expect(metadata.created).toEqual(entry.timestamp);
      expect(metadata.expires).toBeInstanceOf(Date);
      expect(metadata.size).toBe(entry.size);
      expect(metadata.checksum).toBe(checksum);
      expect(metadata.tags).toEqual(tags);
    });

    it('should handle empty tags', () => {
      const key = 'test-key';
      const data = { name: 'test' };
      const ttl = 1000;
      const checksum = 'test-checksum';
      
      const entry = CacheUtils.createCacheEntry(data, ttl, checksum);
      const metadata = CacheUtils.createCacheMetadata(key, entry);
      
      expect(metadata.tags).toEqual([]);
    });
  });

  describe('file operations', () => {
    it('should ensure directory exists', async () => {
      const testDir = path.join(tempDir, 'nested', 'directory');
      
      expect(await CacheUtils.fileExists(testDir)).toBe(false);
      
      await CacheUtils.ensureDirectory(testDir);
      
      expect(await CacheUtils.fileExists(testDir)).toBe(true);
    });

    it('should handle existing directory', async () => {
      await CacheUtils.ensureDirectory(tempDir);
      
      // Should not throw when directory already exists
      await expect(CacheUtils.ensureDirectory(tempDir)).resolves.not.toThrow();
    });

    it('should generate safe filenames', () => {
      const testCases = [
        { input: 'simple-key', expected: 'simple-key.cache' },
        { input: 'key:with:colons', expected: 'key:with:colons.cache' },
        { input: 'key@with#special!chars', expected: 'key_with_special_chars.cache' },
        { input: 'key___with___underscores', expected: 'key_with_underscores.cache' }
      ];
      
      for (const testCase of testCases) {
        const result = CacheUtils.generateFileName(testCase.input);
        expect(result).toBe(testCase.expected);
      }
    });

    it('should get correct file path', () => {
      const cacheDir = '/cache/dir';
      const key = 'test-key';
      
      const filePath = CacheUtils.getFilePath(cacheDir, key);
      
      expect(filePath).toBe(path.join(cacheDir, 'test-key.cache'));
    });

    it('should check file existence', async () => {
      const testFile = path.join(tempDir, 'test-file.txt');
      
      expect(await CacheUtils.fileExists(testFile)).toBe(false);
      
      await fs.writeFile(testFile, 'test content');
      
      expect(await CacheUtils.fileExists(testFile)).toBe(true);
    });

    it('should get file stats', async () => {
      const testFile = path.join(tempDir, 'stats-test.txt');
      const content = 'test content for stats';
      
      await fs.writeFile(testFile, content);
      
      const stats = await CacheUtils.getFileStats(testFile);
      
      expect(stats).not.toBeNull();
      expect(stats!.size).toBeGreaterThan(0);
      expect(stats!.mtime).toBeInstanceOf(Date);
    });

    it('should return null for non-existent file stats', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.txt');
      
      const stats = await CacheUtils.getFileStats(nonExistentFile);
      
      expect(stats).toBeNull();
    });
  });

  describe('cleanup operations', () => {
    it('should cleanup expired files', async () => {
      const maxAge = 100; // 0.1 seconds
      
      // Create test files
      const file1 = path.join(tempDir, 'old-file.cache');
      const file2 = path.join(tempDir, 'new-file.cache');
      const file3 = path.join(tempDir, 'not-cache.txt');
      
      await fs.writeFile(file1, 'old content');
      await fs.writeFile(file3, 'not a cache file');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 150));
      
      await fs.writeFile(file2, 'new content');
      
      const cleanedCount = await CacheUtils.cleanupExpiredFiles(tempDir, maxAge);
      
      expect(cleanedCount).toBe(1);
      expect(await CacheUtils.fileExists(file1)).toBe(false);
      expect(await CacheUtils.fileExists(file2)).toBe(true);
      expect(await CacheUtils.fileExists(file3)).toBe(true); // Non-cache file should remain
    });

    it('should handle cleanup errors gracefully', async () => {
      const nonExistentDir = path.join(tempDir, 'non-existent');
      
      const cleanedCount = await CacheUtils.cleanupExpiredFiles(nonExistentDir, 1000);
      
      expect(cleanedCount).toBe(0);
    });
  });

  describe('directory operations', () => {
    it('should calculate directory size', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      
      await fs.writeFile(file1, 'content1');
      await fs.writeFile(file2, 'content2');
      
      const size = await CacheUtils.getDirectorySize(tempDir);
      
      expect(size).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent directory', async () => {
      const nonExistentDir = path.join(tempDir, 'non-existent');
      
      const size = await CacheUtils.getDirectorySize(nonExistentDir);
      
      expect(size).toBe(0);
    });

    it('should validate cache directory permissions', async () => {
      const validDir = tempDir;
      const isValid = await CacheUtils.validateCacheDirectory(validDir);
      
      expect(isValid).toBe(true);
    });
  });

  describe('formatting utilities', () => {
    it('should format bytes correctly', () => {
      expect(CacheUtils.formatBytes(0)).toBe('0 B');
      expect(CacheUtils.formatBytes(1024)).toBe('1 KB');
      expect(CacheUtils.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(CacheUtils.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(CacheUtils.formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format duration correctly', () => {
      expect(CacheUtils.formatDuration(1000)).toBe('1s');
      expect(CacheUtils.formatDuration(60000)).toBe('1m 0s');
      expect(CacheUtils.formatDuration(3600000)).toBe('1h 0m');
      expect(CacheUtils.formatDuration(86400000)).toBe('1d 0h');
      expect(CacheUtils.formatDuration(90000)).toBe('1m 30s');
    });
  });
});
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { CacheManager } from '../../../src/core/cache/cache-manager';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('CacheManager Integration', () => {
  let cacheManager: CacheManager;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-manager-int-test-'));
    cacheManager = new CacheManager(tempDir);
  });

  afterAll(async () => {
    cacheManager.destroy();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should persist data to the filesystem and retrieve it', async () => {
    const key = 'persist-key';
    const value = { data: 'is-persisted' };

    await cacheManager.set(key, value);

    // Create a new instance to simulate a restart
    const newCacheManager = new CacheManager(tempDir);
    const retrievedValue = await newCacheManager.get(key);

    expect(retrievedValue).toEqual(value);
    newCacheManager.destroy();
  });

  it('should invalidate cache and remove the file', async () => {
    const key = 'invalidate-key';
    const value = { data: 'to-be-invalidated' };

    await cacheManager.set(key, value);
    expect(await cacheManager.has(key)).toBe(true);

    await cacheManager.delete(key);
    expect(await cacheManager.has(key)).toBe(false);

    // Verify the file is gone
    const keyGenerator = cacheManager.getKeyGenerator();
    const filePath = path.join(tempDir, keyGenerator.generateCustomKey(key) + '.cache');

    await expect(fs.access(filePath)).rejects.toThrow();
  });
});
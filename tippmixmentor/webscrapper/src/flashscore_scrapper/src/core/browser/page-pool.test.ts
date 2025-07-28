/**
 * Unit tests for PagePool
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Page } from 'playwright';
import { PagePool } from './page-pool.js';
import { BrowserManager } from './browser-manager.js';
import { Logger } from '../logging/index.js';

// Mock dependencies
jest.mock('./browser-manager.js');
jest.mock('../logging/index.js', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

describe('PagePool', () => {
  let pagePool: PagePool;
  let mockBrowserManager: jest.Mocked<BrowserManager>;
  let mockLogger: jest.Mocked<Logger>;
  let mockPages: jest.Mocked<Page>[];

  beforeEach(() => {
    // Create mock pages
    mockPages = Array.from({ length: 5 }, (_, i) => ({
      close: jest.fn(),
      isClosed: jest.fn().mockReturnValue(false),
      goto: jest.fn(),
      removeAllListeners: jest.fn(),
      url: jest.fn().mockReturnValue(`http://example.com/page${i}`)
    } as any));

    // Mock BrowserManager
    mockBrowserManager = {
      getCurrentBrowser: jest.fn().mockReturnValue({}),
      createPage: jest.fn()
    } as any;

    // Set up createPage to return different pages
    let pageIndex = 0;
    mockBrowserManager.createPage.mockImplementation(() => {
      const page = mockPages[pageIndex % mockPages.length];
      pageIndex++;
      return Promise.resolve(page);
    });

    mockLogger = new Logger('test', {} as any, {} as any) as jest.Mocked<Logger>;

    pagePool = new PagePool(mockBrowserManager, {
      minPages: 2,
      maxPages: 4,
      idleTimeout: 1000,
      createTimeout: 5000
    }, mockLogger);
  });

  afterEach(async () => {
    await pagePool.destroy();
    jest.clearAllMocks();
  });

  describe('acquire', () => {
    it('should acquire page from pool', async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const page = await pagePool.acquire();

      expect(page).toEqual(mockPages[0]);
      expect(pagePool.availableCount()).toBeLessThan(2);
    });

    it('should create new page when pool is empty', async () => {
      // Acquire all available pages
      await pagePool.acquire();
      await pagePool.acquire();

      const page = await pagePool.acquire();

      expect(page).toBeDefined();
      expect(mockBrowserManager.createPage).toHaveBeenCalledTimes(3); // 2 initial + 1 new
    });

    it('should wait for available page when pool is full', async () => {
      // Fill the pool to max capacity
      const pages = await Promise.all([
        pagePool.acquire(),
        pagePool.acquire(),
        pagePool.acquire(),
        pagePool.acquire()
      ]);

      // Try to acquire another page (should wait)
      const acquirePromise = pagePool.acquire();

      // Release a page to make one available
      setTimeout(() => pagePool.release(pages[0]), 100);

      const page = await acquirePromise;
      expect(page).toBeDefined();
    });

    it('should handle invalid pages by recreating them', async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      // Make the first page invalid
      mockPages[0].isClosed.mockReturnValue(true);

      const page = await pagePool.acquire();

      expect(page).toBeDefined();
      expect(page).not.toBe(mockPages[0]); // Should get a different page
    });

    it('should throw error when pool is destroyed', async () => {
      await pagePool.destroy();

      await expect(pagePool.acquire()).rejects.toThrow('Page pool has been destroyed');
    });
  });

  describe('release', () => {
    it('should release page back to pool', async () => {
      const page = await pagePool.acquire();
      const initialAvailable = pagePool.availableCount();

      await pagePool.release(page);

      expect(pagePool.availableCount()).toBe(initialAvailable + 1);
      expect(mockPages[0].goto).toHaveBeenCalledWith('about:blank');
    });

    it('should handle release of unmanaged page', async () => {
      const unmanagedPage = mockPages[4]; // Not from pool

      await pagePool.release(unmanagedPage);

      expect(mockLogger.warn).toHaveBeenCalledWith('Attempted to release page not managed by this pool');
    });

    it('should remove page if cleanup fails', async () => {
      const page = await pagePool.acquire();
      const error = new Error('Cleanup failed');
      mockPages[0].goto.mockRejectedValueOnce(error);

      await pagePool.release(page);

      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to release page'), error);
    });

    it('should do nothing when pool is destroyed', async () => {
      const page = await pagePool.acquire();
      await pagePool.destroy();

      await pagePool.release(page);

      // Should not throw or cause issues
    });
  });

  describe('size and availableCount', () => {
    it('should return correct pool size', async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(pagePool.size()).toBe(2); // minPages
    });

    it('should return correct available count', async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const initialAvailable = pagePool.availableCount();
      await pagePool.acquire();

      expect(pagePool.availableCount()).toBe(initialAvailable - 1);
    });
  });

  describe('getStats', () => {
    it('should return pool statistics', async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = pagePool.getStats();

      expect(stats).toEqual({
        totalPages: expect.any(Number),
        availablePages: expect.any(Number),
        activePages: expect.any(Number),
        oldestPage: expect.any(Number),
        newestPage: expect.any(Number)
      });
    });

    it('should handle empty pool stats', async () => {
      const emptyPool = new PagePool(mockBrowserManager, { minPages: 0 }, mockLogger);

      const stats = emptyPool.getStats();

      expect(stats.oldestPage).toBeNull();
      expect(stats.newestPage).toBeNull();

      await emptyPool.destroy();
    });
  });

  describe('getPageInfos', () => {
    it('should return page information', async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const pageInfos = pagePool.getPageInfos();

      expect(pageInfos).toHaveLength(2); // minPages
      expect(pageInfos[0]).toEqual({
        id: expect.any(String),
        url: expect.any(String),
        title: '',
        createdAt: expect.any(Date),
        lastActivity: expect.any(Date),
        isActive: false
      });
    });
  });

  describe('destroy', () => {
    it('should destroy pool and close all pages', async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      await pagePool.destroy();

      expect(mockPages[0].close).toHaveBeenCalled();
      expect(mockPages[1].close).toHaveBeenCalled();
      expect(pagePool.size()).toBe(0);
      expect(pagePool.availableCount()).toBe(0);
    });

    it('should handle page close errors during destroy', async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const error = new Error('Close failed');
      mockPages[0].close.mockRejectedValueOnce(error);

      await pagePool.destroy();

      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error closing page'), error);
    });

    it('should be idempotent', async () => {
      await pagePool.destroy();
      await pagePool.destroy(); // Should not throw

      expect(mockLogger.info).toHaveBeenCalledWith('Page pool destroyed');
    });
  });

  describe('events', () => {
    it('should emit page events', async () => {
      const pageCreatedSpy = jest.fn();
      const pageActivatedSpy = jest.fn();
      const pageReleasedSpy = jest.fn();

      pagePool.on('pageCreated', pageCreatedSpy);
      pagePool.on('pageActivated', pageActivatedSpy);
      pagePool.on('pageReleased', pageReleasedSpy);

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const page = await pagePool.acquire();
      await pagePool.release(page);

      expect(pageCreatedSpy).toHaveBeenCalled();
      expect(pageActivatedSpy).toHaveBeenCalled();
      expect(pageReleasedSpy).toHaveBeenCalled();
    });

    it('should emit cleanup events', (done) => {
      const cleanupSpy = jest.fn();
      pagePool.on('idleCleanup', cleanupSpy);

      // Create pool with very short idle timeout for testing
      const testPool = new PagePool(mockBrowserManager, {
        minPages: 1,
        maxPages: 3,
        idleTimeout: 50 // Very short for testing
      }, mockLogger);

      setTimeout(async () => {
        await testPool.destroy();
        done();
      }, 200);
    });
  });

  describe('idle cleanup', () => {
    it('should clean up idle pages', (done) => {
      // Create pool with short idle timeout
      const testPool = new PagePool(mockBrowserManager, {
        minPages: 1,
        maxPages: 3,
        idleTimeout: 100
      }, mockLogger);

      setTimeout(async () => {
        // Pages should be cleaned up due to idle timeout
        expect(testPool.size()).toBeLessThanOrEqual(1); // Should keep minPages
        await testPool.destroy();
        done();
      }, 200);
    });
  });
});
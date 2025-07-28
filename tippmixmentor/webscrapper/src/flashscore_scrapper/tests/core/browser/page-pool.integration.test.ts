import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { BrowserManager } from '../../../src/core/browser/browser-manager';
import { PagePool } from '../../../src/core/browser/page-pool';
import { Page } from 'playwright';

describe('PagePool Integration', () => {
  let browserManager: BrowserManager;
  let pagePool: PagePool;

  beforeAll(async () => {
    browserManager = new BrowserManager({ headless: true });
    await browserManager.launch();
    pagePool = new PagePool(browserManager, { minPages: 1, maxPages: 2 });
    // Allow time for the pool to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    await pagePool.destroy();
    await browserManager.cleanup();
  });

  it('should acquire and release a page successfully', async () => {
    const initialAvailable = pagePool.availableCount();
    const page = await pagePool.acquire();

    expect(page).toBeDefined();
    expect(page.isClosed()).toBe(false);
    expect(pagePool.availableCount()).toBe(initialAvailable - 1);

    await pagePool.release(page);
    expect(pagePool.availableCount()).toBe(initialAvailable);
  });

  it('should not create more pages than maxPages', async () => {
    const page1 = await pagePool.acquire();
    const page2 = await pagePool.acquire();

    expect(page1).toBeDefined();
    expect(page2).toBeDefined();

    const acquirePromise = pagePool.acquire();

    // Give it a moment to see if it creates a new page
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(pagePool.size()).toBe(2);

    // Release a page to allow the pending acquire to complete
    await pagePool.release(page1);
    const page3 = await acquirePromise;
    expect(page3).toBeDefined();

    await pagePool.release(page2);
    await pagePool.release(page3);
  });
});
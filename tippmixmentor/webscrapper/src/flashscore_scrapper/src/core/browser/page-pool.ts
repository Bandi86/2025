/**
 * Page Pool for concurrent scraping operations with intelligent resource management
 */

import { Page, Browser } from 'playwright';
import { EventEmitter } from 'events';
import { IPagePool, PagePoolOptions, PageInfo } from '../../types/browser.js';
import { createLogger } from '../logging/default-logger.js';
import type { ILogger } from '../logging/interfaces.js';
import { BrowserManager } from './browser-manager.js';

interface PooledPage {
  page: Page;
  id: string;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
  usageCount: number;
}

export class PagePool extends EventEmitter implements IPagePool {
  private readonly browserManager: BrowserManager;
  private readonly logger: ILogger;
  private readonly options: PagePoolOptions;
  private readonly pages: Map<string, PooledPage> = new Map();
  private readonly availablePages: string[] = [];
  private readonly activePage: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  constructor(
    browserManager: BrowserManager,
    options: Partial<PagePoolOptions> = {},
    logger?: ILogger
  ) {
    super();
    
    this.browserManager = browserManager;
    this.logger = logger || createLogger('PagePool');
    this.options = {
      minPages: 1,
      maxPages: 5,
      idleTimeout: 300000, // 5 minutes
      createTimeout: 30000,
      ...options
    };

    this.setupCleanupInterval();
    this.initializePool();
  }

  /**
   * Acquire a page from the pool
   */
  async acquire(): Promise<Page> {
    if (this.isDestroyed) {
      throw new Error('Page pool has been destroyed');
    }

    try {
      // Try to get an available page first
      let pageId = this.availablePages.pop();
      
      if (pageId && this.pages.has(pageId)) {
        const pooledPage = this.pages.get(pageId)!;
        
        // Verify page is still valid
        if (await this.isPageValid(pooledPage.page)) {
          return this.activatePage(pooledPage);
        } else {
          // Page is invalid, remove it and try again
          await this.removePage(pageId);
          return this.acquire();
        }
      }

      // No available pages, create a new one if under limit
      if (this.pages.size < this.options.maxPages) {
        return await this.createNewPage();
      }

      // Pool is full, wait for a page to become available
      this.logger.debug('Page pool is full, waiting for available page...');
      return await this.waitForAvailablePage();

    } catch (error) {
      this.logger.error('Failed to acquire page from pool', error as Error);
      throw error;
    }
  }

  /**
   * Release a page back to the pool
   */
  async release(page: Page): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    const pageId = this.findPageId(page);
    
    if (!pageId) {
      this.logger.warn('Attempted to release page not managed by this pool');
      return;
    }

    const pooledPage = this.pages.get(pageId);
    if (!pooledPage) {
      return;
    }

    try {
      // Clean up the page for reuse
      await this.cleanupPageForReuse(page);
      
      // Mark as available
      pooledPage.isActive = false;
      pooledPage.lastUsed = new Date();
      pooledPage.usageCount++;
      
      this.activePage.delete(pageId);
      this.availablePages.push(pageId);
      
      this.logger.debug(`Page ${pageId} released back to pool. Available: ${this.availablePages.length}`);
      this.emit('pageReleased', { pageId, availableCount: this.availablePages.length });

    } catch (error) {
      this.logger.error(`Failed to release page ${pageId}`, error as Error);
      // If cleanup fails, remove the page from pool
      await this.removePage(pageId);
    }
  }

  /**
   * Get current pool size
   */
  size(): number {
    return this.pages.size;
  }

  /**
   * Get number of available pages
   */
  availableCount(): number {
    return this.availablePages.length;
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalPages: number;
    availablePages: number;
    activePages: number;
    oldestPage: Date | null;
    newestPage: Date | null;
  } {
    const pages = Array.from(this.pages.values());
    
    return {
      totalPages: this.pages.size,
      availablePages: this.availablePages.length,
      activePages: this.activePage.size,
      oldestPage: pages.length > 0 ? Math.min(...pages.map(p => p.createdAt.getTime())) as any : null,
      newestPage: pages.length > 0 ? Math.max(...pages.map(p => p.createdAt.getTime())) as any : null
    };
  }

  /**
   * Get information about all pages in the pool
   */
  getPageInfos(): PageInfo[] {
    return Array.from(this.pages.values()).map(pooledPage => ({
      id: pooledPage.id,
      url: pooledPage.page.url(),
      title: '', // Will be populated if needed
      createdAt: pooledPage.createdAt,
      lastActivity: pooledPage.lastUsed,
      isActive: pooledPage.isActive
    }));
  }

  /**
   * Destroy the pool and clean up all resources
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.logger.info('Destroying page pool...');

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all pages
    const closePromises = Array.from(this.pages.values()).map(async (pooledPage) => {
      try {
        if (!pooledPage.page.isClosed()) {
          await pooledPage.page.close();
        }
      } catch (error) {
        this.logger.error(`Error closing page ${pooledPage.id}`, error as Error);
      }
    });

    await Promise.allSettled(closePromises);

    // Clear all collections
    this.pages.clear();
    this.availablePages.length = 0;
    this.activePage.clear();

    this.logger.info('Page pool destroyed');
    this.emit('destroyed');
  }

  // Private methods

  private async initializePool(): Promise<void> {
    try {
      // Create minimum number of pages
      const createPromises = Array.from({ length: this.options.minPages }, () => 
        this.createNewPage().catch(error => {
          this.logger.error('Failed to create initial page:', error);
          return null;
        })
      );

      await Promise.allSettled(createPromises);
      this.logger.info(`Page pool initialized with ${this.availablePages.length} pages`);
    } catch (error) {
      this.logger.error('Failed to initialize page pool', error as Error);
    }
  }

  private async createNewPage(): Promise<Page> {
    const browser = this.browserManager.getCurrentBrowser();
    if (!browser) {
      throw new Error('No browser available for page creation');
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Page creation timeout')), this.options.createTimeout);
    });

    try {
      const page = await Promise.race([
        this.browserManager.createPage(browser),
        timeoutPromise
      ]);

      const pageId = this.generatePageId();
      const pooledPage: PooledPage = {
        page,
        id: pageId,
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: false,
        usageCount: 0
      };

      this.pages.set(pageId, pooledPage);
      this.availablePages.push(pageId);

      this.logger.debug(`Created new page ${pageId}. Pool size: ${this.pages.size}`);
      this.emit('pageCreated', { pageId, poolSize: this.pages.size });

      return page;

    } catch (error) {
      this.logger.error('Failed to create new page', error as Error);
      throw error;
    }
  }

  private activatePage(pooledPage: PooledPage): Page {
    pooledPage.isActive = true;
    pooledPage.lastUsed = new Date();
    this.activePage.add(pooledPage.id);
    
    this.logger.debug(`Activated page ${pooledPage.id}. Active pages: ${this.activePage.size}`);
    this.emit('pageActivated', { pageId: pooledPage.id, activeCount: this.activePage.size });
    
    return pooledPage.page;
  }

  private async waitForAvailablePage(): Promise<Page> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for available page'));
      }, this.options.createTimeout);

      const onPageReleased = () => {
        clearTimeout(timeout);
        this.removeListener('pageReleased', onPageReleased);
        
        // Try to acquire again
        this.acquire().then(resolve).catch(reject);
      };

      this.once('pageReleased', onPageReleased);
    });
  }

  private async isPageValid(page: Page): Promise<boolean> {
    try {
      return !page.isClosed();
    } catch (error) {
      return false;
    }
  }

  private async cleanupPageForReuse(page: Page): Promise<void> {
    try {
      // Navigate to about:blank to clear any loaded content
      await page.goto('about:blank');
      
      // Clear any dialogs
      page.removeAllListeners('dialog');
      
      // Reset viewport if needed
      // await page.setViewportSize(this.defaultViewport);
      
    } catch (error) {
      this.logger.warn('Error during page cleanup', { error: (error as Error).message });
      throw error;
    }
  }

  private findPageId(page: Page): string | null {
    for (const [pageId, pooledPage] of this.pages.entries()) {
      if (pooledPage.page === page) {
        return pageId;
      }
    }
    return null;
  }

  private async removePage(pageId: string): Promise<void> {
    const pooledPage = this.pages.get(pageId);
    if (!pooledPage) {
      return;
    }

    try {
      if (!pooledPage.page.isClosed()) {
        await pooledPage.page.close();
      }
    } catch (error) {
      this.logger.error(`Error closing page ${pageId}`, error as Error);
    }

    this.pages.delete(pageId);
    this.activePage.delete(pageId);
    
    const availableIndex = this.availablePages.indexOf(pageId);
    if (availableIndex > -1) {
      this.availablePages.splice(availableIndex, 1);
    }

    this.logger.debug(`Removed page ${pageId} from pool. Pool size: ${this.pages.size}`);
    this.emit('pageRemoved', { pageId, poolSize: this.pages.size });
  }

  private setupCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupIdlePages();
    }, 60000); // Run cleanup every minute
  }

  private async cleanupIdlePages(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    const now = new Date();
    const pagesToRemove: string[] = [];

    // Find pages that have been idle too long
    for (const [pageId, pooledPage] of this.pages.entries()) {
      if (!pooledPage.isActive) {
        const idleTime = now.getTime() - pooledPage.lastUsed.getTime();
        
        if (idleTime > this.options.idleTimeout && this.pages.size > this.options.minPages) {
          pagesToRemove.push(pageId);
        }
      }
    }

    // Remove idle pages
    for (const pageId of pagesToRemove) {
      await this.removePage(pageId);
      this.logger.debug(`Cleaned up idle page ${pageId}`);
    }

    if (pagesToRemove.length > 0) {
      this.emit('idleCleanup', { removedPages: pagesToRemove.length, currentSize: this.pages.size });
    }
  }

  private generatePageId(): string {
    return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
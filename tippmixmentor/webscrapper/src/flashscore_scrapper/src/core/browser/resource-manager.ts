/**
 * Resource Cleanup and Memory Management Utilities for Browser Operations
 */

import { Browser, Page, BrowserContext } from 'playwright';
import { EventEmitter } from 'events';
import { createLogger } from '../logging/default-logger.js';
import type { ILogger } from '../logging/interfaces.js';

export interface ResourceMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  browserCount: number;
  pageCount: number;
  contextCount: number;
  uptime: number;
  gcCount: number;
  lastGC: Date | null;
}

export interface ResourceLimits {
  maxMemoryMB: number;
  maxPages: number;
  maxContexts: number;
  maxBrowsers: number;
  gcThresholdMB: number;
  cleanupIntervalMs: number;
}

export interface ResourceCleanupOptions {
  forceGC: boolean;
  closeIdlePages: boolean;
  closeIdleContexts: boolean;
  restartBrowser: boolean;
  idleTimeoutMs: number;
}

export class ResourceManager extends EventEmitter {
  private readonly logger: ILogger;
  private readonly limits: ResourceLimits;
  private readonly trackedBrowsers = new Set<Browser>();
  private readonly trackedPages = new Map<Page, { createdAt: Date; lastActivity: Date }>();
  private readonly trackedContexts = new Map<BrowserContext, { createdAt: Date; lastActivity: Date }>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private gcCount = 0;
  private lastGC: Date | null = null;
  private isDestroyed = false;

  constructor(
    limits: Partial<ResourceLimits> = {},
    logger?: ILogger
  ) {
    super();
    
    this.logger = logger || createLogger('ResourceManager');
    this.limits = {
      maxMemoryMB: 1024, // 1GB
      maxPages: 20,
      maxContexts: 10,
      maxBrowsers: 3,
      gcThresholdMB: 512, // 512MB
      cleanupIntervalMs: 60000, // 1 minute
      ...limits
    };

    this.setupCleanupInterval();
    this.setupProcessMonitoring();
  }

  /**
   * Track a browser instance for resource management
   */
  trackBrowser(browser: Browser): void {
    if (this.isDestroyed) return;

    this.trackedBrowsers.add(browser);
    
    browser.on('disconnected', () => {
      this.trackedBrowsers.delete(browser);
      this.logger.debug('Browser removed from tracking due to disconnection');
    });

    this.logger.debug(`Browser added to tracking. Total browsers: ${this.trackedBrowsers.size}`);
    this.emit('browserTracked', { browserCount: this.trackedBrowsers.size });
  }

  /**
   * Track a page instance for resource management
   */
  trackPage(page: Page): void {
    if (this.isDestroyed) return;

    const now = new Date();
    this.trackedPages.set(page, {
      createdAt: now,
      lastActivity: now
    });

    // Update activity on page events
    const updateActivity = () => {
      const pageInfo = this.trackedPages.get(page);
      if (pageInfo) {
        pageInfo.lastActivity = new Date();
      }
    };

    page.on('request', updateActivity);
    page.on('response', updateActivity);
    page.on('load', updateActivity);

    page.on('close', () => {
      this.trackedPages.delete(page);
      this.logger.debug('Page removed from tracking due to closure');
    });

    this.logger.debug(`Page added to tracking. Total pages: ${this.trackedPages.size}`);
    this.emit('pageTracked', { pageCount: this.trackedPages.size });
  }

  /**
   * Track a browser context for resource management
   */
  trackContext(context: BrowserContext): void {
    if (this.isDestroyed) return;

    const now = new Date();
    this.trackedContexts.set(context, {
      createdAt: now,
      lastActivity: now
    });

    context.on('close', () => {
      this.trackedContexts.delete(context);
      this.logger.debug('Context removed from tracking due to closure');
    });

    this.logger.debug(`Context added to tracking. Total contexts: ${this.trackedContexts.size}`);
    this.emit('contextTracked', { contextCount: this.trackedContexts.size });
  }

  /**
   * Get current resource metrics
   */
  getMetrics(): ResourceMetrics {
    return {
      memoryUsage: process.memoryUsage(),
      browserCount: this.trackedBrowsers.size,
      pageCount: this.trackedPages.size,
      contextCount: this.trackedContexts.size,
      uptime: process.uptime(),
      gcCount: this.gcCount,
      lastGC: this.lastGC
    };
  }

  /**
   * Check if resource limits are exceeded
   */
  checkLimits(): {
    memoryExceeded: boolean;
    pagesExceeded: boolean;
    contextsExceeded: boolean;
    browsersExceeded: boolean;
  } {
    const metrics = this.getMetrics();
    const memoryMB = metrics.memoryUsage.heapUsed / 1024 / 1024;

    return {
      memoryExceeded: memoryMB > this.limits.maxMemoryMB,
      pagesExceeded: metrics.pageCount > this.limits.maxPages,
      contextsExceeded: metrics.contextCount > this.limits.maxContexts,
      browsersExceeded: metrics.browserCount > this.limits.maxBrowsers
    };
  }

  /**
   * Perform resource cleanup based on options
   */
  async cleanup(options: Partial<ResourceCleanupOptions> = {}): Promise<void> {
    if (this.isDestroyed) return;

    const cleanupOptions: ResourceCleanupOptions = {
      forceGC: false,
      closeIdlePages: true,
      closeIdleContexts: true,
      restartBrowser: false,
      idleTimeoutMs: 300000, // 5 minutes
      ...options
    };

    this.logger.info('Starting resource cleanup...', cleanupOptions);

    try {
      let cleanedResources = 0;

      // Close idle pages
      if (cleanupOptions.closeIdlePages) {
        cleanedResources += await this.closeIdlePages(cleanupOptions.idleTimeoutMs);
      }

      // Close idle contexts
      if (cleanupOptions.closeIdleContexts) {
        cleanedResources += await this.closeIdleContexts(cleanupOptions.idleTimeoutMs);
      }

      // Force garbage collection
      if (cleanupOptions.forceGC) {
        await this.forceGarbageCollection();
      }

      // Restart browsers if needed
      if (cleanupOptions.restartBrowser) {
        await this.restartBrowsers();
      }

      this.logger.info(`Resource cleanup completed. Cleaned ${cleanedResources} resources.`);
      this.emit('cleanupCompleted', { cleanedResources, options: cleanupOptions });

    } catch (error) {
      this.logger.error('Error during resource cleanup', error as Error);
      this.emit('cleanupError', { error });
    }
  }

  /**
   * Force garbage collection if available
   */
  async forceGarbageCollection(): Promise<void> {
    try {
      if (global.gc) {
        global.gc();
        this.gcCount++;
        this.lastGC = new Date();
        this.logger.debug('Forced garbage collection completed');
        this.emit('gcCompleted', { gcCount: this.gcCount });
      } else {
        this.logger.warn('Garbage collection not available. Run with --expose-gc flag.');
      }
    } catch (error) {
      this.logger.error('Error during garbage collection', error as Error);
    }
  }

  /**
   * Get memory usage in a human-readable format
   */
  getMemoryUsageString(): string {
    const usage = process.memoryUsage();
    const formatBytes = (bytes: number) => {
      const mb = bytes / 1024 / 1024;
      return `${mb.toFixed(2)} MB`;
    };

    return [
      `RSS: ${formatBytes(usage.rss)}`,
      `Heap Used: ${formatBytes(usage.heapUsed)}`,
      `Heap Total: ${formatBytes(usage.heapTotal)}`,
      `External: ${formatBytes(usage.external)}`
    ].join(', ');
  }

  /**
   * Check if automatic cleanup should be triggered
   */
  shouldTriggerCleanup(): boolean {
    const limits = this.checkLimits();
    const memoryMB = process.memoryUsage().heapUsed / 1024 / 1024;
    
    return (
      limits.memoryExceeded ||
      limits.pagesExceeded ||
      limits.contextsExceeded ||
      memoryMB > this.limits.gcThresholdMB
    );
  }

  /**
   * Destroy the resource manager and clean up all resources
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.logger.info('Destroying resource manager...');

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Perform final cleanup
    await this.cleanup({
      forceGC: true,
      closeIdlePages: true,
      closeIdleContexts: true,
      restartBrowser: false,
      idleTimeoutMs: 0 // Close all pages/contexts immediately
    });

    // Clear tracking collections
    this.trackedBrowsers.clear();
    this.trackedPages.clear();
    this.trackedContexts.clear();

    this.logger.info('Resource manager destroyed');
    this.emit('destroyed');
  }

  // Private methods

  private setupCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      if (this.shouldTriggerCleanup()) {
        this.logger.info('Automatic cleanup triggered due to resource limits');
        await this.cleanup({
          forceGC: true,
          closeIdlePages: true,
          closeIdleContexts: true,
          restartBrowser: false,
          idleTimeoutMs: 300000 // 5 minutes
        });
      }
    }, this.limits.cleanupIntervalMs);
  }

  private setupProcessMonitoring(): void {
    // Monitor process memory usage
    setInterval(() => {
      const memoryMB = process.memoryUsage().heapUsed / 1024 / 1024;
      
      if (memoryMB > this.limits.gcThresholdMB) {
        this.logger.warn(`High memory usage detected: ${memoryMB.toFixed(2)} MB`);
        this.emit('highMemoryUsage', { memoryMB });
      }
    }, 30000); // Check every 30 seconds

    // Handle process warnings
    process.on('warning', (warning) => {
      this.logger.warn('Process warning:', warning);
      this.emit('processWarning', { warning });
    });
  }

  private async closeIdlePages(idleTimeoutMs: number): Promise<number> {
    const now = new Date();
    const pagesToClose: Page[] = [];

    for (const [page, info] of this.trackedPages.entries()) {
      const idleTime = now.getTime() - info.lastActivity.getTime();
      
      if (idleTime > idleTimeoutMs && !page.isClosed()) {
        pagesToClose.push(page);
      }
    }

    let closedCount = 0;
    for (const page of pagesToClose) {
      try {
        await page.close();
        closedCount++;
        this.logger.debug('Closed idle page');
      } catch (error) {
        this.logger.error('Error closing idle page', error as Error);
      }
    }

    return closedCount;
  }

  private async closeIdleContexts(idleTimeoutMs: number): Promise<number> {
    const now = new Date();
    const contextsToClose: BrowserContext[] = [];

    for (const [context, info] of this.trackedContexts.entries()) {
      const idleTime = now.getTime() - info.lastActivity.getTime();
      
      if (idleTime > idleTimeoutMs) {
        // Check if context has no active pages
        const pages = context.pages();
        if (pages.length === 0 || pages.every(page => page.isClosed())) {
          contextsToClose.push(context);
        }
      }
    }

    let closedCount = 0;
    for (const context of contextsToClose) {
      try {
        await context.close();
        closedCount++;
        this.logger.debug('Closed idle context');
      } catch (error) {
        this.logger.error('Error closing idle context', error as Error);
      }
    }

    return closedCount;
  }

  private async restartBrowsers(): Promise<void> {
    this.logger.info('Restarting browsers for resource cleanup...');
    
    for (const browser of this.trackedBrowsers) {
      try {
        if (browser.isConnected()) {
          await browser.close();
          this.logger.debug('Browser closed for restart');
        }
      } catch (error) {
        this.logger.error('Error closing browser for restart', error as Error);
      }
    }
  }
}
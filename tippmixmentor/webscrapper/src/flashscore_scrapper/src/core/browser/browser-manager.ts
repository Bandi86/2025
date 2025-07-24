/**
 * Enhanced Browser Manager with lifecycle management and auto-restart capabilities
 */

import { Browser, Page, BrowserContext, chromium, firefox, webkit } from 'playwright';
import { EventEmitter } from 'events';
import { 
  IBrowserManager, 
  BrowserHealth, 
  BrowserMetrics, 
  BrowserEvent, 
  BrowserEventType,
  BrowserContextOptions 
} from '../../types/browser.js';
import { BrowserOptions } from '../../types/core.js';
import { createLogger } from '../logging/default-logger.js';
import type { ILogger } from '../logging/interfaces.js';

export class BrowserManager extends EventEmitter implements IBrowserManager {
  private browser: Browser | null = null;
  private isLaunching = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metrics: BrowserMetrics;
  private readonly logger: ILogger;
  private readonly defaultOptions: BrowserOptions;
  private readonly userAgents: string[];
  private currentUserAgentIndex = 0;

  constructor(
    options: Partial<BrowserOptions> = {},
    logger?: ILogger
  ) {
    super();
    
    this.logger = logger || createLogger('BrowserManager');
    this.defaultOptions = {
      headless: true,
      timeout: 30000,
      viewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      ...options
    };

    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];

    this.metrics = {
      pagesCreated: 0,
      pagesDestroyed: 0,
      requestsHandled: 0,
      errorsEncountered: 0,
      averageResponseTime: 0,
      memoryPeakUsage: 0
    };

    this.setupHealthMonitoring();
  }

  /**
   * Launch a new browser instance with enhanced configuration
   */
  async launch(options?: BrowserOptions): Promise<Browser> {
    if (this.isLaunching) {
      this.logger.warn('Browser launch already in progress, waiting...');
      await this.waitForLaunch();
      return this.browser!;
    }

    if (this.browser && !this.browser.isConnected()) {
      this.logger.warn('Existing browser is disconnected, cleaning up...');
      await this.cleanup();
    }

    if (this.browser) {
      this.logger.debug('Browser already launched and connected');
      return this.browser;
    }

    this.isLaunching = true;
    const launchOptions = { ...this.defaultOptions, ...options };

    try {
      this.logger.info('Launching browser with options:', launchOptions);
      
      this.browser = await chromium.launch({
        headless: launchOptions.headless,
        args: launchOptions.args,
        timeout: launchOptions.timeout
      });

      this.setupBrowserEventHandlers();
      this.emitEvent(BrowserEventType.LAUNCHED, { options: launchOptions });
      
      this.logger.info('Browser launched successfully');
      return this.browser;

    } catch (error) {
      this.logger.error('Failed to launch browser:', error);
      this.metrics.errorsEncountered++;
      this.emitEvent(BrowserEventType.ERROR, { error });
      throw error;
    } finally {
      this.isLaunching = false;
    }
  }

  /**
   * Create a new page with enhanced configuration
   */
  async createPage(browser?: Browser): Promise<Page> {
    const targetBrowser = browser || this.browser;
    
    if (!targetBrowser) {
      throw new Error('No browser instance available. Call launch() first.');
    }

    try {
      const context = await this.createContext(targetBrowser);
      const page = await context.newPage();
      
      // Set up page-level configurations
      await this.configurePage(page);
      
      this.metrics.pagesCreated++;
      this.emitEvent(BrowserEventType.PAGE_CREATED, { pageId: this.getPageId(page) });
      
      this.logger.debug(`Page created. Total pages: ${this.metrics.pagesCreated}`);
      return page;

    } catch (error) {
      this.logger.error('Failed to create page:', error);
      this.metrics.errorsEncountered++;
      throw error;
    }
  }

  /**
   * Create a new browser context with rotation and configuration
   */
  async createContext(browser: Browser, options?: BrowserContextOptions): Promise<BrowserContext> {
    const userAgent = this.getNextUserAgent();
    
    const contextOptions = {
      userAgent,
      viewport: this.defaultOptions.viewport,
      locale: 'en-US',
      timezone: 'UTC',
      ...options
    };

    try {
      const context = await browser.newContext(contextOptions);
      this.logger.debug('Browser context created with user agent', { userAgent });
      return context;
    } catch (error) {
      this.logger.error('Failed to create browser context', error as Error);
      throw error;
    }
  }

  /**
   * Close a page safely with cleanup
   */
  async closePage(page: Page): Promise<void> {
    try {
      if (!page.isClosed()) {
        await page.close();
        this.metrics.pagesDestroyed++;
        this.emitEvent(BrowserEventType.PAGE_CLOSED, { pageId: this.getPageId(page) });
        this.logger.debug(`Page closed. Total pages destroyed: ${this.metrics.pagesDestroyed}`);
      }
    } catch (error) {
      this.logger.error('Error closing page', error as Error);
    }
  }

  /**
   * Close a browser context safely
   */
  async closeContext(context: BrowserContext): Promise<void> {
    try {
      await context.close();
      this.logger.debug('Browser context closed');
    } catch (error) {
      this.logger.error('Error closing context', error as Error);
    }
  }

  /**
   * Close the browser safely
   */
  async closeBrowser(browser?: Browser): Promise<void> {
    const targetBrowser = browser || this.browser;
    
    if (!targetBrowser) {
      return;
    }

    try {
      await targetBrowser.close();
      if (targetBrowser === this.browser) {
        this.browser = null;
      }
      this.emitEvent(BrowserEventType.CLOSED);
      this.logger.info('Browser closed successfully');
    } catch (error) {
      this.logger.error('Error closing browser', error as Error);
    }
  }

  /**
   * Restart the browser with automatic recovery
   */
  async restart(): Promise<Browser> {
    this.logger.info('Restarting browser...');
    
    try {
      await this.cleanup();
      const browser = await this.launch();
      this.emitEvent(BrowserEventType.RESTART);
      this.logger.info('Browser restarted successfully');
      return browser;
    } catch (error) {
      this.logger.error('Failed to restart browser', error as Error);
      throw error;
    }
  }

  /**
   * Check browser health status
   */
  async isHealthy(browser?: Browser): Promise<boolean> {
    const targetBrowser = browser || this.browser;
    
    if (!targetBrowser) {
      return false;
    }

    try {
      // Check if browser is connected
      if (!targetBrowser.isConnected()) {
        return false;
      }

      // Try to create and close a test page
      const testPage = await targetBrowser.newPage();
      await testPage.close();
      
      return true;
    } catch (error) {
      this.logger.warn('Browser health check failed', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Get current browser instance
   */
  getCurrentBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Get browser health metrics
   */
  async getHealth(): Promise<BrowserHealth> {
    const browser = this.browser;
    
    if (!browser) {
      return {
        isResponsive: false,
        memoryUsage: 0,
        pageCount: 0,
        uptime: 0,
        lastActivity: new Date()
      };
    }

    const contexts = browser.contexts();
    const pageCount = contexts.reduce((count, context) => count + context.pages().length, 0);

    return {
      isResponsive: await this.isHealthy(browser),
      memoryUsage: process.memoryUsage().heapUsed,
      pageCount,
      uptime: process.uptime(),
      lastActivity: new Date()
    };
  }

  /**
   * Get browser metrics
   */
  getMetrics(): BrowserMetrics {
    return { ...this.metrics };
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.browser) {
      await this.closeBrowser(this.browser);
    }
  }

  // Private methods

  private async waitForLaunch(): Promise<void> {
    return new Promise((resolve) => {
      const checkLaunch = () => {
        if (!this.isLaunching && this.browser) {
          resolve();
        } else {
          setTimeout(checkLaunch, 100);
        }
      };
      checkLaunch();
    });
  }

  private setupBrowserEventHandlers(): void {
    if (!this.browser) return;

    this.browser.on('disconnected', () => {
      this.logger.warn('Browser disconnected unexpectedly');
      this.emitEvent(BrowserEventType.ERROR, { error: 'Browser disconnected' });
    });
  }

  private async configurePage(page: Page): Promise<void> {
    // Set default timeout
    page.setDefaultTimeout(this.defaultOptions.timeout);
    
    // Set viewport if specified
    if (this.defaultOptions.viewport) {
      await page.setViewportSize(this.defaultOptions.viewport);
    }

    // Add request/response logging for metrics
    page.on('request', () => {
      this.metrics.requestsHandled++;
    });

    page.on('pageerror', (error) => {
      this.logger.warn('Page error:', error);
      this.metrics.errorsEncountered++;
    });
  }

  private getNextUserAgent(): string {
    const userAgent = this.userAgents[this.currentUserAgentIndex];
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
    return userAgent;
  }

  private getPageId(page: Page): string {
    return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      if (this.browser) {
        const isHealthy = await this.isHealthy();
        if (!isHealthy) {
          this.logger.warn('Browser health check failed, attempting restart...');
          try {
            await this.restart();
          } catch (error) {
            this.logger.error('Failed to restart unhealthy browser', error as Error);
          }
        }
        this.emitEvent(BrowserEventType.HEALTH_CHECK, { isHealthy });
      }
    }, 60000); // Check every minute
  }

  private emitEvent(type: BrowserEventType, data?: any): void {
    const event: BrowserEvent = {
      type,
      timestamp: new Date(),
      data
    };
    this.emit('browserEvent', event);
  }
}
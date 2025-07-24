/**
 * Browser Configuration Manager with user agent rotation and advanced settings
 */

import { BrowserOptions } from '../../types/core.js';
import { BrowserContextOptions } from '../../types/browser.js';
import { Logger } from '../logging/index.js';

export interface BrowserConfigOptions {
  userAgentRotation: boolean;
  stealthMode: boolean;
  resourceOptimization: boolean;
  customUserAgents?: string[];
  proxySettings?: ProxyConfig;
  performanceSettings?: PerformanceConfig;
}

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
  bypass?: string[];
}

export interface PerformanceConfig {
  disableImages: boolean;
  disableCSS: boolean;
  disableJavaScript: boolean;
  disableFonts: boolean;
  blockAds: boolean;
  blockTrackers: boolean;
}

export class BrowserConfig {
  private readonly logger: Logger;
  private readonly options: BrowserConfigOptions;
  private currentUserAgentIndex = 0;
  private readonly defaultUserAgents: string[];
  private readonly mobileUserAgents: string[];
  private readonly desktopUserAgents: string[];

  constructor(options: Partial<BrowserConfigOptions> = {}, logger?: Logger) {
    this.logger = logger || new Logger('BrowserConfig');
    this.options = {
      userAgentRotation: true,
      stealthMode: true,
      resourceOptimization: false,
      ...options
    };

    this.desktopUserAgents = [
      // Chrome Desktop
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      
      // Firefox Desktop
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
      
      // Safari Desktop
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      
      // Edge Desktop
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    ];

    this.mobileUserAgents = [
      // Chrome Mobile
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36',
      
      // Safari Mobile
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
      
      // Firefox Mobile
      'Mozilla/5.0 (Mobile; rv:121.0) Gecko/121.0 Firefox/121.0',
      'Mozilla/5.0 (Android 10; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0'
    ];

    this.defaultUserAgents = [...this.desktopUserAgents, ...this.mobileUserAgents];
  }

  /**
   * Get browser launch options with enhanced configuration
   */
  getBrowserLaunchOptions(baseOptions: Partial<BrowserOptions> = {}): BrowserOptions {
    const args = this.getBrowserArgs();
    
    return {
      headless: true,
      timeout: 30000,
      viewport: { width: 1920, height: 1080 },
      args,
      ...baseOptions
    };
  }

  /**
   * Get browser context options with rotation and stealth features
   */
  getBrowserContextOptions(baseOptions: Partial<BrowserContextOptions> = {}): BrowserContextOptions {
    const options: BrowserContextOptions = {
      locale: 'en-US',
      timezone: 'UTC',
      ...baseOptions
    };

    // Add user agent rotation
    if (this.options.userAgentRotation) {
      options.userAgent = this.getNextUserAgent();
    }

    // Add viewport randomization for stealth
    if (this.options.stealthMode) {
      options.viewport = this.getRandomViewport();
    }

    // Add performance optimizations
    if (this.options.resourceOptimization && this.options.performanceSettings) {
      // These would be handled at the page level
    }

    return options;
  }

  /**
   * Get the next user agent in rotation
   */
  getNextUserAgent(mobile = false): string {
    const userAgents = this.options.customUserAgents || 
      (mobile ? this.mobileUserAgents : this.desktopUserAgents);
    
    const userAgent = userAgents[this.currentUserAgentIndex % userAgents.length];
    this.currentUserAgentIndex++;
    
    this.logger.debug(`Selected user agent: ${userAgent.substring(0, 50)}...`);
    return userAgent;
  }

  /**
   * Get a random user agent
   */
  getRandomUserAgent(mobile = false): string {
    const userAgents = this.options.customUserAgents || 
      (mobile ? this.mobileUserAgents : this.desktopUserAgents);
    
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomIndex];
  }

  /**
   * Get browser launch arguments with stealth and performance optimizations
   */
  private getBrowserArgs(): string[] {
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ];

    if (this.options.stealthMode) {
      args.push(
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-features=TranslateUI',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--disable-web-security',
        '--metrics-recording-only',
        '--no-default-browser-check',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain'
      );
    }

    if (this.options.resourceOptimization && this.options.performanceSettings) {
      const perf = this.options.performanceSettings;
      
      if (perf.disableImages) {
        args.push('--blink-settings=imagesEnabled=false');
      }
      
      if (perf.disableJavaScript) {
        args.push('--disable-javascript');
      }
      
      if (perf.blockAds) {
        args.push('--aggressive-cache-discard');
      }
    }

    return args;
  }

  /**
   * Get a random viewport size for stealth mode
   */
  private getRandomViewport(): { width: number; height: number } {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1536, height: 864 },
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
      { width: 1024, height: 768 }
    ];

    return viewports[Math.floor(Math.random() * viewports.length)];
  }

  /**
   * Apply performance settings to a page
   */
  async applyPerformanceSettings(page: any): Promise<void> {
    if (!this.options.resourceOptimization || !this.options.performanceSettings) {
      return;
    }

    const settings = this.options.performanceSettings;

    try {
      // Block resources based on settings
      await page.route('**/*', (route: any) => {
        const resourceType = route.request().resourceType();
        const url = route.request().url();

        // Block images
        if (settings.disableImages && resourceType === 'image') {
          route.abort();
          return;
        }

        // Block CSS
        if (settings.disableCSS && resourceType === 'stylesheet') {
          route.abort();
          return;
        }

        // Block fonts
        if (settings.disableFonts && resourceType === 'font') {
          route.abort();
          return;
        }

        // Block ads and trackers
        if (settings.blockAds || settings.blockTrackers) {
          if (this.isAdOrTracker(url)) {
            route.abort();
            return;
          }
        }

        route.continue();
      });

      this.logger.debug('Performance settings applied to page');
    } catch (error) {
      this.logger.error('Failed to apply performance settings:', error);
    }
  }

  /**
   * Check if URL is an ad or tracker
   */
  private isAdOrTracker(url: string): boolean {
    const adDomains = [
      'doubleclick.net',
      'googleadservices.com',
      'googlesyndication.com',
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.com/tr',
      'connect.facebook.net',
      'scorecardresearch.com',
      'outbrain.com',
      'taboola.com'
    ];

    return adDomains.some(domain => url.includes(domain));
  }

  /**
   * Get stealth scripts to inject into pages
   */
  getStealthScripts(): string[] {
    if (!this.options.stealthMode) {
      return [];
    }

    return [
      // Remove webdriver property
      `Object.defineProperty(navigator, 'webdriver', { get: () => undefined });`,
      
      // Mock plugins
      `Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5].map(() => ({ filename: 'plugin.so', description: 'plugin' }))
      });`,
      
      // Mock languages
      `Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });`,
      
      // Mock permissions
      `const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );`,
      
      // Mock chrome runtime
      `window.chrome = { runtime: {} };`
    ];
  }

  /**
   * Update configuration options
   */
  updateOptions(newOptions: Partial<BrowserConfigOptions>): void {
    Object.assign(this.options, newOptions);
    this.logger.info('Browser configuration updated:', newOptions);
  }

  /**
   * Get current configuration
   */
  getOptions(): BrowserConfigOptions {
    return { ...this.options };
  }
}
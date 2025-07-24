const { chromium, firefox, webkit } = require('playwright');
const logger = require('../utils/logger');

/**
 * Enhanced browser automation service for Flashscore scraping
 * Extends the basic functionality from archive/scrape.js into a robust class
 */
class ScrapingEngine {
  constructor(config = {}) {
    this.config = {
      browserType: config.browserType || 'chromium',
      headless: config.headless !== false, // Default to true unless explicitly set to false
      viewport: config.viewport || { width: 1920, height: 1080 },
      userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timeout: config.timeout || 30000,
      navigationTimeout: config.navigationTimeout || 30000,
      locale: config.locale || 'en-US',
      timezone: config.timezone || 'UTC',
      ...config
    };
    
    this.browser = null;
    this.context = null;
    this.page = null;
    this.isInitialized = false;
  }

  /**
   * Initialize browser with configuration
   */
  async initializeBrowser() {
    try {
      logger.info('Initializing browser', { browserType: this.config.browserType });
      
      const browserType = this.getBrowserType();
      
      this.browser = await browserType.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.context = await this.browser.newContext({
        viewport: this.config.viewport,
        userAgent: this.config.userAgent,
        locale: this.config.locale,
        timezoneId: this.config.timezone,
        permissions: [],
        ignoreHTTPSErrors: true
      });

      // Set default timeouts
      this.context.setDefaultTimeout(this.config.timeout);
      this.context.setDefaultNavigationTimeout(this.config.navigationTimeout);

      this.page = await this.context.newPage();
      this.isInitialized = true;
      
      logger.info('Browser initialized successfully');
      return this.page;
    } catch (error) {
      logger.error('Failed to initialize browser', { error: error.message });
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  /**
   * Get browser type based on configuration
   */
  getBrowserType() {
    switch (this.config.browserType.toLowerCase()) {
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      case 'chromium':
      default:
        return chromium;
    }
  }

  /**
   * Navigate to a specific URL with error handling
   */
  async navigateToPage(url, options = {}) {
    if (!this.isInitialized) {
      await this.initializeBrowser();
    }

    try {
      logger.info('Navigating to page', { url });
      
      const response = await this.page.goto(url, {
        waitUntil: options.waitUntil || 'domcontentloaded',
        timeout: options.timeout || this.config.navigationTimeout
      });

      if (!response.ok()) {
        throw new Error(`Navigation failed with status: ${response.status()}`);
      }

      // Handle cookie popups and other overlays
      await this.handleCookiePopups();
      
      logger.info('Successfully navigated to page', { url, status: response.status() });
      return response;
    } catch (error) {
      logger.error('Navigation failed', { url, error: error.message });
      throw new Error(`Navigation to ${url} failed: ${error.message}`);
    }
  }

  /**
   * Handle cookie consent popups and other overlays
   */
  async handleCookiePopups() {
    try {
      // Common cookie popup selectors for Flashscore
      const cookieSelectors = [
        '[data-testid="cookie-consent-accept"]',
        '.cookie-consent-accept',
        '#cookie-accept',
        'button[aria-label*="Accept"]',
        'button:has-text("Accept")',
        'button:has-text("Agree")',
        '.fc-button.fc-cta-consent',
        '.qc-cmp2-summary-buttons button:first-child'
      ];

      for (const selector of cookieSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.click();
            logger.info('Cookie popup handled', { selector });
            await this.page.waitForTimeout(1000); // Wait for popup to disappear
            break;
          }
        } catch (error) {
          // Continue to next selector if this one fails
          continue;
        }
      }

      // Handle other common overlays
      await this.handleCommonOverlays();
    } catch (error) {
      logger.warn('Cookie popup handling failed', { error: error.message });
      // Don't throw error as this is not critical
    }
  }

  /**
   * Handle common overlays and popups
   */
  async handleCommonOverlays() {
    const overlaySelectors = [
      '.modal-close',
      '.popup-close',
      '[aria-label="Close"]',
      'button:has-text("Close")',
      '.overlay-dismiss'
    ];

    for (const selector of overlaySelectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          logger.info('Overlay dismissed', { selector });
          await this.page.waitForTimeout(500);
        }
      } catch (error) {
        // Continue to next selector
        continue;
      }
    }
  }

  /**
   * Extract data using provided selectors with fallback strategies
   */
  async extractData(selectors, options = {}) {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initializeBrowser() first.');
    }

    try {
      const results = {};
      
      for (const [key, selectorConfig] of Object.entries(selectors)) {
        try {
          let selector, attribute, multiple;
          
          if (typeof selectorConfig === 'string') {
            selector = selectorConfig;
            attribute = 'textContent';
            multiple = false;
          } else {
            selector = selectorConfig.selector;
            attribute = selectorConfig.attribute || 'textContent';
            multiple = selectorConfig.multiple || false;
          }

          if (multiple) {
            const elements = await this.page.locator(selector).all();
            results[key] = [];
            
            for (const element of elements) {
              const value = attribute === 'textContent' 
                ? await element.textContent()
                : await element.getAttribute(attribute);
              if (value && value.trim()) {
                results[key].push(value.trim());
              }
            }
          } else {
            const element = await this.page.locator(selector).first();
            if (await element.isVisible({ timeout: options.timeout || 5000 })) {
              const value = attribute === 'textContent'
                ? await element.textContent()
                : await element.getAttribute(attribute);
              results[key] = value ? value.trim() : null;
            } else {
              results[key] = null;
            }
          }
        } catch (error) {
          logger.warn('Data extraction failed for selector', { key, error: error.message });
          results[key] = null;
        }
      }

      return results;
    } catch (error) {
      logger.error('Data extraction failed', { error: error.message });
      throw new Error(`Data extraction failed: ${error.message}`);
    }
  }

  /**
   * Take screenshot for debugging purposes
   */
  async takeScreenshot(path, options = {}) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      await this.page.screenshot({
        path,
        fullPage: options.fullPage || false,
        ...options
      });
      logger.info('Screenshot taken', { path });
    } catch (error) {
      logger.error('Screenshot failed', { path, error: error.message });
      throw error;
    }
  }

  /**
   * Get page content (HTML)
   */
  async getPageContent() {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    return await this.page.content();
  }

  /**
   * Get page text content
   */
  async getPageText() {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    return await this.page.innerText('body');
  }

  /**
   * Wait for specific condition or element
   */
  async waitFor(condition, options = {}) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const timeout = options.timeout || this.config.timeout;

    if (typeof condition === 'string') {
      // Wait for selector
      return await this.page.waitForSelector(condition, { timeout });
    } else if (typeof condition === 'function') {
      // Wait for function
      return await this.page.waitForFunction(condition, null, { timeout });
    } else {
      throw new Error('Invalid condition type. Expected string selector or function.');
    }
  }

  /**
   * Close browser and cleanup resources
   */
  async closeBrowser() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      
      this.isInitialized = false;
      logger.info('Browser closed successfully');
    } catch (error) {
      logger.error('Error closing browser', { error: error.message });
      throw error;
    }
  }

  /**
   * Get current page URL
   */
  getCurrentUrl() {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    return this.page.url();
  }

  /**
   * Check if browser is initialized
   */
  isReady() {
    return this.isInitialized && this.page && !this.page.isClosed();
  }

  /**
   * Restart browser (useful for recovery from errors)
   */
  async restartBrowser() {
    logger.info('Restarting browser');
    await this.closeBrowser();
    await this.initializeBrowser();
    logger.info('Browser restarted successfully');
  }
}

module.exports = ScrapingEngine;
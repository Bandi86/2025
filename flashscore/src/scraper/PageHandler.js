const logger = require('../utils/logger');

/**
 * PageHandler class for dynamic content management and page interactions
 * Handles scroll-to-load functionality, wait strategies, and element detection
 */
class PageHandler {
  constructor(page, config = {}) {
    if (!page) {
      throw new Error('Page instance is required');
    }
    
    this.page = page;
    this.config = {
      scrollDelay: config.scrollDelay || 1000,
      scrollStep: config.scrollStep || 500,
      maxScrollAttempts: config.maxScrollAttempts || 10,
      elementTimeout: config.elementTimeout || 10000,
      dynamicContentTimeout: config.dynamicContentTimeout || 30000,
      retryDelay: config.retryDelay || 2000,
      ...config
    };
  }

  /**
   * Scroll to load dynamic content with intelligent detection
   */
  async scrollToLoadContent(options = {}) {
    const {
      targetSelector = null,
      maxScrolls = this.config.maxScrollAttempts,
      scrollStep = this.config.scrollStep,
      delay = this.config.scrollDelay,
      stopWhenNoNewContent = true
    } = options;

    logger.info('Starting scroll-to-load content', { targetSelector, maxScrolls });

    let scrollCount = 0;
    let previousHeight = 0;
    let noChangeCount = 0;
    const maxNoChangeCount = 3;

    try {
      // Get initial page height
      previousHeight = await this.page.evaluate(() => document.body.scrollHeight);

      while (scrollCount < maxScrolls) {
        // Scroll down by specified step
        await this.page.evaluate((step) => {
          window.scrollBy(0, step);
        }, scrollStep);

        // Wait for content to load
        await this.page.waitForTimeout(delay);

        // Check if target element is now visible (if specified)
        if (targetSelector) {
          try {
            const element = await this.page.locator(targetSelector).first();
            if (await element.isVisible({ timeout: 1000 })) {
              logger.info('Target element found after scrolling', { 
                targetSelector, 
                scrollCount: scrollCount + 1 
              });
              return true;
            }
          } catch (error) {
            // Element not found yet, continue scrolling
          }
        }

        // Check if new content was loaded
        if (stopWhenNoNewContent) {
          const currentHeight = await this.page.evaluate(() => document.body.scrollHeight);
          
          if (currentHeight === previousHeight) {
            noChangeCount++;
            if (noChangeCount >= maxNoChangeCount) {
              logger.info('No new content detected, stopping scroll', { 
                scrollCount: scrollCount + 1,
                finalHeight: currentHeight 
              });
              break;
            }
          } else {
            noChangeCount = 0;
            previousHeight = currentHeight;
          }
        }

        scrollCount++;
      }

      logger.info('Scroll-to-load completed', { 
        totalScrolls: scrollCount,
        targetFound: !!targetSelector && await this.isElementVisible(targetSelector)
      });

      return targetSelector ? await this.isElementVisible(targetSelector) : true;

    } catch (error) {
      logger.error('Scroll-to-load failed', { error: error.message });
      throw new Error(`Scroll-to-load failed: ${error.message}`);
    }
  }

  /**
   * Wait for dynamic content to load using multiple strategies
   */
  async waitForDynamicContent(options = {}) {
    const {
      selectors = [],
      networkIdle = false,
      customCondition = null,
      timeout = this.config.dynamicContentTimeout
    } = options;

    logger.info('Waiting for dynamic content', { selectors, networkIdle, timeout });

    const startTime = Date.now();

    try {
      // Strategy 1: Wait for specific selectors
      if (selectors.length > 0) {
        await this.waitForAnySelector(selectors, { timeout: timeout / 3 });
      }

      // Strategy 2: Wait for network idle
      if (networkIdle) {
        await this.waitForNetworkIdle({ timeout: timeout / 3 });
      }

      // Strategy 3: Custom condition
      if (customCondition && typeof customCondition === 'function') {
        await this.page.waitForFunction(customCondition, null, { timeout: timeout / 3 });
      }

      // Strategy 4: Wait for common loading indicators to disappear
      await this.waitForLoadingIndicators({ timeout: timeout / 3 });

      const duration = Date.now() - startTime;
      logger.info('Dynamic content loaded successfully', { duration });

      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.warn('Dynamic content wait timeout or failed', { 
        error: error.message, 
        duration 
      });
      
      // Don't throw error, return false to allow graceful handling
      return false;
    }
  }

  /**
   * Wait for any of the provided selectors to appear
   */
  async waitForAnySelector(selectors, options = {}) {
    const timeout = options.timeout || this.config.elementTimeout;
    
    logger.info('Waiting for any selector', { selectors, timeout });

    const promises = selectors.map(selector => 
      this.page.waitForSelector(selector, { timeout }).catch(() => null)
    );

    const result = await Promise.race(promises);
    
    if (!result) {
      throw new Error(`None of the selectors appeared within timeout: ${selectors.join(', ')}`);
    }

    return result;
  }

  /**
   * Wait for network to be idle (no requests for specified time)
   */
  async waitForNetworkIdle(options = {}) {
    const { timeout = 30000, idleTime = 2000 } = options;
    
    logger.info('Waiting for network idle', { timeout, idleTime });

    let requestCount = 0;
    let lastRequestTime = Date.now();

    // Track network requests
    const requestHandler = () => {
      requestCount++;
      lastRequestTime = Date.now();
    };

    const responseHandler = () => {
      requestCount = Math.max(0, requestCount - 1);
      lastRequestTime = Date.now();
    };

    this.page.on('request', requestHandler);
    this.page.on('response', responseHandler);

    try {
      await this.page.waitForFunction(
        ({ idleTime }) => {
          const now = Date.now();
          const timeSinceLastRequest = now - window.lastRequestTime;
          return window.requestCount === 0 && timeSinceLastRequest >= idleTime;
        },
        { requestCount, lastRequestTime, idleTime },
        { timeout }
      );

      logger.info('Network idle achieved');
    } finally {
      this.page.off('request', requestHandler);
      this.page.off('response', responseHandler);
    }
  }

  /**
   * Wait for common loading indicators to disappear
   */
  async waitForLoadingIndicators(options = {}) {
    const timeout = options.timeout || 10000;
    
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '.loader',
      '[data-loading="true"]',
      '.loading-overlay',
      '.progress-bar',
      '.skeleton-loader'
    ];

    logger.info('Waiting for loading indicators to disappear');

    try {
      for (const selector of loadingSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            await element.waitFor({ state: 'hidden', timeout });
            logger.info('Loading indicator disappeared', { selector });
          }
        } catch (error) {
          // Loading indicator not found or already hidden, continue
          continue;
        }
      }
    } catch (error) {
      logger.warn('Some loading indicators may still be visible', { error: error.message });
    }
  }

  /**
   * Detect and interact with elements using multiple strategies
   */
  async detectAndInteract(elementConfig, action = 'click', options = {}) {
    const {
      selectors = [],
      fallbackSelectors = [],
      waitForVisible = true,
      retryCount = 3,
      retryDelay = this.config.retryDelay
    } = elementConfig;

    logger.info('Detecting and interacting with element', { 
      selectors, 
      action, 
      retryCount 
    });

    let lastError = null;

    // Try primary selectors first
    for (const selector of selectors) {
      for (let attempt = 0; attempt < retryCount; attempt++) {
        try {
          const element = await this.page.locator(selector).first();
          
          if (waitForVisible) {
            await element.waitFor({ state: 'visible', timeout: this.config.elementTimeout });
          }

          // Perform the action
          await this.performAction(element, action, options);
          
          logger.info('Element interaction successful', { selector, action, attempt: attempt + 1 });
          return true;

        } catch (error) {
          lastError = error;
          logger.warn('Element interaction attempt failed', { 
            selector, 
            action, 
            attempt: attempt + 1, 
            error: error.message 
          });

          if (attempt < retryCount - 1) {
            await this.page.waitForTimeout(retryDelay);
          }
        }
      }
    }

    // Try fallback selectors if primary selectors failed
    if (fallbackSelectors.length > 0) {
      logger.info('Trying fallback selectors');
      
      for (const selector of fallbackSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          
          if (waitForVisible) {
            await element.waitFor({ state: 'visible', timeout: this.config.elementTimeout });
          }

          await this.performAction(element, action, options);
          
          logger.info('Fallback element interaction successful', { selector, action });
          return true;

        } catch (error) {
          lastError = error;
          logger.warn('Fallback element interaction failed', { 
            selector, 
            action, 
            error: error.message 
          });
        }
      }
    }

    throw new Error(`Element interaction failed after all attempts: ${lastError?.message}`);
  }

  /**
   * Perform specific action on element
   */
  async performAction(element, action, options = {}) {
    switch (action.toLowerCase()) {
      case 'click':
        await element.click(options);
        break;
      
      case 'hover':
        await element.hover(options);
        break;
      
      case 'fill':
        if (!options.text) {
          throw new Error('Text option required for fill action');
        }
        await element.fill(options.text);
        break;
      
      case 'select':
        if (!options.value) {
          throw new Error('Value option required for select action');
        }
        await element.selectOption(options.value);
        break;
      
      case 'check':
        await element.check(options);
        break;
      
      case 'uncheck':
        await element.uncheck(options);
        break;
      
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector, timeout = 5000) {
    try {
      const element = await this.page.locator(selector).first();
      return await element.isVisible({ timeout });
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for page to be fully loaded and interactive
   */
  async waitForPageReady(options = {}) {
    const {
      waitForNetworkIdle = true,
      waitForDOMContentLoaded = true,
      waitForLoadEvent = true,
      customReadyCondition = null,
      timeout = 30000
    } = options;

    logger.info('Waiting for page to be ready');

    try {
      // Wait for DOM content loaded
      if (waitForDOMContentLoaded) {
        await this.page.waitForLoadState('domcontentloaded', { timeout });
      }

      // Wait for load event
      if (waitForLoadEvent) {
        await this.page.waitForLoadState('load', { timeout });
      }

      // Wait for network idle
      if (waitForNetworkIdle) {
        await this.page.waitForLoadState('networkidle', { timeout });
      }

      // Custom ready condition
      if (customReadyCondition && typeof customReadyCondition === 'function') {
        await this.page.waitForFunction(customReadyCondition, null, { timeout });
      }

      logger.info('Page is ready');
      return true;

    } catch (error) {
      logger.warn('Page ready timeout', { error: error.message });
      return false;
    }
  }

  /**
   * Handle infinite scroll pages
   */
  async handleInfiniteScroll(options = {}) {
    const {
      itemSelector = null,
      maxItems = null,
      maxScrollTime = 60000,
      scrollDelay = 1000,
      noNewContentThreshold = 3
    } = options;

    logger.info('Handling infinite scroll', { itemSelector, maxItems, maxScrollTime });

    const startTime = Date.now();
    let previousItemCount = 0;
    let noNewContentCount = 0;
    let totalScrolls = 0;

    try {
      while (Date.now() - startTime < maxScrollTime) {
        // Get current item count if selector provided
        let currentItemCount = 0;
        if (itemSelector) {
          const items = await this.page.locator(itemSelector).all();
          currentItemCount = items.length;
          
          // Check if we've reached the target number of items
          if (maxItems && currentItemCount >= maxItems) {
            logger.info('Target item count reached', { currentItemCount, maxItems });
            break;
          }
        }

        // Scroll to bottom
        await this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        totalScrolls++;
        await this.page.waitForTimeout(scrollDelay);

        // Check for new content
        if (itemSelector) {
          if (currentItemCount === previousItemCount) {
            noNewContentCount++;
            if (noNewContentCount >= noNewContentThreshold) {
              logger.info('No new content detected, stopping infinite scroll', {
                finalItemCount: currentItemCount,
                totalScrolls
              });
              break;
            }
          } else {
            noNewContentCount = 0;
            previousItemCount = currentItemCount;
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.info('Infinite scroll completed', { 
        duration, 
        totalScrolls,
        finalItemCount: itemSelector ? previousItemCount : 'unknown'
      });

      return {
        itemCount: previousItemCount,
        scrollCount: totalScrolls,
        duration
      };

    } catch (error) {
      logger.error('Infinite scroll failed', { error: error.message });
      throw new Error(`Infinite scroll failed: ${error.message}`);
    }
  }

  /**
   * Smart wait that combines multiple waiting strategies
   */
  async smartWait(conditions = {}) {
    const {
      selectors = [],
      networkIdle = false,
      customCondition = null,
      loadingIndicators = true,
      timeout = this.config.dynamicContentTimeout
    } = conditions;

    logger.info('Starting smart wait', conditions);

    const promises = [];

    // Add selector waiting promises
    if (selectors.length > 0) {
      promises.push(this.waitForAnySelector(selectors, { timeout }));
    }

    // Add network idle promise
    if (networkIdle) {
      promises.push(this.waitForNetworkIdle({ timeout }));
    }

    // Add custom condition promise
    if (customCondition) {
      promises.push(this.page.waitForFunction(customCondition, null, { timeout }));
    }

    // Add loading indicators promise
    if (loadingIndicators) {
      promises.push(this.waitForLoadingIndicators({ timeout }));
    }

    try {
      // Wait for at least one condition to be met
      await Promise.race(promises.filter(p => p));
      logger.info('Smart wait completed successfully');
      return true;
    } catch (error) {
      logger.warn('Smart wait timeout', { error: error.message });
      return false;
    }
  }
}

module.exports = PageHandler;
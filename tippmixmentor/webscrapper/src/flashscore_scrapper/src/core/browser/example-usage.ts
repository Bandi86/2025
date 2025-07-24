/**
 * Example usage of the Enhanced Browser Management System
 * 
 * This file demonstrates how to use the various components of the browser management system
 * for different scraping scenarios.
 */

import { 
  BrowserManager, 
  PagePool, 
  BrowserConfig, 
  ResourceManager, 
  BrowserHealthMonitor 
} from './index.js';
import { Logger } from '../logging/index.js';

/**
 * Example 1: Basic Browser Management
 */
async function basicBrowserUsage() {
  console.log('=== Basic Browser Management Example ===');
  
  const logger = new Logger('BasicExample');
  const browserManager = new BrowserManager({
    headless: true,
    timeout: 30000
  }, logger);

  try {
    // Launch browser
    const browser = await browserManager.launch();
    console.log('Browser launched successfully');

    // Create a page
    const page = await browserManager.createPage();
    console.log('Page created');

    // Navigate to a website
    await page.goto('https://example.com');
    console.log('Navigated to example.com');

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check browser health
    const isHealthy = await browserManager.isHealthy();
    console.log('Browser is healthy:', isHealthy);

    // Get browser metrics
    const metrics = browserManager.getMetrics();
    console.log('Browser metrics:', metrics);

    // Clean up
    await browserManager.closePage(page);
    await browserManager.cleanup();
    console.log('Cleanup completed');

  } catch (error) {
    console.error('Error in basic browser usage:', error);
  }
}

/**
 * Example 2: Page Pool for Concurrent Scraping
 */
async function pagePoolUsage() {
  console.log('\n=== Page Pool Example ===');
  
  const logger = new Logger('PagePoolExample');
  const browserManager = new BrowserManager({}, logger);
  
  try {
    // Launch browser first
    await browserManager.launch();

    // Create page pool
    const pagePool = new PagePool(browserManager, {
      minPages: 2,
      maxPages: 5,
      idleTimeout: 300000, // 5 minutes
      createTimeout: 30000
    }, logger);

    // Simulate concurrent scraping
    const urls = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3'
    ];

    const scrapingTasks = urls.map(async (url, index) => {
      console.log(`Starting task ${index + 1} for ${url}`);
      
      // Acquire page from pool
      const page = await pagePool.acquire();
      
      try {
        // Navigate and scrape
        await page.goto(url);
        const title = await page.title();
        console.log(`Task ${index + 1} - Title: ${title}`);
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { url, title };
      } finally {
        // Always release page back to pool
        await pagePool.release(page);
        console.log(`Task ${index + 1} completed and page released`);
      }
    });

    // Wait for all tasks to complete
    const results = await Promise.all(scrapingTasks);
    console.log('All scraping tasks completed:', results);

    // Get pool statistics
    const stats = pagePool.getStats();
    console.log('Pool statistics:', stats);

    // Clean up
    await pagePool.destroy();
    await browserManager.cleanup();

  } catch (error) {
    console.error('Error in page pool usage:', error);
  }
}

/**
 * Example 3: Advanced Browser Configuration
 */
async function advancedConfigurationUsage() {
  console.log('\n=== Advanced Configuration Example ===');
  
  const logger = new Logger('ConfigExample');
  
  // Create browser configuration with stealth mode and performance optimization
  const browserConfig = new BrowserConfig({
    userAgentRotation: true,
    stealthMode: true,
    resourceOptimization: true,
    performanceSettings: {
      disableImages: true,
      disableCSS: false,
      disableJavaScript: false,
      disableFonts: true,
      blockAds: true,
      blockTrackers: true
    }
  }, logger);

  // Get optimized browser launch options
  const launchOptions = browserConfig.getBrowserLaunchOptions({
    headless: true,
    timeout: 30000
  });

  const browserManager = new BrowserManager(launchOptions, logger);

  try {
    const browser = await browserManager.launch();
    
    // Create context with rotation and stealth features
    const contextOptions = browserConfig.getBrowserContextOptions();
    const context = await browserManager.createContext(browser, contextOptions);
    
    console.log('Browser context created with user agent:', contextOptions.userAgent);

    // Create page and apply performance settings
    const page = await context.newPage();
    await browserConfig.applyPerformanceSettings(page);

    // Navigate with optimized settings
    await page.goto('https://example.com');
    console.log('Page loaded with performance optimizations');

    // Get different user agents
    console.log('Desktop user agent:', browserConfig.getNextUserAgent(false));
    console.log('Mobile user agent:', browserConfig.getNextUserAgent(true));
    console.log('Random user agent:', browserConfig.getRandomUserAgent());

    // Clean up
    await page.close();
    await context.close();
    await browserManager.cleanup();

  } catch (error) {
    console.error('Error in advanced configuration usage:', error);
  }
}

/**
 * Example 4: Resource Management and Monitoring
 */
async function resourceManagementUsage() {
  console.log('\n=== Resource Management Example ===');
  
  const logger = new Logger('ResourceExample');
  
  // Create resource manager with limits
  const resourceManager = new ResourceManager({
    maxMemoryMB: 512,
    maxPages: 10,
    maxContexts: 5,
    maxBrowsers: 2,
    gcThresholdMB: 256,
    cleanupIntervalMs: 30000
  }, logger);

  const browserManager = new BrowserManager({}, logger);

  try {
    const browser = await browserManager.launch();
    
    // Track browser for resource management
    resourceManager.trackBrowser(browser);

    // Create multiple pages and track them
    const pages = [];
    for (let i = 0; i < 5; i++) {
      const page = await browserManager.createPage();
      resourceManager.trackPage(page);
      pages.push(page);
    }

    // Get resource metrics
    const metrics = resourceManager.getMetrics();
    console.log('Resource metrics:', metrics);
    console.log('Memory usage:', resourceManager.getMemoryUsageString());

    // Check resource limits
    const limits = resourceManager.checkLimits();
    console.log('Resource limits check:', limits);

    // Perform cleanup if needed
    if (resourceManager.shouldTriggerCleanup()) {
      console.log('Triggering resource cleanup...');
      await resourceManager.cleanup({
        forceGC: true,
        closeIdlePages: true,
        closeIdleContexts: true,
        restartBrowser: false,
        idleTimeoutMs: 60000
      });
    }

    // Clean up pages
    for (const page of pages) {
      await browserManager.closePage(page);
    }

    await resourceManager.destroy();
    await browserManager.cleanup();

  } catch (error) {
    console.error('Error in resource management usage:', error);
  }
}

/**
 * Example 5: Health Monitoring and Auto-Recovery
 */
async function healthMonitoringUsage() {
  console.log('\n=== Health Monitoring Example ===');
  
  const logger = new Logger('HealthExample');
  const browserManager = new BrowserManager({}, logger);
  
  // Create health monitor
  const healthMonitor = new BrowserHealthMonitor({
    interval: 10000, // Check every 10 seconds
    timeout: 5000,
    maxFailures: 2,
    recoveryDelay: 3000,
    enableAutoRestart: true,
    enablePageHealthCheck: true,
    enableMemoryMonitoring: true
  }, logger);

  try {
    const browser = await browserManager.launch();

    // Start monitoring with auto-restart capability
    healthMonitor.startMonitoring(browser, async () => {
      console.log('Auto-restart triggered by health monitor');
      return await browserManager.restart();
    });

    // Set up event listeners
    healthMonitor.on('healthCheck', ({ status }) => {
      console.log('Health check result:', {
        isHealthy: status.isHealthy,
        consecutiveFailures: status.consecutiveFailures,
        issueCount: status.issues.length
      });
    });

    healthMonitor.on('healthDegraded', ({ status }) => {
      console.log('Browser health degraded:', status.issues.map(i => i.message));
    });

    healthMonitor.on('healthRestored', () => {
      console.log('Browser health restored');
    });

    healthMonitor.on('browserRestarted', ({ action }) => {
      console.log('Browser restarted successfully:', action.reason);
    });

    // Perform immediate health check
    const status = await healthMonitor.performHealthCheck();
    console.log('Initial health status:', status);

    // Simulate some browser activity
    const page = await browserManager.createPage();
    await page.goto('https://example.com');
    
    // Wait for a few health checks
    await new Promise(resolve => setTimeout(resolve, 25000));

    // Get health history
    const recoveryHistory = healthMonitor.getRecoveryHistory();
    console.log('Recovery actions taken:', recoveryHistory.length);

    // Clean up
    await browserManager.closePage(page);
    await healthMonitor.destroy();
    await browserManager.cleanup();

  } catch (error) {
    console.error('Error in health monitoring usage:', error);
  }
}

/**
 * Example 6: Complete Integration Example
 */
async function completeIntegrationExample() {
  console.log('\n=== Complete Integration Example ===');
  
  const logger = new Logger('IntegrationExample');
  
  // Set up all components
  const browserConfig = new BrowserConfig({
    userAgentRotation: true,
    stealthMode: true,
    resourceOptimization: true
  }, logger);

  const browserManager = new BrowserManager(
    browserConfig.getBrowserLaunchOptions(),
    logger
  );

  const resourceManager = new ResourceManager({
    maxMemoryMB: 1024,
    maxPages: 15,
    gcThresholdMB: 512
  }, logger);

  const healthMonitor = new BrowserHealthMonitor({
    interval: 30000,
    enableAutoRestart: true
  }, logger);

  try {
    // Launch browser
    const browser = await browserManager.launch();
    
    // Set up monitoring and resource tracking
    resourceManager.trackBrowser(browser);
    healthMonitor.startMonitoring(browser, () => browserManager.restart());

    // Create page pool for concurrent operations
    const pagePool = new PagePool(browserManager, {
      minPages: 3,
      maxPages: 8,
      idleTimeout: 300000
    }, logger);

    // Simulate a complex scraping workflow
    console.log('Starting complex scraping workflow...');

    const tasks = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      url: `https://example.com/page${i + 1}`
    }));

    const results = await Promise.all(
      tasks.map(async (task) => {
        const page = await pagePool.acquire();
        
        try {
          // Apply performance settings
          await browserConfig.applyPerformanceSettings(page);
          
          // Navigate and extract data
          await page.goto(task.url);
          const title = await page.title();
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
          
          return { taskId: task.id, url: task.url, title };
        } finally {
          await pagePool.release(page);
        }
      })
    );

    console.log('Scraping completed. Results:', results.length);

    // Check final resource status
    const finalMetrics = resourceManager.getMetrics();
    const finalHealth = await healthMonitor.getStatus();
    const poolStats = pagePool.getStats();

    console.log('Final metrics:', {
      memory: resourceManager.getMemoryUsageString(),
      browserHealth: finalHealth.isHealthy,
      poolSize: poolStats.totalPages,
      availablePages: poolStats.availablePages
    });

    // Clean up all components
    await pagePool.destroy();
    await healthMonitor.destroy();
    await resourceManager.destroy();
    await browserManager.cleanup();

    console.log('Complete integration example finished successfully');

  } catch (error) {
    console.error('Error in complete integration example:', error);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await basicBrowserUsage();
    await pagePoolUsage();
    await advancedConfigurationUsage();
    await resourceManagementUsage();
    await healthMonitoringUsage();
    await completeIntegrationExample();
    
    console.log('\n=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export functions for individual testing
export {
  basicBrowserUsage,
  pagePoolUsage,
  advancedConfigurationUsage,
  resourceManagementUsage,
  healthMonitoringUsage,
  completeIntegrationExample,
  runAllExamples
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
/**
 * Example usage of the configuration system
 * This demonstrates how to use the configuration management in the application
 */

import { 
  initializeConfig, 
  getScrapingConfig, 
  getBrowserConfig,
  isDevelopment,
  isCacheEnabled 
} from './index.js';

/**
 * Example function showing how to initialize and use configuration
 */
export async function exampleConfigUsage(): Promise<void> {
  try {
    // Initialize configuration system
    console.log('Initializing configuration...');
    const configManager = await initializeConfig();
    
    // Get specific configuration sections
    const scrapingConfig = getScrapingConfig();
    const browserConfig = getBrowserConfig();
    
    // Use configuration values
    console.log('Configuration loaded successfully:');
    console.log(`- Environment: ${isDevelopment() ? 'Development' : 'Production'}`);
    console.log(`- Base URL: ${scrapingConfig.baseUrl}`);
    console.log(`- Timeout: ${scrapingConfig.timeout}ms`);
    console.log(`- Max Retries: ${scrapingConfig.maxRetries}`);
    console.log(`- Headless Browser: ${browserConfig.headless}`);
    console.log(`- Cache Enabled: ${isCacheEnabled()}`);
    
    // Get configuration summary
    const summary = configManager.getSummary();
    console.log('Configuration Summary:', summary);
    
  } catch (error) {
    console.error('Failed to initialize configuration:', error);
    throw error;
  }
}

/**
 * Example of how to use configuration in a scraping service
 */
export function createScrapingServiceWithConfig() {
  const scrapingConfig = getScrapingConfig();
  const browserConfig = getBrowserConfig();
  
  return {
    baseUrl: scrapingConfig.baseUrl,
    timeout: scrapingConfig.timeout,
    maxRetries: scrapingConfig.maxRetries,
    userAgent: scrapingConfig.userAgent,
    viewport: scrapingConfig.viewport,
    headless: browserConfig.headless,
    
    // Example method using configuration
    async scrapeWithConfig(url: string) {
      console.log(`Scraping ${url} with timeout ${scrapingConfig.timeout}ms`);
      // Scraping logic would go here
      return { success: true, config: scrapingConfig };
    }
  };
}

/**
 * Example of conditional behavior based on environment
 */
export function getEnvironmentSpecificBehavior() {
  if (isDevelopment()) {
    return {
      logLevel: 'debug',
      enableDetailedLogging: true,
      showBrowser: true
    };
  } else {
    return {
      logLevel: 'warn',
      enableDetailedLogging: false,
      showBrowser: false
    };
  }
}
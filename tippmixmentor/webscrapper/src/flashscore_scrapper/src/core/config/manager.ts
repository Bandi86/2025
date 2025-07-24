/**
 * Configuration manager for the Flashscore scraper application
 * Provides a centralized API for accessing and managing configuration
 */

import type { AppConfig, ConfigValidationResult } from './interfaces.js';
import { loadConfig, getCurrentConfig, reloadConfig, getConfigLoader } from './loader.js';
import { validateConfig } from './validation.js';

// ============================================================================
// CONFIGURATION MANAGER CLASS
// ============================================================================

export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private config: AppConfig | null = null;
  private isLoaded: boolean = false;

  private constructor() {}

  /**
   * Gets the singleton instance of ConfigManager
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Initializes the configuration manager by loading configuration
   */
  public async initialize(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    try {
      this.config = await loadConfig();
      this.isLoaded = true;
      console.info('Configuration loaded successfully');
    } catch (error) {
      console.error('Failed to initialize configuration:', error);
      throw error;
    }
  }

  /**
   * Gets the current configuration
   */
  public getConfig(): AppConfig {
    if (!this.isLoaded || !this.config) {
      throw new Error('Configuration not loaded. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * Gets a specific configuration section
   */
  public getSection<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return this.getConfig()[section];
  }

  /**
   * Gets environment configuration
   */
  public getEnvironment() {
    return this.getSection('environment');
  }

  /**
   * Gets scraping configuration
   */
  public getScraping() {
    return this.getSection('scraping');
  }

  /**
   * Gets cache configuration
   */
  public getCache() {
    return this.getSection('cache');
  }

  /**
   * Gets export configuration
   */
  public getExport() {
    return this.getSection('export');
  }

  /**
   * Gets logging configuration
   */
  public getLogging() {
    return this.getSection('logging');
  }

  /**
   * Gets browser configuration
   */
  public getBrowser() {
    return this.getSection('browser');
  }

  /**
   * Gets rate limiting configuration
   */
  public getRateLimit() {
    return this.getSection('rateLimit');
  }

  /**
   * Checks if the application is in development mode
   */
  public isDevelopment(): boolean {
    return this.getEnvironment().NODE_ENV === 'development';
  }

  /**
   * Checks if the application is in production mode
   */
  public isProduction(): boolean {
    return this.getEnvironment().NODE_ENV === 'production';
  }

  /**
   * Checks if the application is in test mode
   */
  public isTest(): boolean {
    return this.getEnvironment().NODE_ENV === 'test';
  }

  /**
   * Checks if caching is enabled
   */
  public isCacheEnabled(): boolean {
    return this.getCache().enabled;
  }

  /**
   * Checks if rate limiting is enabled
   */
  public isRateLimitEnabled(): boolean {
    return this.getRateLimit().enabled;
  }

  /**
   * Reloads the configuration from all sources
   */
  public async reload(): Promise<void> {
    try {
      this.config = await reloadConfig();
      console.info('Configuration reloaded successfully');
    } catch (error) {
      console.error('Failed to reload configuration:', error);
      throw error;
    }
  }

  /**
   * Validates the current configuration
   */
  public validate(): ConfigValidationResult {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call initialize() first.');
    }
    return validateConfig(this.config);
  }

  /**
   * Gets the validation result from the loader
   */
  public getValidationResult(): ConfigValidationResult | null {
    return getConfigLoader().getValidationResult();
  }

  /**
   * Updates a configuration value at runtime (for testing purposes)
   * Note: This does not persist the change
   */
  public updateConfig(updates: Partial<AppConfig>): void {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call initialize() first.');
    }

    this.config = this.mergeDeep(this.config, updates);
    
    // Validate the updated configuration
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Configuration update validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }
  }

  /**
   * Gets configuration as a plain object (for serialization)
   */
  public toObject(): AppConfig {
    return JSON.parse(JSON.stringify(this.getConfig()));
  }

  /**
   * Gets configuration summary for logging/debugging
   */
  public getSummary(): Record<string, any> {
    const config = this.getConfig();
    return {
      environment: config.environment.NODE_ENV,
      logLevel: config.environment.LOG_LEVEL,
      cacheEnabled: config.cache.enabled,
      rateLimitEnabled: config.rateLimit.enabled,
      maxConcurrentPages: config.scraping.maxConcurrentPages,
      scrapingTimeout: config.scraping.timeout,
      exportPath: config.export.path,
      cachePath: config.cache.path
    };
  }

  /**
   * Deep merge utility function
   */
  private mergeDeep(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Resets the singleton instance (for testing)
   */
  public static reset(): void {
    ConfigManager.instance = null;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Gets the singleton ConfigManager instance
 */
export function getConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}

/**
 * Initializes configuration and returns the manager
 */
export async function initializeConfig(): Promise<ConfigManager> {
  const manager = getConfigManager();
  await manager.initialize();
  return manager;
}

/**
 * Gets the current configuration (throws if not initialized)
 */
export function getAppConfig(): AppConfig {
  return getConfigManager().getConfig();
}

/**
 * Gets environment configuration
 */
export function getEnvironmentConfig() {
  return getConfigManager().getEnvironment();
}

/**
 * Gets scraping configuration
 */
export function getScrapingConfig() {
  return getConfigManager().getScraping();
}

/**
 * Gets cache configuration
 */
export function getCacheConfig() {
  return getConfigManager().getCache();
}

/**
 * Gets export configuration
 */
export function getExportConfig() {
  return getConfigManager().getExport();
}

/**
 * Gets logging configuration
 */
export function getLoggingConfig() {
  return getConfigManager().getLogging();
}

/**
 * Gets browser configuration
 */
export function getBrowserConfig() {
  return getConfigManager().getBrowser();
}

/**
 * Gets rate limiting configuration
 */
export function getRateLimitConfig() {
  return getConfigManager().getRateLimit();
}

/**
 * Checks if the application is in development mode
 */
export function isDevelopment(): boolean {
  return getConfigManager().isDevelopment();
}

/**
 * Checks if the application is in production mode
 */
export function isProduction(): boolean {
  return getConfigManager().isProduction();
}

/**
 * Checks if the application is in test mode
 */
export function isTest(): boolean {
  return getConfigManager().isTest();
}

/**
 * Checks if caching is enabled
 */
export function isCacheEnabled(): boolean {
  return getConfigManager().isCacheEnabled();
}

/**
 * Checks if rate limiting is enabled
 */
export function isRateLimitEnabled(): boolean {
  return getConfigManager().isRateLimitEnabled();
}
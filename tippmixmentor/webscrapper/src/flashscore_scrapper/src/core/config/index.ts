/**
 * Configuration module for the Flashscore scraper application
 * Provides centralized configuration management with validation and environment support
 */

// Export all interfaces and types
export type {
  AppConfig,
  EnvironmentConfig,
  ScrapingConfig,
  CacheConfig,
  ExportConfig,
  LoggingConfig,
  BrowserConfig,
  RateLimitConfig,
  ViewportConfig,
  SelectorConfig,
  ExportFormatConfig,
  ExportValidationConfig,
  StreamingConfig,
  LogTransportConfig,
  LogRotationConfig,
  ConfigValidationRule,
  ConfigValidationResult,
  ConfigValidationError,
  ConfigValidationWarning,
  ConfigSource,
  FileConfigSource,
  EnvironmentConfigSource
} from './interfaces.js';

// Export default configurations
export {
  DEFAULT_CONFIG,
  DEVELOPMENT_OVERRIDES,
  PRODUCTION_OVERRIDES,
  TEST_OVERRIDES
} from './defaults.js';

// Export validation functions
export {
  validateConfig,
  validateEnvironmentVariables,
  CONFIG_VALIDATION_RULES
} from './validation.js';

// Export loader functions
export {
  ConfigLoader,
  getConfigLoader,
  loadConfig,
  getCurrentConfig,
  reloadConfig,
  validateConfiguration,
  createConfigFromEnvironment
} from './loader.js';

// Export manager and convenience functions
export {
  ConfigManager,
  getConfigManager,
  initializeConfig,
  getAppConfig,
  getEnvironmentConfig,
  getScrapingConfig,
  getCacheConfig,
  getExportConfig,
  getLoggingConfig,
  getBrowserConfig,
  getRateLimitConfig,
  isDevelopment,
  isProduction,
  isTest,
  isCacheEnabled,
  isRateLimitEnabled
} from './manager.js';

// ============================================================================
// CONFIGURATION ERRORS
// ============================================================================

/**
 * Configuration-related error class
 */
export class ConfigurationError extends Error {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message);
    this.name = 'ConfigurationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Configuration validation error class
 */
export class ConfigurationValidationError extends ConfigurationError {
  public readonly errors: string[];

  constructor(message: string, errors: string[]) {
    super(message);
    this.name = 'ConfigurationValidationError';
    this.errors = errors;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a configuration object for testing with minimal required values
 */
export function createTestConfig(overrides: Partial<import('./interfaces.js').AppConfig> = {}): import('./interfaces.js').AppConfig {
  const testConfig: import('./interfaces.js').AppConfig = {
    environment: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      CACHE_ENABLED: false,
      CACHE_TTL: 60000,
      MAX_CONCURRENT_PAGES: 1,
      SCRAPING_TIMEOUT: 5000,
      EXPORT_PATH: './test-data',
      CACHE_PATH: './test-cache'
    },
    scraping: {
      baseUrl: 'https://www.flashscore.com',
      timeout: 5000,
      maxRetries: 1,
      retryDelay: 100,
      requestDelay: 100,
      maxConcurrentPages: 1,
      userAgent: 'test-agent',
      viewport: { width: 800, height: 600 },
      selectors: {
        match: {
          container: '.test-match',
          stage: '.test-stage',
          date: '.test-date',
          status: '.test-status',
          homeTeam: '.test-home',
          awayTeam: '.test-away',
          score: '.test-score'
        },
        league: {
          container: '.test-league',
          name: '.test-league-name',
          country: '.test-country'
        },
        season: {
          container: '.test-season',
          name: '.test-season-name',
          year: '.test-year'
        }
      }
    },
    cache: {
      enabled: false,
      path: './test-cache',
      ttl: {
        matches: 60000,
        leagues: 60000,
        seasons: 60000,
        countries: 60000
      },
      maxSize: 10485760,
      cleanupInterval: 60000
    },
    export: {
      path: './test-data',
      formats: {
        json: { indent: 2, sortKeys: false },
        csv: { delimiter: ',', quote: '"', escape: '"', header: true },
        xml: { rootElement: 'test', declaration: false, indent: false }
      },
      validation: {
        enabled: false,
        strictMode: false,
        requiredFields: []
      },
      streaming: {
        enabled: false,
        chunkSize: 100,
        memoryThreshold: 1048576
      }
    },
    logging: {
      level: 'error',
      format: 'simple',
      transports: [{ type: 'console', level: 'error' }],
      rotation: {
        maxSize: '1m',
        maxFiles: 1,
        datePattern: 'YYYY-MM-DD'
      }
    },
    browser: {
      headless: true,
      viewport: { width: 800, height: 600 },
      userAgent: 'test-agent',
      timeout: 5000,
      args: ['--no-sandbox']
    },
    rateLimit: {
      requestsPerSecond: 10,
      burstLimit: 10,
      cooldownPeriod: 1000,
      enabled: false
    }
  };

  return mergeDeep(testConfig, overrides);
}

/**
 * Deep merge utility function
 */
function mergeDeep(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Validates that required environment variables are set
 */
export function validateRequiredEnvironmentVariables(required: string[]): void {
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Gets a configuration value with a fallback
 */
export function getConfigValue<T>(
  getter: () => T,
  fallback: T,
  errorMessage?: string
): T {
  try {
    return getter();
  } catch (error) {
    if (errorMessage) {
      console.warn(errorMessage, error);
    }
    return fallback;
  }
}
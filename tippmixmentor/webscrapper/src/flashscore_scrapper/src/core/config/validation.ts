/**
 * Configuration validation system for the Flashscore scraper application
 */

import type {
  AppConfig,
  ConfigValidationRule,
  ConfigValidationResult,
  ConfigValidationError,
  ConfigValidationWarning
} from './interfaces.js';

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const CONFIG_VALIDATION_RULES: ConfigValidationRule[] = [
  // Environment validation
  {
    field: 'environment.NODE_ENV',
    required: true,
    type: 'string',
    validator: (value: string) => ['development', 'production', 'test'].includes(value),
    message: 'NODE_ENV must be one of: development, production, test'
  },
  {
    field: 'environment.LOG_LEVEL',
    required: true,
    type: 'string',
    validator: (value: string) => ['debug', 'info', 'warn', 'error'].includes(value),
    message: 'LOG_LEVEL must be one of: debug, info, warn, error'
  },
  {
    field: 'environment.CACHE_ENABLED',
    required: true,
    type: 'boolean',
    message: 'CACHE_ENABLED must be a boolean value'
  },
  {
    field: 'environment.CACHE_TTL',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 86400000, // Max 24 hours
    message: 'CACHE_TTL must be a positive number not exceeding 24 hours (86400000ms)'
  },
  {
    field: 'environment.MAX_CONCURRENT_PAGES',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 10,
    message: 'MAX_CONCURRENT_PAGES must be between 1 and 10'
  },
  {
    field: 'environment.SCRAPING_TIMEOUT',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 300000, // Max 5 minutes
    message: 'SCRAPING_TIMEOUT must be between 1ms and 300000ms (5 minutes)'
  },
  {
    field: 'environment.EXPORT_PATH',
    required: true,
    type: 'string',
    validator: (value: string) => value.length > 0,
    message: 'EXPORT_PATH must be a non-empty string'
  },
  {
    field: 'environment.CACHE_PATH',
    required: true,
    type: 'string',
    validator: (value: string) => value.length > 0,
    message: 'CACHE_PATH must be a non-empty string'
  },

  // Scraping configuration validation
  {
    field: 'scraping.baseUrl',
    required: true,
    type: 'string',
    validator: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'scraping.baseUrl must be a valid URL'
  },
  {
    field: 'scraping.timeout',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 300000,
    message: 'scraping.timeout must be between 1ms and 300000ms (5 minutes)'
  },
  {
    field: 'scraping.maxRetries',
    required: true,
    type: 'number',
    validator: (value: number) => value >= 0 && value <= 10,
    message: 'scraping.maxRetries must be between 0 and 10'
  },
  {
    field: 'scraping.retryDelay',
    required: true,
    type: 'number',
    validator: (value: number) => value >= 0 && value <= 60000,
    message: 'scraping.retryDelay must be between 0ms and 60000ms (1 minute)'
  },
  {
    field: 'scraping.requestDelay',
    required: true,
    type: 'number',
    validator: (value: number) => value >= 0 && value <= 10000,
    message: 'scraping.requestDelay must be between 0ms and 10000ms (10 seconds)'
  },
  {
    field: 'scraping.maxConcurrentPages',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 10,
    message: 'scraping.maxConcurrentPages must be between 1 and 10'
  },
  {
    field: 'scraping.userAgent',
    required: true,
    type: 'string',
    validator: (value: string) => value.length > 0 && value.length <= 500,
    message: 'scraping.userAgent must be a non-empty string with max 500 characters'
  },
  {
    field: 'scraping.viewport.width',
    required: true,
    type: 'number',
    validator: (value: number) => value >= 320 && value <= 3840,
    message: 'scraping.viewport.width must be between 320 and 3840 pixels'
  },
  {
    field: 'scraping.viewport.height',
    required: true,
    type: 'number',
    validator: (value: number) => value >= 240 && value <= 2160,
    message: 'scraping.viewport.height must be between 240 and 2160 pixels'
  },

  // Cache configuration validation
  {
    field: 'cache.enabled',
    required: true,
    type: 'boolean',
    message: 'cache.enabled must be a boolean value'
  },
  {
    field: 'cache.path',
    required: true,
    type: 'string',
    validator: (value: string) => value.length > 0,
    message: 'cache.path must be a non-empty string'
  },
  {
    field: 'cache.maxSize',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 10737418240, // Max 10GB
    message: 'cache.maxSize must be between 1 byte and 10GB (10737418240 bytes)'
  },
  {
    field: 'cache.cleanupInterval',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 86400000, // Max 24 hours
    message: 'cache.cleanupInterval must be between 1ms and 24 hours (86400000ms)'
  },

  // Export configuration validation
  {
    field: 'export.path',
    required: true,
    type: 'string',
    validator: (value: string) => value.length > 0,
    message: 'export.path must be a non-empty string'
  },
  {
    field: 'export.formats.json.indent',
    required: true,
    type: 'number',
    validator: (value: number) => value >= 0 && value <= 10,
    message: 'export.formats.json.indent must be between 0 and 10'
  },
  {
    field: 'export.formats.csv.delimiter',
    required: true,
    type: 'string',
    validator: (value: string) => value.length === 1,
    message: 'export.formats.csv.delimiter must be a single character'
  },
  {
    field: 'export.streaming.chunkSize',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 10000,
    message: 'export.streaming.chunkSize must be between 1 and 10000'
  },
  {
    field: 'export.streaming.memoryThreshold',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 1073741824, // Max 1GB
    message: 'export.streaming.memoryThreshold must be between 1 byte and 1GB (1073741824 bytes)'
  },

  // Browser configuration validation
  {
    field: 'browser.headless',
    required: true,
    type: 'boolean',
    message: 'browser.headless must be a boolean value'
  },
  {
    field: 'browser.timeout',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 300000,
    message: 'browser.timeout must be between 1ms and 300000ms (5 minutes)'
  },

  // Rate limiting validation
  {
    field: 'rateLimit.requestsPerSecond',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 100,
    message: 'rateLimit.requestsPerSecond must be between 0.1 and 100'
  },
  {
    field: 'rateLimit.burstLimit',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 1000,
    message: 'rateLimit.burstLimit must be between 1 and 1000'
  },
  {
    field: 'rateLimit.cooldownPeriod',
    required: true,
    type: 'number',
    validator: (value: number) => value > 0 && value <= 3600000, // Max 1 hour
    message: 'rateLimit.cooldownPeriod must be between 1ms and 1 hour (3600000ms)'
  }
];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates the entire application configuration
 */
export function validateConfig(config: AppConfig): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];
  const warnings: ConfigValidationWarning[] = [];

  for (const rule of CONFIG_VALIDATION_RULES) {
    const result = validateConfigField(config, rule);
    
    if (result.error) {
      errors.push(result.error);
    }
    
    if (result.warning) {
      warnings.push(result.warning);
    }
  }

  // Additional cross-field validations
  const crossValidationResult = performCrossFieldValidation(config);
  errors.push(...crossValidationResult.errors);
  warnings.push(...crossValidationResult.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a single configuration field
 */
function validateConfigField(
  config: AppConfig, 
  rule: ConfigValidationRule
): { error?: ConfigValidationError; warning?: ConfigValidationWarning } {
  const value = getNestedValue(config, rule.field);
  
  // Check if required field is missing
  if (rule.required && (value === undefined || value === null)) {
    return {
      error: {
        field: rule.field,
        message: rule.message || `Required field '${rule.field}' is missing`,
        value
      }
    };
  }

  // Skip validation if field is not required and missing
  if (!rule.required && (value === undefined || value === null)) {
    return {};
  }

  // Type validation
  if (!validateType(value, rule.type)) {
    return {
      error: {
        field: rule.field,
        message: rule.message || `Field '${rule.field}' must be of type '${rule.type}'`,
        value
      }
    };
  }

  // Custom validator
  if (rule.validator && !rule.validator(value)) {
    return {
      error: {
        field: rule.field,
        message: rule.message || `Field '${rule.field}' failed validation`,
        value
      }
    };
  }

  return {};
}

/**
 * Performs cross-field validation checks
 */
function performCrossFieldValidation(config: AppConfig): {
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
} {
  const errors: ConfigValidationError[] = [];
  const warnings: ConfigValidationWarning[] = [];

  // Validate that scraping timeout is not greater than browser timeout
  if (config.scraping.timeout > config.browser.timeout) {
    warnings.push({
      field: 'scraping.timeout',
      message: 'Scraping timeout is greater than browser timeout, which may cause unexpected behavior',
      value: config.scraping.timeout
    });
  }

  // Validate that cache TTL values are reasonable
  if (config.cache.enabled) {
    const maxTtl = Math.max(
      config.cache.ttl.matches,
      config.cache.ttl.leagues,
      config.cache.ttl.seasons,
      config.cache.ttl.countries
    );
    
    if (maxTtl > config.cache.cleanupInterval * 10) {
      warnings.push({
        field: 'cache.cleanupInterval',
        message: 'Cache cleanup interval is much shorter than TTL values, which may cause frequent cleanup operations',
        value: config.cache.cleanupInterval
      });
    }
  }

  // Validate rate limiting configuration
  if (config.rateLimit.enabled) {
    const maxRequestsPerCooldown = config.rateLimit.requestsPerSecond * (config.rateLimit.cooldownPeriod / 1000);
    if (config.rateLimit.burstLimit > maxRequestsPerCooldown * 2) {
      warnings.push({
        field: 'rateLimit.burstLimit',
        message: 'Burst limit is very high compared to sustained rate, which may not provide effective rate limiting',
        value: config.rateLimit.burstLimit
      });
    }
  }

  // Validate concurrent pages vs rate limiting
  if (config.scraping.maxConcurrentPages > config.rateLimit.requestsPerSecond * 2) {
    warnings.push({
      field: 'scraping.maxConcurrentPages',
      message: 'Max concurrent pages is high compared to rate limit, which may cause throttling',
      value: config.scraping.maxConcurrentPages
    });
  }

  return { errors, warnings };
}

/**
 * Validates the type of a value
 */
function validateType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return false;
  }
}

/**
 * Gets a nested value from an object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Validates environment variables and converts them to appropriate types
 */
export function validateEnvironmentVariables(env: Record<string, string | undefined>): {
  isValid: boolean;
  errors: string[];
  parsed: Partial<AppConfig>;
} {
  const errors: string[] = [];
  const parsed: any = {};

  // Helper function to parse boolean values
  const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  };

  // Helper function to parse number values
  const parseNumber = (value: string | undefined, defaultValue: number, fieldName: string): number => {
    if (value === undefined) return defaultValue;
    const parsed = Number(value);
    if (isNaN(parsed)) {
      errors.push(`Invalid number value for ${fieldName}: ${value}`);
      return defaultValue;
    }
    return parsed;
  };

  // Parse environment variables
  try {
    parsed.environment = {
      NODE_ENV: env.NODE_ENV || 'development',
      LOG_LEVEL: env.LOG_LEVEL || 'info',
      CACHE_ENABLED: parseBoolean(env.CACHE_ENABLED, true),
      CACHE_TTL: parseNumber(env.CACHE_TTL, 3600000, 'CACHE_TTL'),
      MAX_CONCURRENT_PAGES: parseNumber(env.MAX_CONCURRENT_PAGES, 3, 'MAX_CONCURRENT_PAGES'),
      SCRAPING_TIMEOUT: parseNumber(env.SCRAPING_TIMEOUT, 30000, 'SCRAPING_TIMEOUT'),
      EXPORT_PATH: env.EXPORT_PATH || './data',
      CACHE_PATH: env.CACHE_PATH || './cache'
    };

    // Validate parsed environment values
    const envValidationRules = CONFIG_VALIDATION_RULES.filter(rule => 
      rule.field.startsWith('environment.')
    );

    for (const rule of envValidationRules) {
      const value = getNestedValue(parsed, rule.field);
      if (rule.validator && !rule.validator(value)) {
        errors.push(rule.message || `Invalid value for ${rule.field}: ${value}`);
      }
    }

  } catch (error) {
    errors.push(`Failed to parse environment variables: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed
  };
}
/**
 * Configuration interfaces for the Flashscore scraper application
 */

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  CACHE_ENABLED: boolean;
  CACHE_TTL: number;
  MAX_CONCURRENT_PAGES: number;
  SCRAPING_TIMEOUT: number;
  EXPORT_PATH: string;
  CACHE_PATH: string;
}

// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

export interface AppConfig {
  environment: EnvironmentConfig;
  scraping: ScrapingConfig;
  cache: CacheConfig;
  export: ExportConfig;
  logging: LoggingConfig;
  browser: BrowserConfig;
  rateLimit: RateLimitConfig;
}

// ============================================================================
// SCRAPING CONFIGURATION
// ============================================================================

export interface ScrapingConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  requestDelay: number;
  maxConcurrentPages: number;
  userAgent: string;
  viewport: ViewportConfig;
  selectors: SelectorConfig;
}

export interface ViewportConfig {
  width: number;
  height: number;
}

export interface SelectorConfig {
  match: {
    container: string;
    stage: string;
    date: string;
    status: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
  };
  league: {
    container: string;
    name: string;
    country: string;
  };
  season: {
    container: string;
    name: string;
    year: string;
  };
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export interface CacheConfig {
  enabled: boolean;
  path: string;
  ttl: {
    matches: number;
    leagues: number;
    seasons: number;
    countries: number;
  };
  maxSize: number;
  cleanupInterval: number;
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

export interface ExportConfig {
  path: string;
  formats: ExportFormatConfig;
  validation: ExportValidationConfig;
  streaming: StreamingConfig;
}

export interface ExportFormatConfig {
  json: {
    indent: number;
    sortKeys: boolean;
  };
  csv: {
    delimiter: string;
    quote: string;
    escape: string;
    header: boolean;
  };
  xml: {
    rootElement: string;
    declaration: boolean;
    indent: boolean;
  };
}

export interface ExportValidationConfig {
  enabled: boolean;
  strictMode: boolean;
  requiredFields: string[];
}

export interface StreamingConfig {
  enabled: boolean;
  chunkSize: number;
  memoryThreshold: number;
}

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'simple' | 'combined';
  transports: LogTransportConfig[];
  rotation: LogRotationConfig;
}

export interface LogTransportConfig {
  type: 'console' | 'file' | 'http';
  level?: string;
  filename?: string;
  maxSize?: string;
  maxFiles?: number;
  url?: string;
}

export interface LogRotationConfig {
  maxSize: string;
  maxFiles: number;
  datePattern: string;
}

// ============================================================================
// BROWSER CONFIGURATION
// ============================================================================

export interface BrowserConfig {
  headless: boolean;
  viewport: ViewportConfig;
  userAgent: string;
  timeout: number;
  args: string[];
  executablePath?: string;
  slowMo?: number;
}

// ============================================================================
// RATE LIMITING CONFIGURATION
// ============================================================================

export interface RateLimitConfig {
  requestsPerSecond: number;
  burstLimit: number;
  cooldownPeriod: number;
  enabled: boolean;
}

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================

export interface ConfigValidationRule<T = any> {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  validator?: (value: T) => boolean;
  message?: string;
  defaultValue?: T;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
}

export interface ConfigValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ConfigValidationWarning {
  field: string;
  message: string;
  value?: any;
}

// ============================================================================
// CONFIGURATION SOURCES
// ============================================================================

export interface ConfigSource {
  name: string;
  priority: number;
  load(): Promise<Partial<AppConfig>>;
}

export interface FileConfigSource extends ConfigSource {
  filePath: string;
  format: 'json' | 'yaml' | 'env';
}

export interface EnvironmentConfigSource extends ConfigSource {
  prefix?: string;
}
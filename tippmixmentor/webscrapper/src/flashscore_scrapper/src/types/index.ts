// Type definitions for the Flashscore scraper

// Re-export all core types and interfaces
export * from './core.js';
export * from './browser.js';
export * from './cache.js';
export * from './errors.js';
export * from './export.js';
export * from './logging.js';

// Re-export validation types with explicit naming to avoid conflicts
export type {
  IValidator,
  IValidationRule,
  ISchemaValidator,
  ValidationResult as ValidationResultType,
  FieldValidationResult,
  ValidationError as ValidationErrorType,
  ValidationWarning,
  ValidationErrorCode,
  ValidationWarningCode,
  ValidationSchema,
  ValidationRule,
  CustomValidator,
  ValidationFieldType,
  MatchDataValidationSchema,
  ScrapingOptionsValidationSchema,
  ValidationUtils,
  ValidationConfig,
  ValidationEvent,
  ValidationEventType,
  IValidationEventListener
} from './validation.js';

// Re-export scraping types with explicit naming to avoid conflicts
export type {
  IScrapingService,
  IMatchScrapingService,
  ICountryScrapingService,
  ILeagueScrapingService,
  ISeasonScrapingService,
  IBaseScrapingService,
  ScrapingServiceConfig,
  SelectorMap,
  SelectorDefinition,
  TimeoutConfig,
  RetryConfig,
  ValidationRuleSet,
  ScrapingContext,
  ScrapingResult,
  ScrapingMetadata as ScrapingMetadataType,
  PerformanceMetrics,
  ScrapingEvent,
  ScrapingEventType,
  IScrapingEventListener,
  IScrapingUtils,
  ISelectorManager,
  SelectorValidationResult,
  IRateLimiter,
  RateLimitConfig,
  RateLimitStats
} from './scraping.js';

// Legacy interfaces for backward compatibility
export interface ProgressBarOptions {
  total: number;
  format?: string;
  width?: number;
}

export interface FileWriteOptions {
  data: MatchDataCollection;
  fileType: 'json' | 'csv';
  fileName: string;
  outputPath: string;
}

// Import types for re-export
import { MatchDataCollection } from './core.js';
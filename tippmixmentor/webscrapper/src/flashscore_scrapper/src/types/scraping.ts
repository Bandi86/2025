// Scraping service interfaces and types

import { Page } from 'playwright';
import { ScrapingOptions, MatchData, Country, League, Season } from './core.js';
import { ValidationResult } from './validation.js';

// ============================================================================
// SCRAPING SERVICE INTERFACES
// ============================================================================

export interface IScrapingService<T> {
  scrape(url: string, options?: ScrapingOptions): Promise<T>;
  validate(data: T): boolean;
  transform(data: any): T;
  getServiceName(): string;
  getVersion(): string;
}

export interface IMatchScrapingService extends IScrapingService<MatchData> {
  scrapeMatch(matchId: string, page: Page): Promise<MatchData>;
  scrapeMatchList(url: string, page: Page): Promise<string[]>;
  extractMatchData(page: Page): Promise<Partial<MatchData>>;
  validateMatchData(data: Partial<MatchData>): ValidationResult;
}

export interface ICountryScrapingService extends IScrapingService<Country[]> {
  scrapeCountries(page: Page): Promise<Country[]>;
  extractCountryData(page: Page): Promise<Country[]>;
  validateCountryData(data: Country[]): ValidationResult;
}

export interface ILeagueScrapingService extends IScrapingService<League[]> {
  scrapeLeagues(countryUrl: string, page: Page): Promise<League[]>;
  extractLeagueData(page: Page): Promise<League[]>;
  validateLeagueData(data: League[]): ValidationResult;
}

export interface ISeasonScrapingService extends IScrapingService<Season[]> {
  scrapeSeasons(leagueUrl: string, page: Page): Promise<Season[]>;
  extractSeasonData(page: Page): Promise<Season[]>;
  validateSeasonData(data: Season[]): ValidationResult;
}

// ============================================================================
// BASE SCRAPING SERVICE
// ============================================================================

export interface IBaseScrapingService {
  setPage(page: Page): void;
  getPage(): Page | null;
  waitForSelector(selector: string, timeout?: number): Promise<boolean>;
  extractText(selector: string): Promise<string | null>;
  extractAttribute(selector: string, attribute: string): Promise<string | null>;
  extractMultiple(selector: string): Promise<string[]>;
  handleError(error: Error, context: string): Promise<void>;
  retry<T>(operation: () => Promise<T>, maxAttempts?: number): Promise<T>;
}

// ============================================================================
// SCRAPING CONFIGURATION
// ============================================================================

export interface ScrapingServiceConfig {
  name: string;
  version: string;
  baseUrl: string;
  selectors: SelectorMap;
  timeouts: TimeoutConfig;
  retryConfig: RetryConfig;
  validationRules: ValidationRuleSet;
}

export interface SelectorMap {
  [key: string]: string | SelectorDefinition;
}

export interface SelectorDefinition {
  primary: string;
  fallback?: string[];
  required: boolean;
  timeout?: number;
  waitFor?: 'visible' | 'attached' | 'detached' | 'hidden';
}

export interface TimeoutConfig {
  navigation: number;
  selector: number;
  extraction: number;
  validation: number;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  backoffFactor: number;
  retryableErrors: string[];
}

export interface ValidationRuleSet {
  required: string[];
  optional: string[];
  formats: Record<string, RegExp>;
  customRules: Record<string, (value: any) => boolean>;
}

// ============================================================================
// SCRAPING CONTEXT AND METADATA
// ============================================================================

export interface ScrapingContext {
  url: string;
  page: Page;
  startTime: Date;
  userAgent: string;
  sessionId: string;
  options: ScrapingOptions;
  metadata: Record<string, any>;
}

export interface ScrapingResult<T> {
  data: T;
  success: boolean;
  errors: string[];
  warnings: string[];
  metadata: ScrapingMetadata;
  performance: PerformanceMetrics;
}

export interface ScrapingMetadata {
  scrapedAt: Date;
  source: string;
  version: string;
  checksum: string;
  url: string;
  userAgent: string;
  duration: number;
  retryCount: number;
}

export interface PerformanceMetrics {
  totalTime: number;
  navigationTime: number;
  extractionTime: number;
  validationTime: number;
  memoryUsage: number;
  networkRequests: number;
}

// ============================================================================
// SCRAPING EVENTS
// ============================================================================

export interface ScrapingEvent {
  type: ScrapingEventType;
  timestamp: Date;
  service: string;
  url?: string;
  data?: any;
  error?: Error;
}

export enum ScrapingEventType {
  SCRAPING_STARTED = 'scraping_started',
  SCRAPING_COMPLETED = 'scraping_completed',
  SCRAPING_FAILED = 'scraping_failed',
  DATA_EXTRACTED = 'data_extracted',
  VALIDATION_COMPLETED = 'validation_completed',
  RETRY_ATTEMPTED = 'retry_attempted',
  SELECTOR_NOT_FOUND = 'selector_not_found',
  FALLBACK_SELECTOR_USED = 'fallback_selector_used'
}

export interface IScrapingEventListener {
  onScrapingEvent(event: ScrapingEvent): void;
}

// ============================================================================
// SCRAPING UTILITIES
// ============================================================================

export interface IScrapingUtils {
  generateChecksum(data: any): string;
  sanitizeText(text: string): string;
  parseDate(dateString: string): Date | null;
  parseScore(scoreString: string): { home: string; away: string } | null;
  extractNumbers(text: string): number[];
  normalizeTeamName(name: string): string;
  validateUrl(url: string): boolean;
}

export interface ISelectorManager {
  getSelector(key: string): SelectorDefinition | null;
  addSelector(key: string, definition: SelectorDefinition): void;
  removeSelector(key: string): void;
  updateSelector(key: string, definition: Partial<SelectorDefinition>): void;
  validateSelectors(page: Page): Promise<SelectorValidationResult>;
}

export interface SelectorValidationResult {
  valid: string[];
  invalid: string[];
  warnings: string[];
  suggestions: Record<string, string>;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface IRateLimiter {
  canProceed(): Promise<boolean>;
  recordRequest(): void;
  getDelay(): number;
  reset(): void;
  getStats(): RateLimitStats;
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  burstLimit: number;
  cooldownPeriod: number;
}

export interface RateLimitStats {
  requestsInLastSecond: number;
  requestsInLastMinute: number;
  totalRequests: number;
  averageDelay: number;
  lastRequestTime: Date;
}
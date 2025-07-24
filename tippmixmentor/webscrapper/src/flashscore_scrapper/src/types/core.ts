// Core data models and interfaces for the Flashscore scraper

import { Browser, Page } from 'playwright';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  FINISHED = 'finished',
  POSTPONED = 'postponed',
  CANCELLED = 'cancelled',
  ABANDONED = 'abandoned'
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  XML = 'xml'
}

// Type alias for backward compatibility
export type FileType = 'json' | 'csv' | ExportFormat;

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum ErrorType {
  NETWORK = 'network',
  SCRAPING = 'scraping',
  VALIDATION = 'validation',
  SYSTEM = 'system',
  CONFIGURATION = 'configuration'
}

// ============================================================================
// CORE DATA MODELS
// ============================================================================

export interface ScrapingMetadata {
  scrapedAt: Date;
  source: string;
  version: string;
  checksum: string;
}

export interface Team {
  name: string;
  image?: string;
  id?: string;
}

export interface MatchResult {
  home: string;
  away: string;
  regulationTime?: string;
  penalties?: string;
  extraTime?: string;
}

export interface MatchInformation {
  category: string;
  value: string;
}

export interface MatchStatistic {
  category: string;
  homeValue: string;
  awayValue: string;
}

export interface MatchData {
  id?: string;
  stage: string;
  date: Date | string;
  status: MatchStatus | string;
  home: Team;
  away: Team;
  result: MatchResult;
  information: MatchInformation[];
  statistics: MatchStatistic[];
  metadata?: ScrapingMetadata;
}

export interface Country {
  id: string;
  name: string;
  url: string;
}

export interface League {
  id: string;
  name: string;
  url: string;
  country?: string;
}

export interface Season {
  id: string;
  name: string;
  url: string;
  league?: string;
  year?: number;
}

export interface MatchDataCollection {
  [matchId: string]: MatchData;
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

export interface ScrapingOptions {
  country: string | null;
  league: string | null;
  season?: string | null;
  fileType: ExportFormat | 'json' | 'csv' | null;
  headless: boolean | 'shell';
  concurrent?: boolean;
  maxRetries?: number;
  timeout?: number;
  cacheEnabled?: boolean;
  cacheTtl?: number;
  maxConcurrentPages?: number;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface BrowserOptions {
  headless: boolean;
  timeout: number;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  args?: string[];
}

export interface ExportOptions {
  format: ExportFormat;
  outputPath: string;
  fileName: string;
  pretty?: boolean;
  compression?: boolean;
  streaming?: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  path: string;
  compression: boolean;
}

export interface AppConfig {
  scraping: ScrapingOptions;
  cache: CacheConfig;
  logging: {
    level: LogLevel;
    file?: string;
    console: boolean;
  };
  browser: BrowserOptions;
}
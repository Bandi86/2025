import { DateTime } from 'luxon';
import { z } from 'zod';
import { 
  ESPN_BASE_URLS, 
  LEAGUES, 
  ERROR_MESSAGES,
  RETRY_CONFIG 
} from '../config/index.js';
import type { 
  ESPNApiError, 
  CacheEntry,
  ESPNApiResponse 
} from '../types/index.js';

// URL Builder
export class URLBuilder {
  private static replaceParams(url: string, params: Record<string, string | number>): string {
    let result = url;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
    return result;
  }

  static buildSiteUrl(endpoint: string, params: Record<string, string | number>): string {
    const path = this.replaceParams(endpoint, params);
    return `${ESPN_BASE_URLS.SITE_API}${path}`;
  }

  static buildCoreUrl(endpoint: string, params: Record<string, string | number>): string {
    const path = this.replaceParams(endpoint, params);
    return `${ESPN_BASE_URLS.CORE_API}${path}`;
  }

  static buildFantasyUrl(endpoint: string, params: Record<string, string | number>): string {
    const path = this.replaceParams(endpoint, params);
    return `${ESPN_BASE_URLS.FANTASY_API}${path}`;
  }

  static buildNewsUrl(endpoint: string, params: Record<string, string | number>): string {
    const path = this.replaceParams(endpoint, params);
    return `${ESPN_BASE_URLS.NEWS_API}${path}`;
  }

  static addQueryParams(url: string, params: Record<string, any>): string {
    const urlObj = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    }
    return urlObj.toString();
  }
}

// Rate Limiter
export class RateLimiter {
  private requests: Date[] = [];
  private readonly maxRequestsPerSecond: number;
  private readonly maxRequestsPerMinute: number;

  constructor(requestsPerSecond: number, requestsPerMinute: number) {
    this.maxRequestsPerSecond = requestsPerSecond;
    this.maxRequestsPerMinute = requestsPerMinute;
  }

  async waitForSlot(): Promise<void> {
    const now = new Date();
    
    // Remove old requests
    this.requests = this.requests.filter(
      req => now.getTime() - req.getTime() < 60000 // Keep last minute
    );

    // Check rate limits
    const requestsLastSecond = this.requests.filter(
      req => now.getTime() - req.getTime() < 1000
    );

    const requestsLastMinute = this.requests.length;

    if (requestsLastSecond.length >= this.maxRequestsPerSecond) {
      const delay = 1000 - (now.getTime() - requestsLastSecond[0]?.getTime() || 0);
      if (delay > 0) {
        await this.sleep(delay);
      }
    }

    if (requestsLastMinute >= this.maxRequestsPerMinute) {
      const oldestRequest = this.requests[0];
      const delay = 60000 - (now.getTime() - oldestRequest.getTime());
      if (delay > 0) {
        await this.sleep(delay);
      }
    }

    this.requests.push(now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Cache Manager
export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 300000) {
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      ttl: ttl || this.defaultTTL,
      key,
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T>;
    if (!entry) return null;

    const now = new Date();
    const age = now.getTime() - entry.timestamp.getTime();

    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Error Handler
export class ErrorHandler {
  static createError(message: string, status?: number, code?: string, details?: any): ESPNApiError {
    return {
      message,
      status: status || 500,
      code,
      details,
      timestamp: new Date(),
    };
  }

  static handleApiError(error: any): ESPNApiError {
    if (error.response) {
      // API responded with error status
      return this.createError(
        error.response.data?.message || ERROR_MESSAGES.API_ERROR,
        error.response.status,
        error.response.statusText,
        error.response.data
      );
    } else if (error.request) {
      // Network error
      return this.createError(
        ERROR_MESSAGES.NETWORK_ERROR,
        undefined,
        'NETWORK_ERROR',
        error.request
      );
    } else {
      // Other error
      return this.createError(
        error.message || 'Unknown error occurred',
        undefined,
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  static isRetryableError(error: ESPNApiError): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status || 0);
  }
}

// Retry Handler
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = RETRY_CONFIG.MAX_RETRIES,
    delay: number = RETRY_CONFIG.RETRY_DELAY
  ): Promise<T> {
    let lastError: ESPNApiError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = ErrorHandler.handleApiError(error);
        
        if (attempt === maxRetries || !ErrorHandler.isRetryableError(lastError)) {
          throw lastError;
        }

        const backoffDelay = delay * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt);
        const finalDelay = Math.min(backoffDelay, RETRY_CONFIG.MAX_DELAY);
        
        await this.sleep(finalDelay);
      }
    }

    throw lastError!;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Validation Utils
export class ValidationUtils {
  private static leagueSchema = z.object({
    name: z.string(),
    code: z.string(),
    sport: z.string(),
  });

  private static sportSchema = z.enum(['soccer', 'football', 'basketball', 'baseball', 'hockey']);

  static validateLeague(league: any): boolean {
    try {
      this.leagueSchema.parse(league);
      return true;
    } catch {
      return false;
    }
  }

  static validateSport(sport: string): boolean {
    try {
      this.sportSchema.parse(sport);
      return true;
    } catch {
      return false;
    }
  }

  static validateTeamId(teamId: string): boolean {
    return /^\d+$/.test(teamId);
  }

  static validateAthleteId(athleteId: string): boolean {
    return /^\d+$/.test(athleteId);
  }

  static validateEventId(eventId: string): boolean {
    return /^\d+$/.test(eventId);
  }
}

// Data Transformers
export class DataTransformers {
  static transformDate(dateString: string, timezone: string = 'Europe/Budapest'): string {
    try {
      return DateTime.fromISO(dateString)
        .setZone(timezone)
        .toFormat('yyyy-MM-dd HH:mm');
    } catch {
      return dateString;
    }
  }

  static transformScore(score: any): string {
    if (typeof score === 'string') return score;
    if (typeof score === 'number') return score.toString();
    if (score?.displayValue) return score.displayValue;
    return 'N/A';
  }

  static transformOdds(odds: any[]): any[] {
    return odds?.map(odd => ({
      provider: odd.provider?.name || 'Unknown',
      details: odd.details || '',
      overUnder: odd.overUnder,
      spread: odd.spread,
      moneyLine: odd.moneyLine,
      homeOdds: odd.homeOdds,
      awayOdds: odd.awayOdds,
      drawOdds: odd.drawOdds,
    })) || [];
  }

  static transformTeam(team: any): any {
    return {
      id: team.id,
      name: team.name,
      displayName: team.displayName || team.name,
      abbreviation: team.abbreviation,
      location: team.location,
      nickname: team.nickname,
      color: team.color,
      logo: team.logo,
      record: team.record ? {
        wins: team.record.wins || 0,
        losses: team.record.losses || 0,
        ties: team.record.ties || 0,
        winPercentage: team.record.winPercentage || 0,
        gamesPlayed: team.record.gamesPlayed || 0,
      } : undefined,
    };
  }

  static transformEvent(event: any): any {
    return {
      id: event.id,
      name: event.name,
      shortName: event.shortName,
      date: event.date,
      status: event.status?.type?.description || 'unknown',
      competitions: event.competitions?.map((comp: any) => ({
        id: comp.id,
        date: comp.date,
        status: comp.status?.type?.description || 'unknown',
        competitors: comp.competitors?.map((comp: any) => ({
          id: comp.id,
          homeAway: comp.homeAway,
          team: this.transformTeam(comp.team),
          score: this.transformScore(comp.score),
        })) || [],
        odds: this.transformOdds(comp.odds),
      })) || [],
    };
  }
}

// Logger
export class Logger {
  private static instance: Logger;
  private logLevel: 'error' | 'warn' | 'info' | 'debug' = 'info';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: 'error' | 'warn' | 'info' | 'debug'): void {
    this.logLevel = level;
  }

  private shouldLog(level: 'error' | 'warn' | 'info' | 'debug'): boolean {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level] <= levels[this.logLevel];
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

// League Utils
export class LeagueUtils {
  static getLeagueByCode(code: string): any {
    for (const sport of Object.values(LEAGUES)) {
      for (const league of Object.values(sport)) {
        if (league.code === code) {
          return league;
        }
      }
    }
    return null;
  }

  static getLeaguesBySport(sport: string): any[] {
    const sportLeagues = LEAGUES[sport as keyof typeof LEAGUES];
    return sportLeagues ? Object.values(sportLeagues) : [];
  }

  static getAllLeagues(): any[] {
    return Object.values(LEAGUES).flatMap(sport => Object.values(sport));
  }

  static getSportByLeagueCode(code: string): string | null {
    const league = this.getLeagueByCode(code);
    return league?.sport || null;
  }
}

// Response Builder
export class ResponseBuilder {
  static buildResponse<T>(
    data: T,
    status: number = 200,
    statusText: string = 'OK',
    headers: Record<string, string> = {}
  ): ESPNApiResponse<T> {
    return {
      data,
      status,
      statusText,
      headers,
      timestamp: new Date(),
    };
  }

  static buildErrorResponse(error: ESPNApiError): ESPNApiResponse<null> {
    return {
      data: null,
      status: error.status || 500,
      statusText: error.message,
      headers: {},
      timestamp: error.timestamp,
    };
  }
} 
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { 
  ESPNApiConfig, 
  ESPNApiResponse, 
  ESPNApiError, 
  ApiRequestOptions 
} from '../types/index.js';
import { 
  DEFAULT_CONFIG, 
  DEFAULT_HEADERS, 
  ESPN_ENDPOINTS,
  CACHE_CONFIG,
  ERROR_MESSAGES 
} from '../config/index.js';
import { 
  URLBuilder, 
  RateLimiter, 
  CacheManager, 
  ErrorHandler, 
  RetryHandler, 
  ValidationUtils,
  DataTransformers,
  Logger,
  ResponseBuilder 
} from '../utils/index.js';

export class ESPNApiClient {
  private readonly config: ESPNApiConfig;
  private readonly axiosInstance: AxiosInstance;
  private readonly rateLimiter: RateLimiter;
  private readonly cacheManager: CacheManager;
  private readonly logger: Logger;

  constructor(config: Partial<ESPNApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = Logger.getInstance();
    this.rateLimiter = new RateLimiter(
      this.config.rateLimit.requestsPerSecond,
      this.config.rateLimit.requestsPerMinute
    );
    this.cacheManager = new CacheManager(this.config.cache.ttl);

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        ...DEFAULT_HEADERS,
        'User-Agent': this.config.userAgent,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug(`Making request to: ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.debug(`Response received: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        this.logger.error('Response interceptor error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Core HTTP methods with rate limiting and caching
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ESPNApiResponse<T>> {
    const cacheKey = `${method}:${url}:${JSON.stringify(options.params || {})}`;
    
    // Check cache first
    if (options.cache !== false && this.config.cache.enabled) {
      const cachedData = this.cacheManager.get<T>(cacheKey);
      if (cachedData) {
        this.logger.debug(`Cache hit for: ${url}`);
        return ResponseBuilder.buildResponse(cachedData, 200, 'OK (Cached)');
      }
    }

    // Wait for rate limit slot
    await this.rateLimiter.waitForSlot();

    // Make request with retry logic
    const response = await RetryHandler.withRetry(async () => {
      const axiosConfig: AxiosRequestConfig = {
        method,
        url,
        params: options.params,
        headers: { ...DEFAULT_HEADERS, ...options.headers },
        timeout: options.timeout || this.config.timeout,
      };

      return this.axiosInstance.request(axiosConfig);
    });

    const data = response.data;
    
    // Cache the response
    if (options.cache !== false && this.config.cache.enabled) {
      this.cacheManager.set(cacheKey, data, options.cache === true ? undefined : options.cache);
    }

    return ResponseBuilder.buildResponse(
      data,
      response.status,
      response.statusText,
      response.headers as Record<string, string>
    );
  }

  // Site API Methods
  async getScoreboard(sport: string, league: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateSport(sport)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_SPORT);
    }

    const url = URLBuilder.buildSiteUrl(ESPN_ENDPOINTS.SITE.SCOREBOARD, { sport, league });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.SHORT_TTL });
  }

  async getStandings(sport: string, league: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateSport(sport)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_SPORT);
    }

    const url = URLBuilder.buildSiteUrl(ESPN_ENDPOINTS.SITE.STANDINGS, { sport, league });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.STATS_TTL });
  }

  async getTeams(sport: string, league: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateSport(sport)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_SPORT);
    }

    const url = URLBuilder.buildSiteUrl(ESPN_ENDPOINTS.SITE.TEAMS, { sport, league });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.LONG_TTL });
  }

  async getTeam(sport: string, teamId: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateTeamId(teamId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_TEAM_ID);
    }

    const url = URLBuilder.buildSiteUrl(ESPN_ENDPOINTS.SITE.TEAM, { sport, teamId });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.LONG_TTL });
  }

  async getAthlete(sport: string, athleteId: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateAthleteId(athleteId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_ATHLETE_ID);
    }

    const url = URLBuilder.buildSiteUrl(ESPN_ENDPOINTS.SITE.ATHLETE, { sport, athleteId });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.LONG_TTL });
  }

  async getNews(sport: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateSport(sport)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_SPORT);
    }

    const url = URLBuilder.buildSiteUrl(ESPN_ENDPOINTS.SITE.NEWS, { sport });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.NEWS_TTL });
  }

  async getArticles(sport: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateSport(sport)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_SPORT);
    }

    const url = URLBuilder.buildSiteUrl(ESPN_ENDPOINTS.SITE.ARTICLES, { sport });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.NEWS_TTL });
  }

  // Core API Methods
  async getEvents(sport: string, league: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateSport(sport)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_SPORT);
    }

    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.EVENTS, { sport, league });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.SHORT_TTL });
  }

  async getEvent(sport: string, league: string, eventId: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateEventId(eventId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_EVENT_ID);
    }

    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.EVENT, { sport, league, eventId });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.SHORT_TTL });
  }

  async getTeamRoster(sport: string, league: string, teamId: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateTeamId(teamId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_TEAM_ID);
    }

    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.TEAM_ROSTER, { sport, league, teamId });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.LONG_TTL });
  }

  async getTeamStats(sport: string, league: string, teamId: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateTeamId(teamId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_TEAM_ID);
    }

    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.TEAM_STATS, { sport, league, teamId });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.STATS_TTL });
  }

  async getAthleteStats(sport: string, league: string, athleteId: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateAthleteId(athleteId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_ATHLETE_ID);
    }

    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.ATHLETE_STATS, { sport, league, athleteId });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.STATS_TTL });
  }

  // Odds and Betting Methods
  async getOdds(sport: string, league: string, eventId: string, competitionId: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateEventId(eventId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_EVENT_ID);
    }

    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.ODDS, { sport, league, eventId, competitionId });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.ODDS_TTL });
  }

  async getOddsProvider(sport: string, league: string, eventId: string, competitionId: string, providerId: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateEventId(eventId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_EVENT_ID);
    }

    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.ODDS_PROVIDER, { sport, league, eventId, competitionId, providerId });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.ODDS_TTL });
  }

  async getOddsHistory(sport: string, league: string, eventId: string, competitionId: string, providerId: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateEventId(eventId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_EVENT_ID);
    }

    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.ODDS_HISTORY, { sport, league, eventId, competitionId, providerId });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.ODDS_TTL });
  }

  async getFutures(sport: string, league: string, season: number, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.FUTURES, { sport, league, season });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.LONG_TTL });
  }

  // Predictions and Analysis Methods
  async getPredictor(sport: string, league: string, eventId: string, competitionId: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateEventId(eventId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_EVENT_ID);
    }

    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.PREDICTOR, { sport, league, eventId, competitionId });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.SHORT_TTL });
  }

  async getPowerIndex(sport: string, league: string, eventId: string, competitionId: string, teamId: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    if (!ValidationUtils.validateEventId(eventId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_EVENT_ID);
    }

    if (!ValidationUtils.validateTeamId(teamId)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_TEAM_ID);
    }

    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.POWER_INDEX, { sport, league, eventId, competitionId, teamId });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.SHORT_TTL });
  }

  // Utility Methods
  async getTransactions(sport: string, league: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.TRANSACTIONS, { sport, league });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.SHORT_TTL });
  }

  async getTalentPicks(sport: string, league: string, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.TALENT_PICKS, { sport, league });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.SHORT_TTL });
  }

  async getWeeklyTalentPicks(sport: string, league: string, season: number, type: number, week: number, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>> {
    const url = URLBuilder.buildCoreUrl(ESPN_ENDPOINTS.CORE.WEEKLY_TALENT_PICKS, { sport, league, season, type, week });
    return this.request('GET', url, { ...options, cache: CACHE_CONFIG.SHORT_TTL });
  }

  // Batch Operations
  async getMultipleLeagues(leagues: Array<{ sport: string; league: string }>, options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>[]> {
    const promises = leagues.map(({ sport, league }) => 
      this.getScoreboard(sport, league, options)
    );
    
    return Promise.all(promises);
  }

  async getMultipleTeams(sport: string, league: string, teamIds: string[], options: ApiRequestOptions = {}): Promise<ESPNApiResponse<any>[]> {
    const promises = teamIds.map(teamId => 
      this.getTeam(sport, teamId, options)
    );
    
    return Promise.all(promises);
  }

  // Cache Management
  clearCache(): void {
    this.cacheManager.clear();
    this.logger.info('Cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cacheManager.size(),
      keys: this.cacheManager.keys(),
    };
  }

  // Configuration
  updateConfig(newConfig: Partial<ESPNApiConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.info('Configuration updated');
  }

  getConfig(): ESPNApiConfig {
    return { ...this.config };
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.getScoreboard('soccer', 'eng.1', { cache: false });
      return response.status === 200;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
} 
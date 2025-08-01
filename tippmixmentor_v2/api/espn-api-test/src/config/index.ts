import type { ESPNApiConfig, RateLimitConfig } from '../types/index.js';

// ESPN API Base URLs
export const ESPN_BASE_URLS = {
  SITE_API: 'https://site.api.espn.com',
  CORE_API: 'https://sports.core.api.espn.com',
  FANTASY_API: 'https://fantasy.espn.com',
  NEWS_API: 'https://www.espn.com',
} as const;

// League configurations
export const LEAGUES = {
  // Soccer/Football
  SOCCER: {
    PREMIER_LEAGUE: { name: 'Premier League', code: 'eng.1', sport: 'soccer' },
    LA_LIGA: { name: 'La Liga', code: 'esp.1', sport: 'soccer' },
    SERIE_A: { name: 'Serie A', code: 'ita.1', sport: 'soccer' },
    BUNDESLIGA: { name: 'Bundesliga', code: 'ger.1', sport: 'soccer' },
    LIGUE_1: { name: 'Ligue 1', code: 'fra.1', sport: 'soccer' },
    CHAMPIONS_LEAGUE: { name: 'UEFA Champions League', code: 'uefa.champions', sport: 'soccer' },
    EUROPA_LEAGUE: { name: 'UEFA Europa League', code: 'uefa.europa', sport: 'soccer' },
    MLS: { name: 'Major League Soccer', code: 'usa.1', sport: 'soccer' },
  },
  
  // American Football
  FOOTBALL: {
    NFL: { name: 'NFL', code: 'nfl', sport: 'football' },
    NCAA: { name: 'NCAA Football', code: 'college-football', sport: 'football' },
  },
  
  // Basketball
  BASKETBALL: {
    NBA: { name: 'NBA', code: 'nba', sport: 'basketball' },
    NCAA_BASKETBALL: { name: 'NCAA Basketball', code: 'mens-college-basketball', sport: 'basketball' },
    WNBA: { name: 'WNBA', code: 'wnba', sport: 'basketball' },
  },
  
  // Baseball
  BASEBALL: {
    MLB: { name: 'MLB', code: 'mlb', sport: 'baseball' },
    NCAA_BASEBALL: { name: 'NCAA Baseball', code: 'mens-college-baseball', sport: 'baseball' },
  },
  
  // Hockey
  HOCKEY: {
    NHL: { name: 'NHL', code: 'nhl', sport: 'hockey' },
  },
} as const;

// API Endpoints based on the repository documentation
export const ESPN_ENDPOINTS = {
  // Site API Endpoints
  SITE: {
    SCOREBOARD: '/apis/site/v2/sports/{sport}/{league}/scoreboard',
    STANDINGS: '/apis/site/v2/sports/{sport}/{league}/standings',
    TEAMS: '/apis/site/v2/sports/{sport}/{league}/teams',
    TEAM: '/apis/site/v2/sports/{sport}/teams/{teamId}',
    ATHLETE: '/apis/site/v2/sports/{sport}/athletes/{athleteId}',
    NEWS: '/apis/site/v2/sports/{sport}/news',
    ARTICLES: '/apis/site/v2/sports/{sport}/articles',
  },
  
  // Core API Endpoints
  CORE: {
    // Events/Matches
    EVENTS: '/v2/sports/{sport}/leagues/{league}/events',
    EVENT: '/v2/sports/{sport}/leagues/{league}/events/{eventId}',
    EVENT_COMPETITION: '/v2/sports/{sport}/leagues/{league}/events/{eventId}/competitions/{competitionId}',
    
    // Teams
    TEAMS: '/v2/sports/{sport}/leagues/{league}/teams',
    TEAM: '/v2/sports/{sport}/leagues/{league}/teams/{teamId}',
    TEAM_ROSTER: '/v2/sports/{sport}/leagues/{league}/teams/{teamId}/roster',
    TEAM_STATS: '/v2/sports/{sport}/leagues/{league}/teams/{teamId}/statistics',
    
    // Athletes/Players
    ATHLETES: '/v2/sports/{sport}/leagues/{league}/athletes',
    ATHLETE: '/v2/sports/{sport}/leagues/{league}/athletes/{athleteId}',
    ATHLETE_STATS: '/v2/sports/{sport}/leagues/{league}/athletes/{athleteId}/statistics',
    ATHLETE_SPLITS: '/v2/sports/{sport}/leagues/{league}/athletes/{athleteId}/splits',
    
    // Standings
    STANDINGS: '/v2/sports/{sport}/leagues/{league}/standings',
    STANDINGS_BY_TYPE: '/v2/sports/{sport}/leagues/{league}/seasons/{season}/types/{type}/standings',
    
    // Seasons
    SEASONS: '/v2/sports/{sport}/leagues/{league}/seasons',
    SEASON: '/v2/sports/{sport}/leagues/{league}/seasons/{season}',
    SEASON_TYPES: '/v2/sports/{sport}/leagues/{league}/seasons/{season}/types',
    
    // Odds and Betting
    ODDS: '/v2/sports/{sport}/leagues/{league}/events/{eventId}/competitions/{competitionId}/odds',
    ODDS_PROVIDER: '/v2/sports/{sport}/leagues/{league}/events/{eventId}/competitions/{competitionId}/odds/{providerId}',
    ODDS_HISTORY: '/v2/sports/{sport}/leagues/{league}/events/{eventId}/competitions/{competitionId}/odds/{providerId}/history',
    ODDS_MOVEMENT: '/v2/sports/{sport}/leagues/{league}/events/{eventId}/competitions/{competitionId}/odds/{providerId}/history/0/movement',
    ODDS_HEAD_TO_HEAD: '/v2/sports/{sport}/leagues/{league}/events/{eventId}/competitions/{competitionId}/odds/{providerId}/head-to-heads',
    FUTURES: '/v2/sports/{sport}/leagues/{league}/seasons/{season}/futures',
    
    // Statistics
    STATISTICS: '/v2/sports/{sport}/leagues/{league}/statistics',
    
    // Records and Performance
    ATS_RECORDS: '/v2/sports/{sport}/leagues/{league}/seasons/{season}/types/{type}/teams/{teamId}/ats',
    ODDS_RECORDS: '/v2/sports/{sport}/leagues/{league}/seasons/{season}/types/0/teams/{teamId}/odds-records',
    PAST_PERFORMANCES: '/v2/sports/{sport}/leagues/{league}/teams/{teamId}/odds/{providerId}/past-performances',
    
    // Predictions and Analysis
    PREDICTOR: '/v2/sports/{sport}/leagues/{league}/events/{eventId}/competitions/{competitionId}/predictor',
    POWER_INDEX: '/v2/sports/{sport}/leagues/{league}/events/{eventId}/competitions/{competitionId}/powerindex/{teamId}',
    
    // Utility
    POSITIONS: '/v2/sports/{sport}/leagues/{league}/positions',
    TRANSACTIONS: '/v2/sports/{sport}/leagues/{league}/transactions',
    TALENT_PICKS: '/v2/sports/{sport}/leagues/{league}/talentpicks',
    WEEKLY_TALENT_PICKS: '/v2/sports/{sport}/leagues/{league}/seasons/{season}/types/{type}/weeks/{week}/talentpicks',
    COACHES: '/v2/sports/{sport}/leagues/{league}/seasons/{season}/coaches',
    FREE_AGENTS: '/v2/sports/{sport}/leagues/{league}/seasons/{season}/freeagents',
    OFFICIALS: '/v2/sports/{sport}/leagues/{league}/events/{eventId}/competitions/{competitionId}/officials',
    ATHLETE_STATS_LOG: '/v2/sports/{sport}/leagues/{league}/athletes/{athleteId}/statisticslog',
  },
  
  // Fantasy API Endpoints
  FANTASY: {
    LEAGUES: '/apis/v3/games/{game}/seasons/{season}/segments/0/leagues/{leagueId}',
    TEAMS: '/apis/v3/games/{game}/seasons/{season}/segments/0/leagues/{leagueId}/teams',
    TEAM: '/apis/v3/games/{game}/seasons/{season}/segments/0/leagues/{leagueId}/teams/{teamId}',
    PLAYERS: '/apis/v3/games/{game}/seasons/{season}/segments/0/leagues/{leagueId}/teams/{teamId}/roster',
    SCOREBOARD: '/apis/v3/games/{game}/seasons/{season}/segments/0/leagues/{leagueId}/scoreboard',
    PRO_TEAMS: '/apis/v3/games/{game}/pro-teams',
    PLAYERS_INFO: '/apis/v3/games/{game}/players',
    PLAYER: '/apis/v3/games/{game}/players/{playerId}',
  },
  
  // News API Endpoints
  NEWS: {
    ARTICLES: '/apis/site/v2/sports/{sport}/articles',
    ARTICLE: '/apis/site/v2/sports/{sport}/articles/{articleId}',
    NEWS: '/apis/site/v2/sports/{sport}/news',
  },
} as const;

// Default configuration
export const DEFAULT_CONFIG: ESPNApiConfig = {
  baseUrl: ESPN_BASE_URLS.SITE_API,
  timeout: 30000, // 30 seconds
  retries: 3,
  rateLimit: {
    requestsPerSecond: 2,
    requestsPerMinute: 100,
  },
  userAgent: 'TippMixMentor-ESPN-API/2.0.0',
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
  },
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG: RateLimitConfig = {
  requestsPerSecond: 2,
  requestsPerMinute: 100,
  burstLimit: 10,
  windowMs: 60000, // 1 minute
};

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 300000, // 5 minutes
  LONG_TTL: 3600000, // 1 hour
  SHORT_TTL: 60000, // 1 minute
  STATS_TTL: 1800000, // 30 minutes
  ODDS_TTL: 30000, // 30 seconds
  NEWS_TTL: 900000, // 15 minutes
} as const;

// HTTP Headers
export const DEFAULT_HEADERS = {
  'User-Agent': DEFAULT_CONFIG.userAgent,
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please wait before making more requests.',
  INVALID_LEAGUE: 'Invalid league code provided.',
  INVALID_SPORT: 'Invalid sport code provided.',
  INVALID_TEAM_ID: 'Invalid team ID provided.',
  INVALID_ATHLETE_ID: 'Invalid athlete ID provided.',
  INVALID_EVENT_ID: 'Invalid event ID provided.',
  API_ERROR: 'ESPN API returned an error.',
  NETWORK_ERROR: 'Network error occurred.',
  TIMEOUT_ERROR: 'Request timed out.',
  PARSE_ERROR: 'Failed to parse API response.',
  CACHE_ERROR: 'Cache operation failed.',
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  BACKOFF_MULTIPLIER: 2,
  MAX_DELAY: 10000, // 10 seconds
} as const;

// Validation schemas (for Zod)
export const VALIDATION_SCHEMAS = {
  LEAGUE_CODES: Object.values(LEAGUES).flatMap(sport => 
    Object.values(sport).map(league => league.code)
  ),
  SPORT_CODES: Object.keys(LEAGUES),
} as const; 
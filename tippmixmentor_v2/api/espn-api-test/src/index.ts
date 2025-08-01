// Main ESPN API Module Export
export { ESPNApiClient } from './services/espn-api-client.js';

// Types
export type {
  ESPNApiConfig,
  ESPNApiResponse,
  ESPNApiError,
  ApiRequestOptions,
  League,
  Team,
  Event,
  Competition,
  Athlete,
  Odds,
  Statistics,
  NewsResponse,
  Article,
  Scoreboard,
  LeagueStandings,
  TeamStanding,
  RateLimitConfig,
  CacheEntry,
} from './types/index.js';

// Configuration
export {
  DEFAULT_CONFIG,
  ESPN_BASE_URLS,
  ESPN_ENDPOINTS,
  LEAGUES,
  CACHE_CONFIG,
  RATE_LIMIT_CONFIG,
  ERROR_MESSAGES,
  RETRY_CONFIG,
} from './config/index.js';

// Utilities
export {
  URLBuilder,
  RateLimiter,
  CacheManager,
  ErrorHandler,
  RetryHandler,
  ValidationUtils,
  DataTransformers,
  Logger,
  ResponseBuilder,
  LeagueUtils,
} from './utils/index.js';

// Default export for convenience
import { ESPNApiClient } from './services/espn-api-client.js';
export default ESPNApiClient; 
const path = require('path');
require('dotenv').config();

/**
 * Configuration management system for the Flashscore Scraper
 * Handles environment variables and default settings
 */
class Config {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.loadConfiguration();
  }

  loadConfiguration() {
    // Database Configuration
    this.database = {
      type: process.env.DB_TYPE || 'sqlite',
      path: process.env.DB_PATH || path.join(process.cwd(), 'data', 'flashscore.db'),
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || '',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'flashscore',
      connectionPool: {
        min: parseInt(process.env.DB_POOL_MIN) || 2,
        max: parseInt(process.env.DB_POOL_MAX) || 10
      }
    };

    // Redis Configuration (for Bull queues)
    this.redis = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB) || 0
    };

    // Scraping Configuration
    this.scraping = {
      userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      headless: process.env.HEADLESS !== 'false',
      timeout: parseInt(process.env.SCRAPING_TIMEOUT) || 30000,
      requestDelay: parseInt(process.env.REQUEST_DELAY) || 1000,
      maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
      retryDelay: parseInt(process.env.RETRY_DELAY) || 2000,
      viewport: {
        width: parseInt(process.env.VIEWPORT_WIDTH) || 1920,
        height: parseInt(process.env.VIEWPORT_HEIGHT) || 1080
      }
    };

    // Rate Limiting Configuration
    this.rateLimiting = {
      requestsPerSecond: parseFloat(process.env.REQUESTS_PER_SECOND) || 1.5,
      burstLimit: parseInt(process.env.BURST_LIMIT) || 5,
      cooldownPeriod: parseInt(process.env.COOLDOWN_PERIOD) || 60000
    };

    // Scheduling Configuration
    this.scheduling = {
      liveMatches: process.env.LIVE_MATCHES_SCHEDULE || '*/1 * * * *', // Every minute
      upcomingFixtures: process.env.UPCOMING_FIXTURES_SCHEDULE || '0 */3 * * *', // Every 3 hours
      historicalData: process.env.HISTORICAL_DATA_SCHEDULE || '0 2 * * *', // Daily at 2 AM
      leagueDiscovery: process.env.LEAGUE_DISCOVERY_SCHEDULE || '0 0 * * 0' // Weekly on Sunday
    };

    // Logging Configuration
    this.logging = {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || path.join(process.cwd(), 'logs', 'scraper.log'),
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD'
    };

    // System Configuration
    this.system = {
      maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS) || 3,
      dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS) || 365,
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 300000, // 5 minutes
      enableMonitoring: process.env.ENABLE_MONITORING !== 'false'
    };

    // Flashscore Specific Configuration
    this.flashscore = {
      baseUrl: process.env.FLASHSCORE_BASE_URL || 'https://www.flashscore.com',
      liveUrl: process.env.FLASHSCORE_LIVE_URL || 'https://www.flashscore.com/football/',
      fixturesUrl: process.env.FLASHSCORE_FIXTURES_URL || 'https://www.flashscore.com/football/fixtures/',
      resultsUrl: process.env.FLASHSCORE_RESULTS_URL || 'https://www.flashscore.com/football/results/'
    };
  }

  /**
   * Get configuration for a specific module
   * @param {string} module - Module name (database, redis, scraping, etc.)
   * @returns {object} Module configuration
   */
  get(module) {
    return this[module] || {};
  }

  /**
   * Get all configuration
   * @returns {object} Complete configuration object
   */
  getAll() {
    return {
      env: this.env,
      database: this.database,
      redis: this.redis,
      scraping: this.scraping,
      rateLimiting: this.rateLimiting,
      scheduling: this.scheduling,
      logging: this.logging,
      system: this.system,
      flashscore: this.flashscore
    };
  }

  /**
   * Validate configuration
   * @returns {object} Validation result with isValid flag and errors array
   */
  validate() {
    const errors = [];

    // Validate required configurations
    if (!this.database.path && this.database.type === 'sqlite') {
      errors.push('Database path is required for SQLite');
    }

    if (this.scraping.requestDelay < 500) {
      errors.push('Request delay should be at least 500ms to respect rate limits');
    }

    if (this.rateLimiting.requestsPerSecond > 5) {
      errors.push('Requests per second should not exceed 5 to maintain ethical scraping');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if running in development mode
   * @returns {boolean}
   */
  isDevelopment() {
    return this.env === 'development';
  }

  /**
   * Check if running in production mode
   * @returns {boolean}
   */
  isProduction() {
    return this.env === 'production';
  }
}

// Export singleton instance
module.exports = new Config();
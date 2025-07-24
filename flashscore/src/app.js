const config = require('./utils/config');
const logger = require('./utils/logger');

/**
 * Main application entry point for Flashscore Scraper
 * Initializes configuration, logging, and core system components
 */
class FlashscoreScraper {
  constructor() {
    this.config = config;
    this.logger = logger;
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      this.logger.info('Initializing Flashscore Scraper System', {
        version: require('../package.json').version,
        environment: this.config.env
      });

      // Validate configuration
      const validation = this.config.validate();
      if (!validation.isValid) {
        this.logger.error('Configuration validation failed', {
          errors: validation.errors
        });
        throw new Error(`Configuration errors: ${validation.errors.join(', ')}`);
      }

      this.logger.info('Configuration validated successfully');

      // Log system configuration (without sensitive data)
      this.logSystemConfiguration();

      this.isInitialized = true;
      this.logger.info('Flashscore Scraper System initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Flashscore Scraper System', error);
      throw error;
    }
  }

  /**
   * Log system configuration for debugging
   */
  logSystemConfiguration() {
    const safeConfig = {
      environment: this.config.env,
      database: {
        type: this.config.database.type,
        path: this.config.database.type === 'sqlite' ? this.config.database.path : '[HIDDEN]'
      },
      scraping: {
        headless: this.config.scraping.headless,
        timeout: this.config.scraping.timeout,
        requestDelay: this.config.scraping.requestDelay,
        maxRetries: this.config.scraping.maxRetries
      },
      rateLimiting: this.config.rateLimiting,
      scheduling: this.config.scheduling,
      system: this.config.system
    };

    this.logger.debug('System configuration loaded', safeConfig);
  }

  /**
   * Start the scraper system
   */
  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.logger.info('Starting Flashscore Scraper System');
    
    // TODO: Initialize and start core components in future tasks:
    // - Database connection
    // - Task queue manager
    // - Scheduler
    // - Scraping engine
    
    this.logger.info('Flashscore Scraper System started successfully');
  }

  /**
   * Stop the scraper system gracefully
   */
  async stop() {
    this.logger.info('Stopping Flashscore Scraper System');
    
    // TODO: Gracefully shutdown components in future tasks:
    // - Stop scheduler
    // - Complete pending tasks
    // - Close database connections
    // - Close browser instances
    
    this.logger.info('Flashscore Scraper System stopped successfully');
  }

  /**
   * Get system health status
   */
  getHealthStatus() {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      timestamp: new Date().toISOString(),
      environment: this.config.env,
      uptime: process.uptime()
    };
  }
}

module.exports = FlashscoreScraper;
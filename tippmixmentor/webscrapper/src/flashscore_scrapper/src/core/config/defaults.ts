/**
 * Default configuration values for the Flashscore scraper application
 */

import type { AppConfig } from './interfaces.js';

export const DEFAULT_CONFIG: AppConfig = {
  environment: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'info',
    CACHE_ENABLED: true,
    CACHE_TTL: 3600000, // 1 hour in milliseconds
    MAX_CONCURRENT_PAGES: 3,
    SCRAPING_TIMEOUT: 30000, // 30 seconds
    EXPORT_PATH: './data',
    CACHE_PATH: './cache'
  },

  scraping: {
    baseUrl: 'https://www.flashscore.com',
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 2000,
    requestDelay: 1000,
    maxConcurrentPages: 3,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: {
      width: 1920,
      height: 1080
    },
    selectors: {
      match: {
        container: '.event__match',
        stage: '.event__stage',
        date: '.event__time',
        status: '.event__part',
        homeTeam: '.event__participant--home',
        awayTeam: '.event__participant--away',
        score: '.event__scores'
      },
      league: {
        container: '.league',
        name: '.league__name',
        country: '.league__country'
      },
      season: {
        container: '.season',
        name: '.season__name',
        year: '.season__year'
      }
    }
  },

  cache: {
    enabled: true,
    path: './cache',
    ttl: {
      matches: 3600000, // 1 hour
      leagues: 86400000, // 24 hours
      seasons: 604800000, // 7 days
      countries: 2592000000 // 30 days
    },
    maxSize: 1073741824, // 1GB in bytes
    cleanupInterval: 3600000 // 1 hour
  },

  export: {
    path: './data',
    formats: {
      json: {
        indent: 2,
        sortKeys: true
      },
      csv: {
        delimiter: ',',
        quote: '"',
        escape: '"',
        header: true
      },
      xml: {
        rootElement: 'matches',
        declaration: true,
        indent: true
      }
    },
    validation: {
      enabled: true,
      strictMode: false,
      requiredFields: ['id', 'homeTeam', 'awayTeam', 'date']
    },
    streaming: {
      enabled: true,
      chunkSize: 1000,
      memoryThreshold: 104857600 // 100MB
    }
  },

  logging: {
    level: 'info',
    format: 'combined',
    transports: [
      {
        type: 'console',
        level: 'info'
      },
      {
        type: 'file',
        level: 'debug',
        filename: './logs/scraper.log',
        maxSize: '20m',
        maxFiles: 5
      }
    ],
    rotation: {
      maxSize: '20m',
      maxFiles: 5,
      datePattern: 'YYYY-MM-DD'
    }
  },

  browser: {
    headless: true,
    viewport: {
      width: 1920,
      height: 1080
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    timeout: 30000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },

  rateLimit: {
    requestsPerSecond: 1.5,
    burstLimit: 5,
    cooldownPeriod: 60000,
    enabled: true
  }
};

// Environment-specific overrides
export const DEVELOPMENT_OVERRIDES: Partial<AppConfig> = {
  environment: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    CACHE_ENABLED: true,
    CACHE_TTL: 1800000, // 30 minutes
    MAX_CONCURRENT_PAGES: 2,
    SCRAPING_TIMEOUT: 15000,
    EXPORT_PATH: './dev-data',
    CACHE_PATH: './dev-cache'
  },
  logging: {
    level: 'debug',
    format: 'simple',
    transports: [
      {
        type: 'console',
        level: 'debug'
      }
    ],
    rotation: {
      maxSize: '10m',
      maxFiles: 3,
      datePattern: 'YYYY-MM-DD'
    }
  },
  browser: {
    headless: false,
    slowMo: 100,
    viewport: {
      width: 1280,
      height: 720
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    timeout: 15000,
    args: []
  }
};

export const PRODUCTION_OVERRIDES: Partial<AppConfig> = {
  environment: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'warn',
    CACHE_ENABLED: true,
    CACHE_TTL: 7200000, // 2 hours
    MAX_CONCURRENT_PAGES: 5,
    SCRAPING_TIMEOUT: 45000,
    EXPORT_PATH: '/var/data/flashscore',
    CACHE_PATH: '/var/cache/flashscore'
  },
  logging: {
    level: 'warn',
    format: 'json',
    transports: [
      {
        type: 'file',
        level: 'warn',
        filename: '/var/log/flashscore/scraper.log',
        maxSize: '50m',
        maxFiles: 10
      }
    ],
    rotation: {
      maxSize: '50m',
      maxFiles: 10,
      datePattern: 'YYYY-MM-DD'
    }
  },
  browser: {
    headless: true,
    viewport: {
      width: 1920,
      height: 1080
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    timeout: 45000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--memory-pressure-off',
      '--max_old_space_size=4096'
    ]
  }
};

export const TEST_OVERRIDES: Partial<AppConfig> = {
  environment: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    CACHE_ENABLED: false,
    CACHE_TTL: 60000, // 1 minute
    MAX_CONCURRENT_PAGES: 1,
    SCRAPING_TIMEOUT: 5000,
    EXPORT_PATH: './test-data',
    CACHE_PATH: './test-cache'
  },
  logging: {
    level: 'error',
    format: 'simple',
    transports: [
      {
        type: 'console',
        level: 'error'
      }
    ],
    rotation: {
      maxSize: '5m',
      maxFiles: 1,
      datePattern: 'YYYY-MM-DD'
    }
  },
  browser: {
    headless: true,
    viewport: {
      width: 800,
      height: 600
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    timeout: 5000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  },
  cache: {
    enabled: false,
    path: './test-cache',
    ttl: {
      matches: 60000,
      leagues: 60000,
      seasons: 60000,
      countries: 60000
    },
    maxSize: 10485760, // 10MB
    cleanupInterval: 60000
  }
};
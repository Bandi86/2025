import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().required(),
  
  // Redis
  REDIS_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  
  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  
  // API Configuration
  API_PORT: Joi.number().default(3001),
  API_HOST: Joi.string().default('0.0.0.0'),
  
  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  
  // Frontend URL
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  
  // Cache Configuration
  CACHE_PREFIX: Joi.string().default('tippmixmentor'),
  CACHE_VERSION: Joi.string().default('v1'),
  CACHE_TTL: Joi.number().default(300),
  
  // Environment
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
  // Swagger
  ENABLE_SWAGGER: Joi.boolean().default(true),
  
  // External APIs
  API_FOOTBALL_KEY: Joi.string().optional(),
  ESPN_API_KEY: Joi.string().optional(),
  
  // Monitoring
  ENABLE_METRICS: Joi.boolean().default(true),
  METRICS_PORT: Joi.number().default(9090),
  
  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_LIMIT: Joi.number().default(100),
  
  // WebSocket
  WS_CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  
  // Agent Configuration
  AGENT_TIMEOUT: Joi.number().default(30000),
  AGENT_MAX_RETRIES: Joi.number().default(3),
  
  // File Upload
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  UPLOAD_PATH: Joi.string().default('./uploads'),
  
  // Security
  SESSION_SECRET: Joi.string().min(32).required(),
  COOKIE_SECRET: Joi.string().min(32).required(),
  
  // Email (if needed)
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  
  // Third-party services
  SENTRY_DSN: Joi.string().optional(),
  NEW_RELIC_LICENSE_KEY: Joi.string().optional(),
  
  // Feature flags
  ENABLE_AGENTS: Joi.boolean().default(true),
  ENABLE_PREDICTIONS: Joi.boolean().default(true),
  ENABLE_LIVE_DATA: Joi.boolean().default(true),
  ENABLE_ANALYTICS: Joi.boolean().default(true),
}); 
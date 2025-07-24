// Error handling interfaces and custom error types

import { ErrorType } from './core.js';

// ============================================================================
// ERROR HANDLING INTERFACES
// ============================================================================

export interface IErrorHandler {
  handle(error: Error, context: ErrorContext): Promise<void>;
  retry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T>;
  classify(error: Error): ErrorType;
  shouldRetry(error: Error, attempt: number): boolean;
  getRetryDelay(attempt: number, baseDelay: number, backoffFactor: number): number;
}

export interface IRetryManager {
  execute<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T>;
  executeWithCircuitBreaker<T>(operation: () => Promise<T>, options: RetryOptions & CircuitBreakerOptions): Promise<T>;
}

// ============================================================================
// ERROR CONTEXT AND METADATA
// ============================================================================

export interface ErrorContext {
  operation: string;
  url?: string;
  matchId?: string;
  attempt: number;
  timestamp: Date;
  userAgent?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
  timeout?: number;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  retryAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryDelay: number;
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export abstract class BaseScrapingError extends Error {
  public readonly type: ErrorType;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly retryable: boolean;

  constructor(
    message: string,
    type: ErrorType,
    context: ErrorContext,
    retryable: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.context = context;
    this.timestamp = new Date();
    this.retryable = retryable;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      context: this.context,
      timestamp: this.timestamp,
      retryable: this.retryable,
      stack: this.stack
    };
  }
}

export class NetworkError extends BaseScrapingError {
  public readonly statusCode?: number;
  public readonly responseBody?: string;

  constructor(
    message: string,
    context: ErrorContext,
    statusCode?: number,
    responseBody?: string
  ) {
    super(message, ErrorType.NETWORK, context, true);
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class ScrapingError extends BaseScrapingError {
  public readonly selector?: string;
  public readonly pageUrl?: string;

  constructor(
    message: string,
    context: ErrorContext,
    selector?: string,
    pageUrl?: string
  ) {
    super(message, ErrorType.SCRAPING, context, true);
    this.selector = selector;
    this.pageUrl = pageUrl;
  }
}

export class DataValidationError extends BaseScrapingError {
  public readonly field?: string;
  public readonly value?: any;
  public readonly expectedType?: string;

  constructor(
    message: string,
    context: ErrorContext,
    field?: string,
    value?: any,
    expectedType?: string
  ) {
    super(message, ErrorType.VALIDATION, context, false);
    this.field = field;
    this.value = value;
    this.expectedType = expectedType;
  }
}

export class SystemError extends BaseScrapingError {
  public readonly systemInfo?: Record<string, any>;

  constructor(
    message: string,
    context: ErrorContext,
    systemInfo?: Record<string, any>
  ) {
    super(message, ErrorType.SYSTEM, context, false);
    this.systemInfo = systemInfo;
  }
}

export class ConfigurationError extends BaseScrapingError {
  public readonly configKey?: string;
  public readonly configValue?: any;

  constructor(
    message: string,
    context: ErrorContext,
    configKey?: string,
    configValue?: any
  ) {
    super(message, ErrorType.CONFIGURATION, context, false);
    this.configKey = configKey;
    this.configValue = configValue;
  }
}

// ============================================================================
// RETRY STRATEGIES
// ============================================================================

export interface RetryStrategy {
  networkErrors: RetryOptions;
  scrapingErrors: RetryOptions;
  systemErrors: RetryOptions;
  validationErrors: RetryOptions;
  configurationErrors: RetryOptions;
}

export const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
  networkErrors: {
    maxAttempts: 3,
    baseDelay: 1000,
    backoffFactor: 2,
    maxDelay: 10000
  },
  scrapingErrors: {
    maxAttempts: 2,
    baseDelay: 2000,
    backoffFactor: 1.5,
    maxDelay: 8000
  },
  systemErrors: {
    maxAttempts: 1,
    baseDelay: 5000,
    backoffFactor: 1,
    maxDelay: 5000
  },
  validationErrors: {
    maxAttempts: 0,
    baseDelay: 0,
    backoffFactor: 1,
    maxDelay: 0
  },
  configurationErrors: {
    maxAttempts: 0,
    baseDelay: 0,
    backoffFactor: 1,
    maxDelay: 0
  }
};

// ============================================================================
// ERROR RECOVERY
// ============================================================================

export interface RecoveryAction {
  type: RecoveryActionType;
  description: string;
  execute(): Promise<void>;
}

export enum RecoveryActionType {
  RESTART_BROWSER = 'restart_browser',
  CLEAR_CACHE = 'clear_cache',
  CHANGE_USER_AGENT = 'change_user_agent',
  WAIT_AND_RETRY = 'wait_and_retry',
  SKIP_OPERATION = 'skip_operation',
  FALLBACK_SELECTOR = 'fallback_selector'
}

export interface ErrorRecoveryStrategy {
  canRecover(error: BaseScrapingError): boolean;
  getRecoveryActions(error: BaseScrapingError): RecoveryAction[];
  executeRecovery(error: BaseScrapingError): Promise<boolean>;
}
// Logging interfaces and types

import { LogLevel } from './core.js';

// ============================================================================
// LOGGING SERVICE INTERFACES
// ============================================================================

export interface ILogger {
  debug(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, error?: Error, meta?: LogMetadata): void;
  log(level: LogLevel, message: string, meta?: LogMetadata): void;
  child(defaultMeta: LogMetadata): ILogger;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}

export interface ILoggerFactory {
  createLogger(name: string, config?: LoggerConfig): ILogger;
  getLogger(name: string): ILogger | null;
  setGlobalLevel(level: LogLevel): void;
  shutdown(): Promise<void>;
}

export interface ILogTransport {
  log(entry: LogEntry): Promise<void>;
  close(): Promise<void>;
  getName(): string;
  isEnabled(): boolean;
}

// ============================================================================
// LOG CONFIGURATION
// ============================================================================

export interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
  transports: TransportConfig[];
  defaultMeta?: LogMetadata;
  exitOnError: boolean;
  handleExceptions: boolean;
  handleRejections: boolean;
}

export interface TransportConfig {
  type: TransportType;
  level?: LogLevel;
  format?: LogFormat;
  options: Record<string, any>;
}

export enum TransportType {
  CONSOLE = 'console',
  FILE = 'file',
  ROTATING_FILE = 'rotating_file',
  HTTP = 'http',
  DATABASE = 'database'
}

export interface LogFormat {
  timestamp: boolean;
  level: boolean;
  message: boolean;
  meta: boolean;
  colorize: boolean;
  json: boolean;
  prettyPrint: boolean;
  template?: string;
}

// ============================================================================
// LOG ENTRIES AND METADATA
// ============================================================================

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  meta: LogMetadata;
  logger: string;
  error?: Error;
}

export interface LogMetadata {
  [key: string]: any;
  sessionId?: string;
  userId?: string;
  requestId?: string;
  operation?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  memoryUsage?: number;
}

export interface StructuredLogEntry extends LogEntry {
  service: string;
  version: string;
  environment: string;
  hostname: string;
  pid: number;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
}

// ============================================================================
// LOG FILTERING AND SAMPLING
// ============================================================================

export interface ILogFilter {
  shouldLog(entry: LogEntry): boolean;
  getName(): string;
}

export interface ILogSampler {
  shouldSample(entry: LogEntry): boolean;
  getSampleRate(): number;
  setSampleRate(rate: number): void;
}

export interface LogFilterConfig {
  level?: LogLevel;
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
  includeLoggers?: string[];
  excludeLoggers?: string[];
  customFilter?: (entry: LogEntry) => boolean;
}

export interface LogSamplerConfig {
  sampleRate: number;
  maxEntriesPerSecond?: number;
  burstLimit?: number;
  keyExtractor?: (entry: LogEntry) => string;
}

// ============================================================================
// LOG AGGREGATION AND METRICS
// ============================================================================

export interface ILogAggregator {
  aggregate(entries: LogEntry[]): LogAggregation;
  getMetrics(): LogMetrics;
  reset(): void;
}

export interface LogAggregation {
  period: {
    start: Date;
    end: Date;
  };
  totalEntries: number;
  entriesByLevel: Record<LogLevel, number>;
  entriesByLogger: Record<string, number>;
  topErrors: ErrorSummary[];
  averageEntriesPerSecond: number;
}

export interface LogMetrics {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsByLogger: Record<string, number>;
  errorRate: number;
  averageLogSize: number;
  peakLogsPerSecond: number;
  uptime: number;
}

export interface ErrorSummary {
  message: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  logger: string;
  stackTrace?: string;
}

// ============================================================================
// LOG ROTATION AND ARCHIVAL
// ============================================================================

export interface ILogRotator {
  shouldRotate(filePath: string): boolean;
  rotate(filePath: string): Promise<string>;
  cleanup(directory: string, retentionDays: number): Promise<number>;
}

export interface LogRotationConfig {
  maxSize: number;
  maxFiles: number;
  datePattern?: string;
  frequency?: RotationFrequency;
  compress: boolean;
  retentionDays: number;
}

export enum RotationFrequency {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// ============================================================================
// LOG EVENTS
// ============================================================================

export interface LogEvent {
  type: LogEventType;
  timestamp: Date;
  logger: string;
  entry?: LogEntry;
  error?: Error;
  data?: any;
}

export enum LogEventType {
  LOG_WRITTEN = 'log_written',
  TRANSPORT_ERROR = 'transport_error',
  ROTATION_COMPLETED = 'rotation_completed',
  FILTER_APPLIED = 'filter_applied',
  SAMPLER_TRIGGERED = 'sampler_triggered',
  LOGGER_CREATED = 'logger_created',
  LOGGER_DESTROYED = 'logger_destroyed'
}

export interface ILogEventListener {
  onLogEvent(event: LogEvent): void;
}

// ============================================================================
// PERFORMANCE LOGGING
// ============================================================================

export interface IPerformanceLogger {
  startTimer(operation: string, meta?: LogMetadata): PerformanceTimer;
  endTimer(timer: PerformanceTimer): void;
  logDuration(operation: string, duration: number, meta?: LogMetadata): void;
  logMemoryUsage(operation: string, meta?: LogMetadata): void;
  logSystemMetrics(meta?: LogMetadata): void;
}

export interface PerformanceTimer {
  id: string;
  operation: string;
  startTime: Date;
  meta: LogMetadata;
}

export interface SystemMetrics {
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  uptime: number;
  loadAverage: number[];
}

// ============================================================================
// SECURITY LOGGING
// ============================================================================

export interface ISecurityLogger extends ILogger {
  logSecurityEvent(event: SecurityEvent): void;
  logAccessAttempt(attempt: AccessAttempt): void;
  logDataAccess(access: DataAccess): void;
  logConfigurationChange(change: ConfigurationChange): void;
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  source: string;
  target?: string;
  timestamp: Date;
  metadata: LogMetadata;
}

export enum SecurityEventType {
  AUTHENTICATION_SUCCESS = 'authentication_success',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHORIZATION_FAILURE = 'authorization_failure',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  CONFIGURATION_CHANGE = 'configuration_change'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AccessAttempt {
  userId?: string;
  ip: string;
  userAgent: string;
  resource: string;
  method: string;
  success: boolean;
  timestamp: Date;
}

export interface DataAccess {
  userId?: string;
  resource: string;
  action: string;
  recordCount?: number;
  sensitive: boolean;
  timestamp: Date;
}

export interface ConfigurationChange {
  userId?: string;
  component: string;
  setting: string;
  oldValue?: any;
  newValue: any;
  timestamp: Date;
}
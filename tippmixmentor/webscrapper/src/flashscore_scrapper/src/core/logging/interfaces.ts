/**
 * Core logging interfaces - re-export from types
 */

export type {
  ILogger,
  ILoggerFactory,
  ILogTransport,
  IPerformanceLogger,
  LoggerConfig,
  TransportConfig,
  LogFormat,
  LogEntry,
  LogMetadata,
  StructuredLogEntry,
  PerformanceTimer,
  SystemMetrics
} from '../../types/logging.js';

export {
  TransportType,
  LogEventType
} from '../../types/logging.js';
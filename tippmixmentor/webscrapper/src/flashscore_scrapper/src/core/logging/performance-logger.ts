/**
 * Performance logging implementation
 */

import { v4 as uuidv4 } from 'uuid';
import { IPerformanceLogger, ILogger, PerformanceTimer, LogMetadata, SystemMetrics } from './interfaces.js';
import { LogLevel } from '../../types/core.js';

export class PerformanceLogger implements IPerformanceLogger {
  private logger: ILogger;
  private activeTimers: Map<string, PerformanceTimer> = new Map();

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  startTimer(operation: string, meta: LogMetadata = {}): PerformanceTimer {
    const timer: PerformanceTimer = {
      id: uuidv4(),
      operation,
      startTime: new Date(),
      meta: { ...meta, operation }
    };

    this.activeTimers.set(timer.id, timer);
    
    this.logger.debug(`Started timer for operation: ${operation}`, {
      ...meta,
      timerId: timer.id,
      operation,
      startTime: timer.startTime.toISOString()
    });

    return timer;
  }

  endTimer(timer: PerformanceTimer): void {
    const endTime = new Date();
    const duration = endTime.getTime() - timer.startTime.getTime();
    
    this.activeTimers.delete(timer.id);
    
    this.logDuration(timer.operation, duration, {
      ...timer.meta,
      timerId: timer.id,
      startTime: timer.startTime.toISOString(),
      endTime: endTime.toISOString()
    });
  }

  logDuration(operation: string, duration: number, meta: LogMetadata = {}): void {
    const level = this.getDurationLogLevel(duration);
    
    this.logger.log(level, `Operation completed: ${operation}`, {
      ...meta,
      operation,
      duration,
      durationMs: duration,
      durationFormatted: this.formatDuration(duration)
    });
  }

  logMemoryUsage(operation: string, meta: LogMetadata = {}): void {
    const memUsage = process.memoryUsage();
    const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    this.logger.info(`Memory usage for ${operation}`, {
      ...meta,
      operation,
      memoryUsage: memUsage.heapUsed,
      memoryUsageMB: memoryMB,
      memoryDetails: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      }
    });
  }

  logSystemMetrics(meta: LogMetadata = {}): void {
    const metrics = this.getSystemMetrics();
    
    this.logger.info('System metrics', {
      ...meta,
      systemMetrics: metrics,
      memoryUsageMB: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024),
      uptimeFormatted: this.formatDuration(metrics.uptime * 1000)
    });
  }

  /**
   * Get current system metrics
   */
  private getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memoryUsage: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      loadAverage: require('os').loadavg()
    };
  }

  /**
   * Determine appropriate log level based on duration
   */
  private getDurationLogLevel(duration: number): LogLevel {
    if (duration > 30000) { // > 30 seconds
      return LogLevel.WARN;
    } else if (duration > 10000) { // > 10 seconds
      return LogLevel.INFO;
    } else {
      return LogLevel.DEBUG;
    }
  }

  /**
   * Format duration in a human-readable way
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else if (ms < 3600000) {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Get all active timers
   */
  getActiveTimers(): PerformanceTimer[] {
    return Array.from(this.activeTimers.values());
  }

  /**
   * Clear all active timers
   */
  clearActiveTimers(): void {
    this.activeTimers.clear();
  }

  /**
   * Create a child performance logger with additional metadata
   */
  child(defaultMeta: LogMetadata): PerformanceLogger {
    const childLogger = this.logger.child(defaultMeta);
    return new PerformanceLogger(childLogger);
  }
}
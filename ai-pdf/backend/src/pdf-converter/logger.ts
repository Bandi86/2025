/**
 * Structured Logging System
 * Provides centralized logging with performance metrics and error context
 */

import winston from "winston";
import path from "path";
import { ErrorCode, ProcessingStep } from "./types";

// Log levels
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

// Log context interface
export interface LogContext {
  component?: string;
  operation?: string;
  filePath?: string;
  processingStep?: ProcessingStep;
  duration?: number;
  errorCode?: ErrorCode;
  metadata?: Record<string, any>;
}

// Performance metrics interface
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  operation: string;
  component: string;
  success: boolean;
  errorCode?: ErrorCode;
}

// Logger configuration
interface LoggerConfig {
  level: string;
  enableConsole: boolean;
  enableFile: boolean;
  logDir: string;
  maxFiles: number;
  maxSize: string;
  enableMetrics: boolean;
}

/**
 * Structured Logger class
 */
export class StructuredLogger {
  private logger: winston.Logger;
  private config: LoggerConfig;
  private metrics: PerformanceMetrics[] = [];
  private activeOperations: Map<string, PerformanceMetrics> = new Map();

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: process.env.LOG_LEVEL || "info",
      enableConsole: process.env.NODE_ENV !== "production",
      enableFile: true,
      logDir: process.env.LOG_DIR || "./logs",
      maxFiles: 10,
      maxSize: "10m",
      enableMetrics: true,
      ...config,
    };

    this.initializeLogger();
  }

  /**
   * Initialize Winston logger with transports
   */
  private initializeLogger(): void {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length
                ? JSON.stringify(meta, null, 2)
                : "";
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
          ),
        })
      );
    }

    // File transport
    if (this.config.enableFile) {
      transports.push(
        new winston.transports.File({
          filename: path.join(this.config.logDir, "pdf-converter.log"),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          maxFiles: this.config.maxFiles,
          maxsize: this.parseSize(this.config.maxSize),
        })
      );

      // Error-specific log file
      transports.push(
        new winston.transports.File({
          filename: path.join(this.config.logDir, "errors.log"),
          level: "error",
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          maxFiles: this.config.maxFiles,
          maxsize: this.parseSize(this.config.maxSize),
        })
      );
    }

    this.logger = winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
      exitOnError: false,
    });
  }

  /**
   * Log info message with context
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, this.formatContext(context));
  }

  /**
   * Log warning message with context
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, this.formatContext(context));
  }

  /**
   * Log error message with context
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...this.formatContext(context),
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
            details: (error as any).details,
          }
        : undefined,
    };

    this.logger.error(message, errorContext);
  }

  /**
   * Log debug message with context
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, this.formatContext(context));
  }

  /**
   * Start performance tracking for an operation
   */
  startOperation(
    operationId: string,
    operation: string,
    component: string,
    context?: LogContext
  ): void {
    const metrics: PerformanceMetrics = {
      startTime: Date.now(),
      operation,
      component,
      success: false,
    };

    this.activeOperations.set(operationId, metrics);

    this.info(`Starting operation: ${operation}`, {
      ...context,
      component,
      operation,
    });
  }

  /**
   * End performance tracking for an operation
   */
  endOperation(
    operationId: string,
    success: boolean,
    errorCode?: ErrorCode,
    context?: LogContext
  ): void {
    const metrics = this.activeOperations.get(operationId);
    if (!metrics) {
      this.warn(`No active operation found for ID: ${operationId}`, {});
      return;
    }

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = success;
    metrics.errorCode = errorCode;
    metrics.memoryUsage = process.memoryUsage();

    // Store metrics if enabled
    if (this.config.enableMetrics) {
      this.metrics.push({ ...metrics });
    }

    // Log operation completion
    const logLevel = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `${success ? "Completed" : "Failed"} operation: ${metrics.operation}`;

    this.log(logLevel, message, {
      ...context,
      component: metrics.component,
      operation: metrics.operation,
      duration: metrics.duration,
      errorCode,
      memoryUsage: metrics.memoryUsage,
    });

    this.activeOperations.delete(operationId);
  }

  /**
   * Log with specific level
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    this.logger.log(level, message, this.formatContext(context));
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    totalOperations: number;
    successRate: number;
    averageDuration: number;
    operationCounts: Record<string, number>;
    errorCounts: Record<ErrorCode, number>;
  } {
    const totalOperations = this.metrics.length;
    const successCount = this.metrics.filter((m) => m.success).length;
    const successRate =
      totalOperations > 0 ? (successCount / totalOperations) * 100 : 0;

    const durations = this.metrics
      .filter((m) => m.duration)
      .map((m) => m.duration!);
    const averageDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    const operationCounts: Record<string, number> = {};
    const errorCounts: Record<ErrorCode, number> = {};

    this.metrics.forEach((metric) => {
      const key = `${metric.component}.${metric.operation}`;
      operationCounts[key] = (operationCounts[key] || 0) + 1;

      if (metric.errorCode) {
        errorCounts[metric.errorCode] =
          (errorCounts[metric.errorCode] || 0) + 1;
      }
    });

    return {
      totalOperations,
      successRate,
      averageDuration,
      operationCounts,
      errorCounts,
    };
  }

  /**
   * Log PDF processing start
   */
  logPDFProcessingStart(filePath: string, fileSize?: number): void {
    this.info("Starting PDF processing", {
      component: "PDFReader",
      operation: "extractText",
      filePath,
      metadata: { fileSize },
    });
  }

  /**
   * Log PDF processing completion
   */
  logPDFProcessingComplete(
    filePath: string,
    textLength: number,
    duration: number
  ): void {
    this.info("PDF processing completed", {
      component: "PDFReader",
      operation: "extractText",
      filePath,
      duration,
      metadata: { textLength },
    });
  }

  /**
   * Log AI analysis start
   */
  logAIAnalysisStart(textLength: number, model: string): void {
    this.info("Starting AI analysis", {
      component: "GemmaClient",
      operation: "analyzeText",
      metadata: { textLength, model },
    });
  }

  /**
   * Log AI analysis completion
   */
  logAIAnalysisComplete(
    duration: number,
    success: boolean,
    model: string
  ): void {
    this.info("AI analysis completed", {
      component: "GemmaClient",
      operation: "analyzeText",
      duration,
      metadata: { success, model },
    });
  }

  /**
   * Log JSON generation start
   */
  logJSONGenerationStart(analysisType: string): void {
    this.info("Starting JSON generation", {
      component: "JSONGenerator",
      operation: "generateOutput",
      metadata: { analysisType },
    });
  }

  /**
   * Log JSON generation completion
   */
  logJSONGenerationComplete(duration: number, outputSize: number): void {
    this.info("JSON generation completed", {
      component: "JSONGenerator",
      operation: "generateOutput",
      duration,
      metadata: { outputSize },
    });
  }

  /**
   * Log batch processing start
   */
  logBatchProcessingStart(directoryPath: string, fileCount: number): void {
    this.info("Starting batch processing", {
      component: "ConverterService",
      operation: "processBatch",
      filePath: directoryPath,
      metadata: { fileCount },
    });
  }

  /**
   * Log batch processing completion
   */
  logBatchProcessingComplete(
    directoryPath: string,
    totalFiles: number,
    successCount: number,
    failureCount: number,
    duration: number
  ): void {
    this.info("Batch processing completed", {
      component: "ConverterService",
      operation: "processBatch",
      filePath: directoryPath,
      duration,
      metadata: {
        totalFiles,
        successCount,
        failureCount,
        successRate: (successCount / totalFiles) * 100,
      },
    });
  }

  /**
   * Log conversion pipeline step
   */
  logPipelineStep(
    step: ProcessingStep,
    filePath: string,
    status: "start" | "complete" | "error",
    duration?: number,
    error?: Error
  ): void {
    const message = `Pipeline step ${step}: ${status}`;
    const context: LogContext = {
      component: "ConverterService",
      operation: "convertPDF",
      filePath,
      processingStep: step,
      duration,
    };

    if (status === "error" && error) {
      this.error(message, error, context);
    } else {
      this.info(message, context);
    }
  }

  /**
   * Log health check results
   */
  logHealthCheck(
    service: string,
    healthy: boolean,
    responseTime?: number,
    error?: string
  ): void {
    const message = `Health check for ${service}: ${healthy ? "HEALTHY" : "UNHEALTHY"}`;
    const context: LogContext = {
      component: "ConverterService",
      operation: "healthCheck",
      metadata: {
        service,
        healthy,
        responseTime,
        error,
      },
    };

    if (healthy) {
      this.info(message, context);
    } else {
      this.warn(message, context);
    }
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get active operations
   */
  getActiveOperations(): Map<string, PerformanceMetrics> {
    return new Map(this.activeOperations);
  }

  /**
   * Format log context
   */
  private formatContext(context?: LogContext): Record<string, any> {
    if (!context) return {};

    return {
      component: context.component,
      operation: context.operation,
      filePath: context.filePath,
      processingStep: context.processingStep,
      duration: context.duration,
      errorCode: context.errorCode,
      ...context.metadata,
    };
  }

  /**
   * Parse size string to bytes
   */
  private parseSize(size: string): number {
    const units: Record<string, number> = {
      b: 1,
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+)([bkmg]?)$/);
    if (!match) return 10 * 1024 * 1024; // Default 10MB

    const value = parseInt(match[1]);
    const unit = match[2] || "b";

    return value * (units[unit] || 1);
  }

  /**
   * Create child logger with default context
   */
  child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

/**
 * Child logger with default context
 */
export class ChildLogger {
  constructor(
    private parent: StructuredLogger,
    private defaultContext: LogContext
  ) {}

  info(message: string, context?: LogContext): void {
    this.parent.info(message, { ...this.defaultContext, ...context });
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, { ...this.defaultContext, ...context });
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.parent.error(message, error, { ...this.defaultContext, ...context });
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, { ...this.defaultContext, ...context });
  }

  startOperation(
    operationId: string,
    operation: string,
    context?: LogContext
  ): void {
    this.parent.startOperation(
      operationId,
      operation,
      this.defaultContext.component || "Unknown",
      { ...this.defaultContext, ...context }
    );
  }

  endOperation(
    operationId: string,
    success: boolean,
    errorCode?: ErrorCode,
    context?: LogContext
  ): void {
    this.parent.endOperation(operationId, success, errorCode, {
      ...this.defaultContext,
      ...context,
    });
  }
}

// Global logger instance
export const logger = new StructuredLogger();

// Component-specific loggers
export const pdfReaderLogger = logger.child({ component: "PDFReader" });
export const gemmaClientLogger = logger.child({ component: "GemmaClient" });
export const jsonGeneratorLogger = logger.child({ component: "JSONGenerator" });
export const converterServiceLogger = logger.child({
  component: "ConverterService",
});

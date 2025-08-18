/**
 * Tests for structured logging functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { StructuredLogger, LogLevel, ChildLogger, logger } from "../logger";
import { ErrorCode, ProcessingStep } from "../types";
import winston from "winston";

// Mock winston
vi.mock("winston", () => ({
  default: {
    createLogger: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
    })),
    format: {
      combine: vi.fn(() => ({})),
      timestamp: vi.fn(() => ({})),
      errors: vi.fn(() => ({})),
      json: vi.fn(() => ({})),
      colorize: vi.fn(() => ({})),
      printf: vi.fn(() => ({})),
    },
    transports: {
      Console: vi.fn(),
      File: vi.fn(),
    },
  },
}));

describe("StructuredLogger", () => {
  let testLogger: StructuredLogger;
  let mockWinstonLogger: any;

  beforeEach(() => {
    mockWinstonLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
    };

    (winston.createLogger as any).mockReturnValue(mockWinstonLogger);

    testLogger = new StructuredLogger({
      level: "debug",
      enableConsole: true,
      enableFile: false,
      enableMetrics: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Logging", () => {
    it("should log info messages with context", () => {
      const message = "Test info message";
      const context = {
        component: "TestComponent",
        operation: "testOperation",
        filePath: "/test/file.pdf",
      };

      testLogger.info(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, {
        component: "TestComponent",
        operation: "testOperation",
        filePath: "/test/file.pdf",
      });
    });

    it("should log warning messages with context", () => {
      const message = "Test warning message";
      const context = {
        component: "TestComponent",
        operation: "testOperation",
      };

      testLogger.warn(message, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message, {
        component: "TestComponent",
        operation: "testOperation",
      });
    });

    it("should log error messages with error object and context", () => {
      const message = "Test error message";
      const error = new Error("Test error");
      const context = {
        component: "TestComponent",
        operation: "testOperation",
        errorCode: ErrorCode.PDF_EXTRACTION_FAILED,
      };

      testLogger.error(message, error, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        component: "TestComponent",
        operation: "testOperation",
        errorCode: ErrorCode.PDF_EXTRACTION_FAILED,
        error: {
          name: "Error",
          message: "Test error",
          stack: error.stack,
          code: undefined,
          details: undefined,
        },
      });
    });

    it("should log debug messages with context", () => {
      const message = "Test debug message";
      const context = {
        component: "TestComponent",
        metadata: { key: "value" },
      };

      testLogger.debug(message, context);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message, {
        component: "TestComponent",
        key: "value",
      });
    });
  });

  describe("Operation Tracking", () => {
    it("should start and end operations successfully", () => {
      const operationId = "test-operation-123";
      const operation = "testOperation";
      const component = "TestComponent";

      testLogger.startOperation(operationId, operation, component);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Starting operation: ${operation}`,
        expect.objectContaining({
          component,
          operation,
        })
      );

      // End operation successfully
      testLogger.endOperation(operationId, true);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        `Completed operation: ${operation}`,
        expect.objectContaining({
          component,
          operation,
          duration: expect.any(Number),
        })
      );
    });

    it("should handle failed operations", () => {
      const operationId = "test-operation-456";
      const operation = "testOperation";
      const component = "TestComponent";
      const errorCode = ErrorCode.AI_ANALYSIS_FAILED;

      testLogger.startOperation(operationId, operation, component);
      testLogger.endOperation(operationId, false, errorCode);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        `Failed operation: ${operation}`,
        expect.objectContaining({
          component,
          operation,
          errorCode,
          duration: expect.any(Number),
        })
      );
    });

    it("should warn when ending non-existent operation", () => {
      const operationId = "non-existent-operation";

      testLogger.endOperation(operationId, true);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        `No active operation found for ID: ${operationId}`,
        {}
      );
    });
  });

  describe("Specialized Logging Methods", () => {
    it("should log PDF processing start", () => {
      const filePath = "/test/document.pdf";
      const fileSize = 1024000;

      testLogger.logPDFProcessingStart(filePath, fileSize);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        "Starting PDF processing",
        {
          component: "PDFReader",
          operation: "extractText",
          filePath,
          fileSize,
        }
      );
    });

    it("should log PDF processing completion", () => {
      const filePath = "/test/document.pdf";
      const textLength = 5000;
      const duration = 1500;

      testLogger.logPDFProcessingComplete(filePath, textLength, duration);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        "PDF processing completed",
        {
          component: "PDFReader",
          operation: "extractText",
          filePath,
          duration,
          textLength,
        }
      );
    });

    it("should log AI analysis start", () => {
      const textLength = 5000;
      const model = "gemma:7b";

      testLogger.logAIAnalysisStart(textLength, model);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        "Starting AI analysis",
        {
          component: "GemmaClient",
          operation: "analyzeText",
          textLength,
          model,
        }
      );
    });

    it("should log batch processing start", () => {
      const directoryPath = "/test/batch";
      const fileCount = 10;

      testLogger.logBatchProcessingStart(directoryPath, fileCount);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        "Starting batch processing",
        {
          component: "ConverterService",
          operation: "processBatch",
          filePath: directoryPath,
          fileCount,
        }
      );
    });

    it("should log pipeline steps", () => {
      const step = ProcessingStep.PDF_EXTRACTION;
      const filePath = "/test/document.pdf";
      const duration = 1000;

      // Test successful step
      testLogger.logPipelineStep(step, filePath, "complete", duration);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Pipeline step ${step}: complete`,
        {
          component: "ConverterService",
          operation: "convertPDF",
          filePath,
          processingStep: step,
          duration,
        }
      );

      // Test error step
      const error = new Error("Test error");
      testLogger.logPipelineStep(step, filePath, "error", duration, error);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        `Pipeline step ${step}: error`,
        expect.objectContaining({
          component: "ConverterService",
          operation: "convertPDF",
          filePath,
          processingStep: step,
          duration,
          error: expect.objectContaining({
            name: "Error",
            message: "Test error",
          }),
        })
      );
    });

    it("should log health check results", () => {
      const service = "Gemma AI";
      const responseTime = 500;

      // Test healthy service
      testLogger.logHealthCheck(service, true, responseTime);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Health check for ${service}: HEALTHY`,
        {
          component: "ConverterService",
          operation: "healthCheck",
          service,
          healthy: true,
          responseTime,
          error: undefined,
        }
      );

      // Test unhealthy service
      const error = "Connection failed";
      testLogger.logHealthCheck(service, false, responseTime, error);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        `Health check for ${service}: UNHEALTHY`,
        {
          component: "ConverterService",
          operation: "healthCheck",
          service,
          healthy: false,
          responseTime,
          error,
        }
      );
    });
  });

  describe("Metrics Collection", () => {
    it("should collect and return metrics", () => {
      const operationId = "metrics-test";
      const operation = "testOperation";
      const component = "TestComponent";

      testLogger.startOperation(operationId, operation, component);
      testLogger.endOperation(operationId, true);

      const metrics = testLogger.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        operation,
        component,
        success: true,
        duration: expect.any(Number),
      });
    });

    it("should provide metrics summary", () => {
      const operationId1 = "metrics-test-1";
      const operationId2 = "metrics-test-2";
      const operation = "testOperation";
      const component = "TestComponent";

      // Successful operation
      testLogger.startOperation(operationId1, operation, component);
      testLogger.endOperation(operationId1, true);

      // Failed operation
      testLogger.startOperation(operationId2, operation, component);
      testLogger.endOperation(
        operationId2,
        false,
        ErrorCode.AI_ANALYSIS_FAILED
      );

      const summary = testLogger.getMetricsSummary();
      expect(summary.totalOperations).toBe(2);
      expect(summary.successRate).toBe(50);
      expect(summary.averageDuration).toBeGreaterThanOrEqual(0);
      expect(summary.operationCounts[`${component}.${operation}`]).toBe(2);
      expect(summary.errorCounts[ErrorCode.AI_ANALYSIS_FAILED]).toBe(1);
    });

    it("should clear metrics", () => {
      const operationId = "clear-test";
      testLogger.startOperation(operationId, "testOperation", "TestComponent");
      testLogger.endOperation(operationId, true);

      expect(testLogger.getMetrics()).toHaveLength(1);

      testLogger.clearMetrics();
      expect(testLogger.getMetrics()).toHaveLength(0);
    });
  });

  describe("Active Operations", () => {
    it("should track active operations", () => {
      const operationId = "active-test";
      const operation = "testOperation";
      const component = "TestComponent";

      testLogger.startOperation(operationId, operation, component);

      const activeOps = testLogger.getActiveOperations();
      expect(activeOps.has(operationId)).toBe(true);
      expect(activeOps.get(operationId)).toMatchObject({
        operation,
        component,
        success: false,
      });

      testLogger.endOperation(operationId, true);

      const activeOpsAfter = testLogger.getActiveOperations();
      expect(activeOpsAfter.has(operationId)).toBe(false);
    });
  });
});

describe("ChildLogger", () => {
  let parentLogger: StructuredLogger;
  let childLogger: ChildLogger;
  let mockWinstonLogger: any;

  beforeEach(() => {
    mockWinstonLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
    };

    (winston.createLogger as any).mockReturnValue(mockWinstonLogger);

    parentLogger = new StructuredLogger({
      enableConsole: true,
      enableFile: false,
    });

    childLogger = parentLogger.child({
      component: "ChildComponent",
      operation: "childOperation",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should inherit default context from parent", () => {
    const message = "Child logger test";
    const additionalContext = { filePath: "/test/file.pdf" };

    childLogger.info(message, additionalContext);

    expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, {
      component: "ChildComponent",
      operation: "childOperation",
      filePath: "/test/file.pdf",
    });
  });

  it("should allow context override", () => {
    const message = "Override test";
    const overrideContext = {
      component: "OverrideComponent",
      filePath: "/test/override.pdf",
    };

    childLogger.info(message, overrideContext);

    expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, {
      component: "OverrideComponent",
      operation: "childOperation",
      filePath: "/test/override.pdf",
    });
  });

  it("should handle operation tracking with default context", () => {
    const operationId = "child-operation-test";
    const operation = "childTestOperation";

    childLogger.startOperation(operationId, operation);

    expect(mockWinstonLogger.info).toHaveBeenCalledWith(
      `Starting operation: ${operation}`,
      expect.objectContaining({
        component: "ChildComponent",
        operation: operation,
      })
    );
  });
});

describe("Global Logger Instances", () => {
  it("should provide global logger instance", () => {
    expect(logger).toBeInstanceOf(StructuredLogger);
  });

  it("should provide component-specific loggers", async () => {
    const {
      pdfReaderLogger,
      gemmaClientLogger,
      jsonGeneratorLogger,
      converterServiceLogger,
    } = await import("../logger");

    expect(pdfReaderLogger).toBeInstanceOf(ChildLogger);
    expect(gemmaClientLogger).toBeInstanceOf(ChildLogger);
    expect(jsonGeneratorLogger).toBeInstanceOf(ChildLogger);
    expect(converterServiceLogger).toBeInstanceOf(ChildLogger);
  });
});

describe("Logger Configuration", () => {
  it("should respect environment variables", () => {
    const originalEnv = process.env;

    process.env.LOG_LEVEL = "debug";
    process.env.NODE_ENV = "production";
    process.env.LOG_DIR = "/custom/logs";

    const configuredLogger = new StructuredLogger();

    // Verify winston.createLogger was called with correct configuration
    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "debug",
      })
    );

    process.env = originalEnv;
  });

  it("should use default configuration when env vars not set", () => {
    const originalEnv = process.env;

    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
    delete process.env.LOG_DIR;

    const defaultLogger = new StructuredLogger();

    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info",
      })
    );

    process.env = originalEnv;
  });
});

describe("Error Handling", () => {
  let testLogger: StructuredLogger;
  let mockWinstonLogger: any;

  beforeEach(() => {
    mockWinstonLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
    };

    (winston.createLogger as any).mockReturnValue(mockWinstonLogger);
    testLogger = new StructuredLogger();
  });

  it("should handle errors without stack traces", () => {
    const message = "Error without stack";
    const error = { message: "Custom error object" } as Error;

    testLogger.error(message, error);

    expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
      error: {
        name: undefined,
        message: "Custom error object",
        stack: undefined,
        code: undefined,
        details: undefined,
      },
    });
  });

  it("should handle custom error properties", () => {
    const message = "Custom error test";
    const error = new Error("Test error") as any;
    error.code = ErrorCode.PDF_EXTRACTION_FAILED;
    error.details = { customProperty: "value" };

    testLogger.error(message, error);

    expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
      error: {
        name: "Error",
        message: "Test error",
        stack: error.stack,
        code: ErrorCode.PDF_EXTRACTION_FAILED,
        details: { customProperty: "value" },
      },
    });
  });
});

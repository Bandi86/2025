/**
 * Tests for metrics collection functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  MetricsCollector,
  metricsCollector,
  recordConversionSuccess,
  recordConversionFailure,
  recordAISuccess,
  recordAIFailure,
  recordError,
  recordStepTiming,
} from "../metrics";
import { ErrorCode, ProcessingStep } from "../types";

describe("MetricsCollector", () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  describe("Conversion Metrics", () => {
    it("should record successful conversions", () => {
      const processingTime = 1500;

      collector.recordConversion(true, processingTime);

      const snapshot = collector.getSnapshot();
      expect(snapshot.conversion.totalConversions).toBe(1);
      expect(snapshot.conversion.successfulConversions).toBe(1);
      expect(snapshot.conversion.failedConversions).toBe(0);
      expect(snapshot.conversion.successRate).toBe(100);
      expect(snapshot.conversion.averageProcessingTime).toBe(processingTime);
      expect(snapshot.conversion.totalProcessingTime).toBe(processingTime);
    });

    it("should record failed conversions", () => {
      const processingTime = 2000;

      collector.recordConversion(false, processingTime);

      const snapshot = collector.getSnapshot();
      expect(snapshot.conversion.totalConversions).toBe(1);
      expect(snapshot.conversion.successfulConversions).toBe(0);
      expect(snapshot.conversion.failedConversions).toBe(1);
      expect(snapshot.conversion.successRate).toBe(0);
      expect(snapshot.conversion.averageProcessingTime).toBe(processingTime);
    });

    it("should calculate correct success rate with mixed results", () => {
      collector.recordConversion(true, 1000);
      collector.recordConversion(true, 1500);
      collector.recordConversion(false, 2000);
      collector.recordConversion(true, 1200);

      const snapshot = collector.getSnapshot();
      expect(snapshot.conversion.totalConversions).toBe(4);
      expect(snapshot.conversion.successfulConversions).toBe(3);
      expect(snapshot.conversion.failedConversions).toBe(1);
      expect(snapshot.conversion.successRate).toBe(75);
      expect(snapshot.conversion.averageProcessingTime).toBe(1425);
    });
  });

  describe("AI Service Metrics", () => {
    it("should record successful AI requests", () => {
      const responseTime = 800;

      collector.recordAIServiceRequest(true, responseTime);

      const snapshot = collector.getSnapshot();
      expect(snapshot.aiService.totalRequests).toBe(1);
      expect(snapshot.aiService.successfulRequests).toBe(1);
      expect(snapshot.aiService.failedRequests).toBe(0);
      expect(snapshot.aiService.averageResponseTime).toBe(responseTime);
      expect(snapshot.aiService.timeouts).toBe(0);
      expect(snapshot.aiService.connectionFailures).toBe(0);
    });

    it("should record failed AI requests with timeout", () => {
      const responseTime = 5000;

      collector.recordAIServiceRequest(false, responseTime, "timeout");

      const snapshot = collector.getSnapshot();
      expect(snapshot.aiService.totalRequests).toBe(1);
      expect(snapshot.aiService.successfulRequests).toBe(0);
      expect(snapshot.aiService.failedRequests).toBe(1);
      expect(snapshot.aiService.timeouts).toBe(1);
      expect(snapshot.aiService.connectionFailures).toBe(0);
    });

    it("should record failed AI requests with connection error", () => {
      const responseTime = 100;

      collector.recordAIServiceRequest(false, responseTime, "connection");

      const snapshot = collector.getSnapshot();
      expect(snapshot.aiService.connectionFailures).toBe(1);
      expect(snapshot.aiService.timeouts).toBe(0);
    });

    it("should calculate average response time correctly", () => {
      collector.recordAIServiceRequest(true, 500);
      collector.recordAIServiceRequest(true, 1000);
      collector.recordAIServiceRequest(false, 1500);

      const snapshot = collector.getSnapshot();
      expect(snapshot.aiService.averageResponseTime).toBe(1000);
    });
  });

  describe("Batch Processing Metrics", () => {
    it("should record batch processing", () => {
      const batchSize = 5;
      const processingTime = 10000;
      const successCount = 4;

      collector.recordBatchProcessing(batchSize, processingTime, successCount);

      const snapshot = collector.getSnapshot();
      expect(snapshot.batchProcessing.totalBatches).toBe(1);
      expect(snapshot.batchProcessing.totalFilesProcessed).toBe(batchSize);
      expect(snapshot.batchProcessing.averageBatchSize).toBe(batchSize);
      expect(snapshot.batchProcessing.averageBatchProcessingTime).toBe(
        processingTime
      );
      expect(snapshot.batchProcessing.batchSuccessRate).toBe(80);
    });

    it("should calculate averages correctly with multiple batches", () => {
      collector.recordBatchProcessing(3, 5000, 3);
      collector.recordBatchProcessing(7, 15000, 5);

      const snapshot = collector.getSnapshot();
      expect(snapshot.batchProcessing.totalBatches).toBe(2);
      expect(snapshot.batchProcessing.totalFilesProcessed).toBe(10);
      expect(snapshot.batchProcessing.averageBatchSize).toBe(5);
      expect(snapshot.batchProcessing.averageBatchProcessingTime).toBe(10000);
      expect(snapshot.batchProcessing.batchSuccessRate).toBe(80);
    });
  });

  describe("Error Metrics", () => {
    it("should record errors by code and step", () => {
      collector.recordError(
        ErrorCode.PDF_EXTRACTION_FAILED,
        ProcessingStep.PDF_EXTRACTION
      );
      collector.recordError(
        ErrorCode.AI_ANALYSIS_FAILED,
        ProcessingStep.AI_ANALYSIS
      );
      collector.recordError(
        ErrorCode.PDF_EXTRACTION_FAILED,
        ProcessingStep.PDF_EXTRACTION
      );

      const snapshot = collector.getSnapshot();
      expect(snapshot.errors.totalErrors).toBe(3);
      expect(snapshot.errors.errorCounts[ErrorCode.PDF_EXTRACTION_FAILED]).toBe(
        2
      );
      expect(snapshot.errors.errorCounts[ErrorCode.AI_ANALYSIS_FAILED]).toBe(1);
      expect(snapshot.errors.errorsByStep[ProcessingStep.PDF_EXTRACTION]).toBe(
        2
      );
      expect(snapshot.errors.errorsByStep[ProcessingStep.AI_ANALYSIS]).toBe(1);
      expect(snapshot.errors.mostCommonError).toBe(
        ErrorCode.PDF_EXTRACTION_FAILED
      );
      expect(snapshot.errors.mostProblematicStep).toBe(
        ProcessingStep.PDF_EXTRACTION
      );
    });

    it("should handle single error correctly", () => {
      collector.recordError(
        ErrorCode.JSON_GENERATION_FAILED,
        ProcessingStep.JSON_GENERATION
      );

      const snapshot = collector.getSnapshot();
      expect(snapshot.errors.mostCommonError).toBe(
        ErrorCode.JSON_GENERATION_FAILED
      );
      expect(snapshot.errors.mostProblematicStep).toBe(
        ProcessingStep.JSON_GENERATION
      );
    });
  });

  describe("Step Timing", () => {
    it("should record processing step timings", () => {
      collector.recordStepTiming(ProcessingStep.PDF_EXTRACTION, 1000);
      collector.recordStepTiming(ProcessingStep.AI_ANALYSIS, 2000);
      collector.recordStepTiming(ProcessingStep.JSON_GENERATION, 500);
      collector.recordStepTiming(ProcessingStep.PDF_EXTRACTION, 1200);

      const snapshot = collector.getSnapshot();
      expect(snapshot.performance.processingTimes.pdfExtraction).toEqual([
        1000, 1200,
      ]);
      expect(snapshot.performance.processingTimes.aiAnalysis).toEqual([2000]);
      expect(snapshot.performance.processingTimes.jsonGeneration).toEqual([
        500,
      ]);
    });
  });

  describe("Memory and CPU Metrics", () => {
    it("should update memory usage metrics", () => {
      const originalMemoryUsage = process.memoryUsage;
      const mockMemoryUsage = {
        rss: 100000000,
        heapTotal: 50000000,
        heapUsed: 30000000,
        external: 5000000,
        arrayBuffers: 1000000,
      };

      process.memoryUsage = vi.fn().mockReturnValue(mockMemoryUsage);

      collector.updateMemoryUsage();

      const snapshot = collector.getSnapshot();
      expect(snapshot.performance.memoryUsage.current).toEqual(mockMemoryUsage);
      expect(
        snapshot.performance.memoryUsage.peak.heapUsed
      ).toBeGreaterThanOrEqual(mockMemoryUsage.heapUsed);

      process.memoryUsage = originalMemoryUsage;
    });

    it("should update CPU usage metrics", () => {
      const originalCpuUsage = process.cpuUsage;
      const mockCpuUsage = {
        user: 1000000,
        system: 500000,
      };

      process.cpuUsage = vi.fn().mockReturnValue(mockCpuUsage);

      collector.updateCPUUsage();

      const snapshot = collector.getSnapshot();
      expect(snapshot.performance.cpuUsage.user).toBe(1);
      expect(snapshot.performance.cpuUsage.system).toBe(0.5);

      process.cpuUsage = originalCpuUsage;
    });
  });

  describe("Snapshots", () => {
    it("should take and store snapshots", () => {
      collector.recordConversion(true, 1000);
      collector.recordError(
        ErrorCode.PDF_EXTRACTION_FAILED,
        ProcessingStep.PDF_EXTRACTION
      );

      const snapshot = collector.takeSnapshot();

      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.conversion.totalConversions).toBe(1);
      expect(snapshot.errors.totalErrors).toBe(1);
      expect(snapshot.uptime).toBeGreaterThanOrEqual(0);

      const snapshots = collector.getSnapshots();
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0]).toEqual(snapshot);
    });

    it("should limit number of stored snapshots", () => {
      const testCollector = new MetricsCollector();

      // Take more snapshots than the limit (100)
      for (let i = 0; i < 105; i++) {
        testCollector.takeSnapshot();
      }

      const snapshots = testCollector.getSnapshots();
      expect(snapshots).toHaveLength(100);
    });
  });

  describe("Summary and Statistics", () => {
    beforeEach(() => {
      // Set up some test data
      collector.recordConversion(true, 1000);
      collector.recordConversion(true, 1500);
      collector.recordConversion(false, 2000);
      collector.recordAIServiceRequest(true, 800);
      collector.recordAIServiceRequest(false, 1200, "timeout");
      collector.recordError(
        ErrorCode.PDF_EXTRACTION_FAILED,
        ProcessingStep.PDF_EXTRACTION
      );
      collector.recordStepTiming(ProcessingStep.PDF_EXTRACTION, 500);
    });

    it("should provide comprehensive summary", () => {
      const summary = collector.getSummary();

      expect(summary.overview.totalConversions).toBe(3);
      expect(summary.overview.successRate).toBe(66.66666666666666);
      expect(summary.overview.averageProcessingTime).toBe(1500);
      expect(summary.overview.uptime).toBeGreaterThanOrEqual(0);

      expect(summary.performance.memoryUsage).toMatch(
        /\d+(\.\d+)?\s(Bytes|KB|MB|GB)/
      );
      expect(summary.performance.averageStepTimes.pdfExtraction).toBe(500);
      expect(summary.performance.averageStepTimes.aiAnalysis).toBe(1000);

      expect(summary.errors.totalErrors).toBe(1);
      expect(summary.errors.errorRate).toBe(33.33333333333333);
      expect(summary.errors.topErrors).toHaveLength(1);
      expect(summary.errors.topErrors[0].code).toBe(
        ErrorCode.PDF_EXTRACTION_FAILED
      );

      expect(summary.aiService.totalRequests).toBe(2);
      expect(summary.aiService.averageResponseTime).toBe(1000);
      expect(summary.aiService.failureRate).toBe(50);
    });

    it("should provide statistics for time periods", () => {
      // Take snapshots to create history
      collector.takeSnapshot();

      // Wait a bit and add more data
      collector.recordConversion(true, 1000);
      collector.takeSnapshot();

      const stats = collector.getStatistics(60); // Last 60 minutes

      expect(stats.conversionsInPeriod).toBeGreaterThanOrEqual(0);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Reset Functionality", () => {
    it("should reset all metrics", () => {
      collector.recordConversion(true, 1000);
      collector.recordError(
        ErrorCode.PDF_EXTRACTION_FAILED,
        ProcessingStep.PDF_EXTRACTION
      );
      collector.takeSnapshot();

      expect(collector.getSnapshot().conversion.totalConversions).toBe(1);
      expect(collector.getSnapshots()).toHaveLength(1);

      collector.reset();

      const snapshot = collector.getSnapshot();
      expect(snapshot.conversion.totalConversions).toBe(0);
      expect(snapshot.errors.totalErrors).toBe(0);
      expect(collector.getSnapshots()).toHaveLength(0);
    });
  });
});

describe("Global Metrics Functions", () => {
  beforeEach(() => {
    metricsCollector.reset();
  });

  it("should record conversion success", () => {
    recordConversionSuccess(1500);

    const snapshot = metricsCollector.getSnapshot();
    expect(snapshot.conversion.successfulConversions).toBe(1);
    expect(snapshot.conversion.totalConversions).toBe(1);
  });

  it("should record conversion failure", () => {
    recordConversionFailure(2000);

    const snapshot = metricsCollector.getSnapshot();
    expect(snapshot.conversion.failedConversions).toBe(1);
    expect(snapshot.conversion.totalConversions).toBe(1);
  });

  it("should record AI success", () => {
    recordAISuccess(800);

    const snapshot = metricsCollector.getSnapshot();
    expect(snapshot.aiService.successfulRequests).toBe(1);
    expect(snapshot.aiService.totalRequests).toBe(1);
  });

  it("should record AI failure", () => {
    recordAIFailure(1200, "timeout");

    const snapshot = metricsCollector.getSnapshot();
    expect(snapshot.aiService.failedRequests).toBe(1);
    expect(snapshot.aiService.timeouts).toBe(1);
  });

  it("should record errors", () => {
    recordError(ErrorCode.PDF_EXTRACTION_FAILED, ProcessingStep.PDF_EXTRACTION);

    const snapshot = metricsCollector.getSnapshot();
    expect(snapshot.errors.totalErrors).toBe(1);
    expect(snapshot.errors.errorCounts[ErrorCode.PDF_EXTRACTION_FAILED]).toBe(
      1
    );
  });

  it("should record step timing", () => {
    recordStepTiming(ProcessingStep.AI_ANALYSIS, 1500);

    const snapshot = metricsCollector.getSnapshot();
    expect(snapshot.performance.processingTimes.aiAnalysis).toEqual([1500]);
  });
});

describe("Edge Cases and Error Handling", () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  it("should handle zero conversions gracefully", () => {
    const summary = collector.getSummary();

    expect(summary.overview.successRate).toBe(0);
    expect(summary.overview.averageProcessingTime).toBe(0);
    expect(summary.errors.errorRate).toBe(0);
    expect(summary.aiService.failureRate).toBe(0);
  });

  it("should handle empty processing times", () => {
    const summary = collector.getSummary();

    expect(summary.performance.averageStepTimes.pdfExtraction).toBe(0);
    expect(summary.performance.averageStepTimes.aiAnalysis).toBe(0);
    expect(summary.performance.averageStepTimes.jsonGeneration).toBe(0);
  });

  it("should handle statistics with no snapshots", () => {
    const stats = collector.getStatistics(60);

    expect(stats.conversionsInPeriod).toBe(0);
    expect(stats.averageProcessingTime).toBe(0);
    expect(stats.successRate).toBe(0);
    expect(stats.errorRate).toBe(0);
  });

  it("should format bytes correctly", () => {
    const testCases = [
      { bytes: 0, expected: "0 Bytes" },
      { bytes: 1024, expected: "1 KB" },
      { bytes: 1048576, expected: "1 MB" },
      { bytes: 1073741824, expected: "1 GB" },
      { bytes: 1536, expected: "1.5 KB" },
    ];

    testCases.forEach(({ bytes, expected }) => {
      // Access private method through any cast for testing
      const result = (collector as any).formatBytes(bytes);
      expect(result).toBe(expected);
    });
  });

  it("should calculate averages correctly with empty arrays", () => {
    // Access private method through any cast for testing
    const result = (collector as any).calculateAverage([]);
    expect(result).toBe(0);
  });

  it("should calculate averages correctly with values", () => {
    // Access private method through any cast for testing
    const result = (collector as any).calculateAverage([100, 200, 300]);
    expect(result).toBe(200);
  });
});

/**
 * Tests for metrics reporter functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MetricsReporter, metricsReporter } from "../metrics-reporter";
import { metricsCollector } from "../metrics";
import { ErrorCode, ProcessingStep } from "../types";

// Mock console.log
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("MetricsReporter", () => {
  let reporter: MetricsReporter;

  beforeEach(() => {
    reporter = new MetricsReporter();
    metricsCollector.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Report Generation", () => {
    beforeEach(() => {
      // Set up test data
      metricsCollector.recordConversion(true, 1500);
      metricsCollector.recordConversion(true, 2000);
      metricsCollector.recordConversion(false, 3000);
      metricsCollector.recordAIServiceRequest(true, 800);
      metricsCollector.recordAIServiceRequest(false, 1200, "timeout");
      metricsCollector.recordError(
        ErrorCode.PDF_EXTRACTION_FAILED,
        ProcessingStep.PDF_EXTRACTION
      );
      metricsCollector.recordStepTiming(ProcessingStep.PDF_EXTRACTION, 500);
      metricsCollector.recordStepTiming(ProcessingStep.JSON_GENERATION, 300);
      metricsCollector.recordBatchProcessing(5, 10000, 4);
    });

    it("should generate a comprehensive text report", () => {
      const report = reporter.generateReport();

      expect(report).toContain("PDF Converter Metrics Report");
      expect(report).toContain("Total Conversions: 3");
      expect(report).toContain("Success Rate: 66.67%");
      expect(report).toContain("Average Processing Time: 2167ms");
      expect(report).toContain("Total Requests: 2");
      expect(report).toContain("Average Response Time: 1000ms");
      expect(report).toContain("Total Errors: 1");
      expect(report).toContain("PDF_EXTRACTION_FAILED: 1 occurrences");
    });

    it("should generate a JSON report", () => {
      const report = reporter.generateJSONReport();

      expect(report).toHaveProperty("timestamp");
      expect(report).toHaveProperty("uptime");
      expect(report).toHaveProperty("overview");
      expect(report).toHaveProperty("performance");
      expect(report).toHaveProperty("aiService");
      expect(report).toHaveProperty("errors");
      expect(report).toHaveProperty("batchProcessing");

      expect((report as any).overview.totalConversions).toBe(3);
      expect((report as any).overview.successRate).toBeCloseTo(66.67, 1);
      expect((report as any).aiService.totalRequests).toBe(2);
      expect((report as any).errors.totalErrors).toBe(1);
    });

    it("should log metrics to console", () => {
      reporter.logMetrics();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("PDF Converter Metrics Report")
      );
    });
  });

  describe("Recent Statistics", () => {
    it("should get recent performance statistics", () => {
      // Add some test data
      metricsCollector.recordConversion(true, 1000);
      metricsCollector.recordConversion(false, 2000);
      metricsCollector.takeSnapshot();

      const stats = reporter.getRecentStats(60);

      expect(stats.period).toBe("Last 60 minutes");
      expect(stats.conversions).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.averageTime).toBeGreaterThanOrEqual(0);
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
    });

    it("should handle custom time periods", () => {
      const stats = reporter.getRecentStats(30);
      expect(stats.period).toBe("Last 30 minutes");
    });
  });

  describe("Health Checking", () => {
    it("should report healthy status with good metrics", () => {
      // Set up good metrics
      for (let i = 0; i < 20; i++) {
        metricsCollector.recordConversion(true, 1000);
        metricsCollector.recordAIServiceRequest(true, 500);
      }

      const health = reporter.checkHealth();

      expect(health.healthy).toBe(true);
      expect(health.issues).toHaveLength(0);
      expect(health.recommendations).toHaveLength(0);
    });

    it("should detect low success rate issues", () => {
      // Set up poor success rate
      for (let i = 0; i < 15; i++) {
        metricsCollector.recordConversion(false, 1000);
      }
      for (let i = 0; i < 5; i++) {
        metricsCollector.recordConversion(true, 1000);
      }

      const health = reporter.checkHealth();

      expect(health.healthy).toBe(false);
      expect(
        health.issues.some((issue) => issue.includes("Low success rate"))
      ).toBe(true);
      expect(
        health.recommendations.some((rec) => rec.includes("error patterns"))
      ).toBe(true);
    });

    it("should detect AI service issues", () => {
      // Set up AI service failures
      for (let i = 0; i < 10; i++) {
        metricsCollector.recordAIServiceRequest(false, 1000, "timeout");
      }
      for (let i = 0; i < 2; i++) {
        metricsCollector.recordAIServiceRequest(true, 500);
      }

      const health = reporter.checkHealth();

      expect(health.healthy).toBe(false);
      expect(
        health.issues.some((issue) => issue.includes("AI service failure rate"))
      ).toBe(true);
      expect(
        health.recommendations.some((rec) => rec.includes("connectivity"))
      ).toBe(true);
    });

    it("should detect slow processing times", () => {
      // Set up slow processing
      metricsCollector.recordConversion(true, 35000); // 35 seconds
      metricsCollector.recordConversion(true, 40000); // 40 seconds

      const health = reporter.checkHealth();

      expect(health.healthy).toBe(false);
      expect(
        health.issues.some((issue) => issue.includes("Slow processing times"))
      ).toBe(true);
      expect(
        health.recommendations.some((rec) => rec.includes("optimizing"))
      ).toBe(true);
    });

    it("should detect high memory usage", () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = vi.fn().mockReturnValue({
        rss: 600 * 1024 * 1024, // 600MB
        heapTotal: 600 * 1024 * 1024,
        heapUsed: 600 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024,
      });

      metricsCollector.updateMemoryUsage();

      const health = reporter.checkHealth();

      expect(health.healthy).toBe(false);
      expect(
        health.issues.some((issue) => issue.includes("High memory usage"))
      ).toBe(true);
      expect(
        health.recommendations.some((rec) => rec.includes("memory leaks"))
      ).toBe(true);

      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe("Utility Operations", () => {
    it("should reset metrics", () => {
      metricsCollector.recordConversion(true, 1000);
      expect(metricsCollector.getSnapshot().conversion.totalConversions).toBe(
        1
      );

      reporter.resetMetrics();

      expect(metricsCollector.getSnapshot().conversion.totalConversions).toBe(
        0
      );
    });

    it("should take snapshots", () => {
      const initialSnapshots = metricsCollector.getSnapshots().length;

      reporter.takeSnapshot();

      expect(metricsCollector.getSnapshots().length).toBe(initialSnapshots + 1);
    });
  });

  describe("Duration Formatting", () => {
    it("should format durations correctly", () => {
      // Test private method through report generation
      metricsCollector.recordConversion(true, 1000);

      const report = reporter.generateReport();

      // The uptime should be formatted appropriately
      expect(report).toMatch(/Uptime: \d+(\.\d+)?(ms|s|m|h)/);
    });
  });
});

describe("Exported Utility Functions", () => {
  beforeEach(() => {
    metricsCollector.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should export utility functions", async () => {
    const {
      logCurrentMetrics,
      getHealthStatus,
      getRecentPerformance,
      generateMetricsReport,
      generateJSONMetricsReport,
    } = await import("../metrics-reporter");

    expect(typeof logCurrentMetrics).toBe("function");
    expect(typeof getHealthStatus).toBe("function");
    expect(typeof getRecentPerformance).toBe("function");
    expect(typeof generateMetricsReport).toBe("function");
    expect(typeof generateJSONMetricsReport).toBe("function");
  });

  it("should work with utility functions", async () => {
    const {
      getHealthStatus,
      getRecentPerformance,
      generateMetricsReport,
      generateJSONMetricsReport,
    } = await import("../metrics-reporter");

    // Add some test data
    metricsCollector.recordConversion(true, 1000);

    const health = getHealthStatus();
    expect(health).toHaveProperty("healthy");

    const recent = getRecentPerformance();
    expect(recent).toHaveProperty("period");

    const textReport = generateMetricsReport();
    expect(typeof textReport).toBe("string");

    const jsonReport = generateJSONMetricsReport();
    expect(typeof jsonReport).toBe("object");
  });
});

describe("Singleton Instance", () => {
  it("should provide a singleton metrics reporter", () => {
    expect(metricsReporter).toBeInstanceOf(MetricsReporter);
  });

  it("should maintain state across calls", () => {
    metricsCollector.recordConversion(true, 1000);

    const report1 = metricsReporter.generateJSONReport();
    const report2 = metricsReporter.generateJSONReport();

    expect((report1 as any).overview.totalConversions).toBe(
      (report2 as any).overview.totalConversions
    );
  });
});

describe("Edge Cases", () => {
  let reporter: MetricsReporter;

  beforeEach(() => {
    reporter = new MetricsReporter();
  });

  it("should handle empty metrics gracefully", () => {
    metricsCollector.reset();

    const report = reporter.generateReport();
    expect(report).toContain("Total Conversions: 0");
    expect(report).toContain("Success Rate: 0.00%");

    const jsonReport = reporter.generateJSONReport();
    expect((jsonReport as any).overview.totalConversions).toBe(0);
  });

  it("should handle health check with no data", () => {
    metricsCollector.reset();

    const health = reporter.checkHealth();
    expect(health.healthy).toBe(true); // No issues when no data
    expect(health.issues).toHaveLength(0);
  });

  it("should handle recent stats with no snapshots", () => {
    metricsCollector.reset();

    const stats = reporter.getRecentStats(60);
    expect(stats.conversions).toBe(0);
    expect(stats.successRate).toBe(0);
    expect(stats.averageTime).toBe(0);
    expect(stats.errorRate).toBe(0);
  });
});

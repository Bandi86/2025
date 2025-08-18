/**
 * Metrics Reporter
 * Provides formatted reports and statistics for the PDF conversion system
 */

import { metricsCollector } from "./metrics";
import { logger } from "./logger";

/**
 * Metrics Reporter class for generating formatted reports
 */
export class MetricsReporter {
  /**
   * Generate a comprehensive metrics report
   */
  generateReport(): string {
    const summary = metricsCollector.getSummary();
    const snapshot = metricsCollector.getSnapshot();

    const report = `
PDF Converter Metrics Report
============================
Generated: ${new Date().toISOString()}
Uptime: ${this.formatDuration(snapshot.uptime)}

OVERVIEW
--------
Total Conversions: ${summary.overview.totalConversions}
Success Rate: ${summary.overview.successRate.toFixed(2)}%
Average Processing Time: ${summary.overview.averageProcessingTime.toFixed(0)}ms

PERFORMANCE
-----------
Memory Usage: ${summary.performance.memoryUsage}
Average Step Times:
  - PDF Extraction: ${summary.performance.averageStepTimes.pdfExtraction.toFixed(0)}ms
  - AI Analysis: ${summary.performance.averageStepTimes.aiAnalysis.toFixed(0)}ms
  - JSON Generation: ${summary.performance.averageStepTimes.jsonGeneration.toFixed(0)}ms

AI SERVICE
----------
Total Requests: ${summary.aiService.totalRequests}
Average Response Time: ${summary.aiService.averageResponseTime.toFixed(0)}ms
Failure Rate: ${summary.aiService.failureRate.toFixed(2)}%

ERRORS
------
Total Errors: ${summary.errors.totalErrors}
Error Rate: ${summary.errors.errorRate.toFixed(2)}%
Top Errors:
${summary.errors.topErrors.map((e) => `  - ${e.code}: ${e.count} occurrences`).join("\n")}

BATCH PROCESSING
---------------
Total Batches: ${snapshot.batchProcessing.totalBatches}
Total Files Processed: ${snapshot.batchProcessing.totalFilesProcessed}
Average Batch Size: ${snapshot.batchProcessing.averageBatchSize.toFixed(1)}
Batch Success Rate: ${snapshot.batchProcessing.batchSuccessRate.toFixed(2)}%
`;

    return report.trim();
  }

  /**
   * Generate a JSON metrics report
   */
  generateJSONReport(): object {
    const summary = metricsCollector.getSummary();
    const snapshot = metricsCollector.getSnapshot();

    return {
      timestamp: new Date().toISOString(),
      uptime: snapshot.uptime,
      overview: summary.overview,
      performance: {
        ...summary.performance,
        memoryUsage: snapshot.performance.memoryUsage.current,
        cpuUsage: snapshot.performance.cpuUsage,
      },
      aiService: summary.aiService,
      errors: summary.errors,
      batchProcessing: snapshot.batchProcessing,
    };
  }

  /**
   * Log current metrics to console
   */
  logMetrics(): void {
    const report = this.generateReport();
    logger.info("Current system metrics", {
      component: "MetricsReporter",
      operation: "logMetrics",
      metadata: { reportLength: report.length },
    });
    console.log("\n" + report + "\n");
  }

  /**
   * Get performance statistics for the last N minutes
   */
  getRecentStats(minutes: number = 60): {
    period: string;
    conversions: number;
    successRate: number;
    averageTime: number;
    errorRate: number;
  } {
    const stats = metricsCollector.getStatistics(minutes);

    return {
      period: `Last ${minutes} minutes`,
      conversions: stats.conversionsInPeriod,
      successRate: stats.successRate,
      averageTime: stats.averageProcessingTime,
      errorRate: stats.errorRate,
    };
  }

  /**
   * Check if system performance is healthy
   */
  checkHealth(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const summary = metricsCollector.getSummary();
    const snapshot = metricsCollector.getSnapshot();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check success rate
    if (
      summary.overview.successRate < 90 &&
      summary.overview.totalConversions > 10
    ) {
      issues.push(
        `Low success rate: ${summary.overview.successRate.toFixed(2)}%`
      );
      recommendations.push(
        "Investigate common error patterns and improve error handling"
      );
    }

    // Check AI service performance
    if (
      summary.aiService.failureRate > 20 &&
      summary.aiService.totalRequests > 5
    ) {
      issues.push(
        `High AI service failure rate: ${summary.aiService.failureRate.toFixed(2)}%`
      );
      recommendations.push(
        "Check AI service connectivity and timeout settings"
      );
    }

    // Check processing times
    if (summary.overview.averageProcessingTime > 30000) {
      // 30 seconds
      issues.push(
        `Slow processing times: ${summary.overview.averageProcessingTime.toFixed(0)}ms average`
      );
      recommendations.push(
        "Consider optimizing PDF processing or AI analysis steps"
      );
    }

    // Check memory usage
    const memoryUsageMB =
      snapshot.performance.memoryUsage.current.heapUsed / (1024 * 1024);
    if (memoryUsageMB > 500) {
      // 500MB
      issues.push(`High memory usage: ${memoryUsageMB.toFixed(0)}MB`);
      recommendations.push(
        "Monitor for memory leaks and consider garbage collection optimization"
      );
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    metricsCollector.reset();
    logger.info("Metrics have been reset", {
      component: "MetricsReporter",
      operation: "resetMetrics",
    });
  }

  /**
   * Take a metrics snapshot
   */
  takeSnapshot(): void {
    const snapshot = metricsCollector.takeSnapshot();
    logger.info("Metrics snapshot taken", {
      component: "MetricsReporter",
      operation: "takeSnapshot",
      metadata: {
        timestamp: snapshot.timestamp,
        totalConversions: snapshot.conversion.totalConversions,
      },
    });
  }

  /**
   * Format duration in milliseconds to human readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }
}

// Export singleton instance
export const metricsReporter = new MetricsReporter();

// Utility functions for common operations
export const logCurrentMetrics = () => metricsReporter.logMetrics();
export const getHealthStatus = () => metricsReporter.checkHealth();
export const getRecentPerformance = (minutes?: number) =>
  metricsReporter.getRecentStats(minutes);
export const generateMetricsReport = () => metricsReporter.generateReport();
export const generateJSONMetricsReport = () =>
  metricsReporter.generateJSONReport();

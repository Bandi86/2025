/**
 * Processing Metrics Collection System
 * Tracks conversion success rates, processing times, and AI service performance
 */

import { ErrorCode, ProcessingStep } from "./types";

// Metrics interfaces
export interface ConversionMetrics {
  totalConversions: number;
  successfulConversions: number;
  failedConversions: number;
  successRate: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
}

export interface AIServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalResponseTime: number;
  timeouts: number;
  connectionFailures: number;
}

export interface BatchProcessingMetrics {
  totalBatches: number;
  totalFilesProcessed: number;
  averageBatchSize: number;
  averageBatchProcessingTime: number;
  batchSuccessRate: number;
}

export interface ErrorMetrics {
  errorCounts: Record<ErrorCode, number>;
  errorsByStep: Record<ProcessingStep, number>;
  totalErrors: number;
  mostCommonError: ErrorCode | null;
  mostProblematicStep: ProcessingStep | null;
}

export interface PerformanceMetrics {
  memoryUsage: {
    current: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
    average: NodeJS.MemoryUsage;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  processingTimes: {
    pdfExtraction: number[];
    aiAnalysis: number[];
    jsonGeneration: number[];
    total: number[];
  };
}

export interface MetricsSnapshot {
  timestamp: string;
  conversion: ConversionMetrics;
  aiService: AIServiceMetrics;
  batchProcessing: BatchProcessingMetrics;
  errors: ErrorMetrics;
  performance: PerformanceMetrics;
  uptime: number;
}

/**
 * Metrics Collector class
 */
export class MetricsCollector {
  private conversionMetrics: ConversionMetrics;
  private aiServiceMetrics: AIServiceMetrics;
  private batchProcessingMetrics: BatchProcessingMetrics;
  private errorMetrics: ErrorMetrics;
  private performanceMetrics: PerformanceMetrics;
  private startTime: number;
  private snapshots: MetricsSnapshot[] = [];
  private maxSnapshots: number = 100;

  constructor() {
    this.startTime = Date.now();
    this.initializeMetrics();
  }

  /**
   * Initialize all metrics to default values
   */
  private initializeMetrics(): void {
    this.conversionMetrics = {
      totalConversions: 0,
      successfulConversions: 0,
      failedConversions: 0,
      successRate: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
    };

    this.aiServiceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      timeouts: 0,
      connectionFailures: 0,
    };

    this.batchProcessingMetrics = {
      totalBatches: 0,
      totalFilesProcessed: 0,
      averageBatchSize: 0,
      averageBatchProcessingTime: 0,
      batchSuccessRate: 0,
    };

    this.errorMetrics = {
      errorCounts: {} as Record<ErrorCode, number>,
      errorsByStep: {} as Record<ProcessingStep, number>,
      totalErrors: 0,
      mostCommonError: null,
      mostProblematicStep: null,
    };

    this.performanceMetrics = {
      memoryUsage: {
        current: process.memoryUsage(),
        peak: process.memoryUsage(),
        average: process.memoryUsage(),
      },
      cpuUsage: {
        user: 0,
        system: 0,
      },
      processingTimes: {
        pdfExtraction: [],
        aiAnalysis: [],
        jsonGeneration: [],
        total: [],
      },
    };
  }

  /**
   * Record a conversion attempt
   */
  recordConversion(success: boolean, processingTime: number): void {
    this.conversionMetrics.totalConversions++;
    this.conversionMetrics.totalProcessingTime += processingTime;

    if (success) {
      this.conversionMetrics.successfulConversions++;
    } else {
      this.conversionMetrics.failedConversions++;
    }

    // Update success rate
    this.conversionMetrics.successRate =
      (this.conversionMetrics.successfulConversions /
        this.conversionMetrics.totalConversions) *
      100;

    // Update average processing time
    this.conversionMetrics.averageProcessingTime =
      this.conversionMetrics.totalProcessingTime /
      this.conversionMetrics.totalConversions;

    // Record total processing time
    this.performanceMetrics.processingTimes.total.push(processingTime);
  }

  /**
   * Record AI service request
   */
  recordAIServiceRequest(
    success: boolean,
    responseTime: number,
    errorType?: "timeout" | "connection"
  ): void {
    this.aiServiceMetrics.totalRequests++;
    this.aiServiceMetrics.totalResponseTime += responseTime;

    if (success) {
      this.aiServiceMetrics.successfulRequests++;
    } else {
      this.aiServiceMetrics.failedRequests++;

      if (errorType === "timeout") {
        this.aiServiceMetrics.timeouts++;
      } else if (errorType === "connection") {
        this.aiServiceMetrics.connectionFailures++;
      }
    }

    // Update average response time
    this.aiServiceMetrics.averageResponseTime =
      this.aiServiceMetrics.totalResponseTime /
      this.aiServiceMetrics.totalRequests;

    // Record AI analysis time
    this.performanceMetrics.processingTimes.aiAnalysis.push(responseTime);
  }

  /**
   * Record batch processing
   */
  recordBatchProcessing(
    batchSize: number,
    processingTime: number,
    successCount: number
  ): void {
    this.batchProcessingMetrics.totalBatches++;
    this.batchProcessingMetrics.totalFilesProcessed += batchSize;

    // Update average batch size
    this.batchProcessingMetrics.averageBatchSize =
      this.batchProcessingMetrics.totalFilesProcessed /
      this.batchProcessingMetrics.totalBatches;

    // Update average batch processing time
    const totalBatchTime =
      this.batchProcessingMetrics.averageBatchProcessingTime *
        (this.batchProcessingMetrics.totalBatches - 1) +
      processingTime;
    this.batchProcessingMetrics.averageBatchProcessingTime =
      totalBatchTime / this.batchProcessingMetrics.totalBatches;

    // Update batch success rate
    const totalSuccessful =
      (this.batchProcessingMetrics.batchSuccessRate / 100) *
        (this.batchProcessingMetrics.totalFilesProcessed - batchSize) +
      successCount;
    this.batchProcessingMetrics.batchSuccessRate =
      (totalSuccessful / this.batchProcessingMetrics.totalFilesProcessed) * 100;
  }

  /**
   * Record an error
   */
  recordError(errorCode: ErrorCode, processingStep: ProcessingStep): void {
    this.errorMetrics.totalErrors++;

    // Update error counts
    this.errorMetrics.errorCounts[errorCode] =
      (this.errorMetrics.errorCounts[errorCode] || 0) + 1;
    this.errorMetrics.errorsByStep[processingStep] =
      (this.errorMetrics.errorsByStep[processingStep] || 0) + 1;

    // Update most common error
    this.errorMetrics.mostCommonError = this.getMostCommonError();
    this.errorMetrics.mostProblematicStep = this.getMostProblematicStep();
  }

  /**
   * Record processing step timing
   */
  recordStepTiming(step: ProcessingStep, duration: number): void {
    switch (step) {
      case ProcessingStep.PDF_EXTRACTION:
        this.performanceMetrics.processingTimes.pdfExtraction.push(duration);
        break;
      case ProcessingStep.AI_ANALYSIS:
        this.performanceMetrics.processingTimes.aiAnalysis.push(duration);
        break;
      case ProcessingStep.JSON_GENERATION:
        this.performanceMetrics.processingTimes.jsonGeneration.push(duration);
        break;
    }
  }

  /**
   * Update memory usage metrics
   */
  updateMemoryUsage(): void {
    const current = process.memoryUsage();
    this.performanceMetrics.memoryUsage.current = current;

    // Update peak memory usage
    const peak = this.performanceMetrics.memoryUsage.peak;
    if (current.heapUsed > peak.heapUsed) {
      this.performanceMetrics.memoryUsage.peak = current;
    }

    // Update average memory usage (simple moving average)
    const avg = this.performanceMetrics.memoryUsage.average;
    const alpha = 0.1; // Smoothing factor
    this.performanceMetrics.memoryUsage.average = {
      rss: avg.rss * (1 - alpha) + current.rss * alpha,
      heapTotal: avg.heapTotal * (1 - alpha) + current.heapTotal * alpha,
      heapUsed: avg.heapUsed * (1 - alpha) + current.heapUsed * alpha,
      external: avg.external * (1 - alpha) + current.external * alpha,
      arrayBuffers:
        avg.arrayBuffers * (1 - alpha) + current.arrayBuffers * alpha,
    };
  }

  /**
   * Update CPU usage metrics
   */
  updateCPUUsage(): void {
    const usage = process.cpuUsage();
    this.performanceMetrics.cpuUsage = {
      user: usage.user / 1000000, // Convert to seconds
      system: usage.system / 1000000,
    };
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot(): MetricsSnapshot {
    this.updateMemoryUsage();
    this.updateCPUUsage();

    return {
      timestamp: new Date().toISOString(),
      conversion: { ...this.conversionMetrics },
      aiService: { ...this.aiServiceMetrics },
      batchProcessing: { ...this.batchProcessingMetrics },
      errors: { ...this.errorMetrics },
      performance: { ...this.performanceMetrics },
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Store a metrics snapshot
   */
  takeSnapshot(): MetricsSnapshot {
    const snapshot = this.getSnapshot();
    this.snapshots.push(snapshot);

    // Keep only the most recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    return snapshot;
  }

  /**
   * Get historical snapshots
   */
  getSnapshots(): MetricsSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get metrics summary for reporting
   */
  getSummary(): {
    overview: {
      uptime: number;
      totalConversions: number;
      successRate: number;
      averageProcessingTime: number;
    };
    performance: {
      memoryUsage: string;
      averageStepTimes: Record<string, number>;
    };
    errors: {
      totalErrors: number;
      errorRate: number;
      topErrors: Array<{ code: ErrorCode; count: number }>;
    };
    aiService: {
      totalRequests: number;
      averageResponseTime: number;
      failureRate: number;
    };
  } {
    const snapshot = this.getSnapshot();

    return {
      overview: {
        uptime: snapshot.uptime,
        totalConversions: snapshot.conversion.totalConversions,
        successRate: snapshot.conversion.successRate,
        averageProcessingTime: snapshot.conversion.averageProcessingTime,
      },
      performance: {
        memoryUsage: this.formatBytes(
          snapshot.performance.memoryUsage.current.heapUsed
        ),
        averageStepTimes: {
          pdfExtraction: this.calculateAverage(
            snapshot.performance.processingTimes.pdfExtraction
          ),
          aiAnalysis: this.calculateAverage(
            snapshot.performance.processingTimes.aiAnalysis
          ),
          jsonGeneration: this.calculateAverage(
            snapshot.performance.processingTimes.jsonGeneration
          ),
        },
      },
      errors: {
        totalErrors: snapshot.errors.totalErrors,
        errorRate:
          snapshot.conversion.totalConversions > 0
            ? (snapshot.errors.totalErrors /
                snapshot.conversion.totalConversions) *
              100
            : 0,
        topErrors: this.getTopErrors(5),
      },
      aiService: {
        totalRequests: snapshot.aiService.totalRequests,
        averageResponseTime: snapshot.aiService.averageResponseTime,
        failureRate:
          snapshot.aiService.totalRequests > 0
            ? (snapshot.aiService.failedRequests /
                snapshot.aiService.totalRequests) *
              100
            : 0,
      },
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.startTime = Date.now();
    this.initializeMetrics();
    this.snapshots = [];
  }

  /**
   * Get processing statistics for a specific time period
   */
  getStatistics(periodMinutes: number = 60): {
    conversionsInPeriod: number;
    averageProcessingTime: number;
    successRate: number;
    errorRate: number;
  } {
    const cutoffTime = Date.now() - periodMinutes * 60 * 1000;
    const recentSnapshots = this.snapshots.filter(
      (s) => new Date(s.timestamp).getTime() > cutoffTime
    );

    if (recentSnapshots.length === 0) {
      return {
        conversionsInPeriod: 0,
        averageProcessingTime: 0,
        successRate: 0,
        errorRate: 0,
      };
    }

    const latest = recentSnapshots[recentSnapshots.length - 1];
    const earliest = recentSnapshots[0];

    const conversionsInPeriod =
      latest.conversion.totalConversions - earliest.conversion.totalConversions;
    const successfulInPeriod =
      latest.conversion.successfulConversions -
      earliest.conversion.successfulConversions;
    const errorsInPeriod =
      latest.errors.totalErrors - earliest.errors.totalErrors;

    return {
      conversionsInPeriod,
      averageProcessingTime: latest.conversion.averageProcessingTime,
      successRate:
        conversionsInPeriod > 0
          ? (successfulInPeriod / conversionsInPeriod) * 100
          : 0,
      errorRate:
        conversionsInPeriod > 0
          ? (errorsInPeriod / conversionsInPeriod) * 100
          : 0,
    };
  }

  /**
   * Get most common error
   */
  private getMostCommonError(): ErrorCode | null {
    const errors = Object.entries(this.errorMetrics.errorCounts);
    if (errors.length === 0) return null;

    return errors.reduce((max, current) =>
      current[1] > max[1] ? current : max
    )[0] as ErrorCode;
  }

  /**
   * Get most problematic processing step
   */
  private getMostProblematicStep(): ProcessingStep | null {
    const steps = Object.entries(this.errorMetrics.errorsByStep);
    if (steps.length === 0) return null;

    return steps.reduce((max, current) =>
      current[1] > max[1] ? current : max
    )[0] as ProcessingStep;
  }

  /**
   * Get top errors by count
   */
  private getTopErrors(
    limit: number
  ): Array<{ code: ErrorCode; count: number }> {
    return Object.entries(this.errorMetrics.errorCounts)
      .map(([code, count]) => ({ code: code as ErrorCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Calculate average of an array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }
}

// Global metrics collector instance
export const metricsCollector = new MetricsCollector();

// Utility functions for common metrics operations
export const recordConversionSuccess = (processingTime: number) => {
  metricsCollector.recordConversion(true, processingTime);
};

export const recordConversionFailure = (processingTime: number) => {
  metricsCollector.recordConversion(false, processingTime);
};

export const recordAISuccess = (responseTime: number) => {
  metricsCollector.recordAIServiceRequest(true, responseTime);
};

export const recordAIFailure = (
  responseTime: number,
  errorType?: "timeout" | "connection"
) => {
  metricsCollector.recordAIServiceRequest(false, responseTime, errorType);
};

export const recordError = (errorCode: ErrorCode, step: ProcessingStep) => {
  metricsCollector.recordError(errorCode, step);
};

export const recordStepTiming = (step: ProcessingStep, duration: number) => {
  metricsCollector.recordStepTiming(step, duration);
};

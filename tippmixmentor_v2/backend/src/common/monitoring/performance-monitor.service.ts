import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export interface DatabaseMetric {
  query: string;
  executionTime: number;
  timestamp: Date;
  table?: string;
  operation?: string;
}

export interface PerformanceStats {
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
  throughput: number;
  slowQueries: number;
  cacheHitRate: number;
}

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly metrics: PerformanceMetric[] = [];
  private readonly dbMetrics: DatabaseMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Track API request performance
   */
  trackRequest(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow requests
    if (metric.responseTime > 1000) { // > 1 second
      this.logger.warn(`Slow request detected: ${metric.method} ${metric.endpoint} - ${metric.responseTime}ms`);
    }

    // Log errors
    if (metric.statusCode >= 400) {
      this.logger.error(`Error request: ${metric.method} ${metric.endpoint} - ${metric.statusCode}`);
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(metric: DatabaseMetric): void {
    this.dbMetrics.push(metric);
    
    // Keep only the last maxMetrics
    if (this.dbMetrics.length > this.maxMetrics) {
      this.dbMetrics.shift();
    }

    // Log slow queries
    if (metric.executionTime > 100) { // > 100ms
      this.logger.warn(`Slow query detected: ${metric.query} - ${metric.executionTime}ms`);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(timeWindow: number = 3600000): PerformanceStats { // Default 1 hour
    const now = new Date();
    const cutoff = new Date(now.getTime() - timeWindow);
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    const recentDbMetrics = this.dbMetrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        throughput: 0,
        slowQueries: 0,
        cacheHitRate: 0,
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;
    const throughput = totalRequests / (timeWindow / 1000); // requests per second
    const slowQueries = recentDbMetrics.filter(m => m.executionTime > 100).length;

    return {
      averageResponseTime,
      totalRequests,
      errorRate,
      throughput,
      slowQueries,
      cacheHitRate: 0, // Will be calculated from cache service
    };
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit: number = 10): Array<{ endpoint: string; averageTime: number; count: number }> {
    const endpointStats = new Map<string, { totalTime: number; count: number }>();

    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0 };
      
      endpointStats.set(key, {
        totalTime: existing.totalTime + metric.responseTime,
        count: existing.count + 1,
      });
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.totalTime / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit);
  }

  /**
   * Get slowest database queries
   */
  getSlowestQueries(limit: number = 10): Array<{ query: string; averageTime: number; count: number }> {
    const queryStats = new Map<string, { totalTime: number; count: number }>();

    this.dbMetrics.forEach(metric => {
      const existing = queryStats.get(metric.query) || { totalTime: 0, count: 0 };
      
      queryStats.set(metric.query, {
        totalTime: existing.totalTime + metric.executionTime,
        count: existing.count + 1,
      });
    });

    return Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        averageTime: stats.totalTime / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit);
  }

  /**
   * Get error rate by endpoint
   */
  getErrorRateByEndpoint(): Array<{ endpoint: string; errorRate: number; totalRequests: number }> {
    const endpointStats = new Map<string, { errors: number; total: number }>();

    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { errors: 0, total: 0 };
      
      endpointStats.set(key, {
        errors: existing.errors + (metric.statusCode >= 400 ? 1 : 0),
        total: existing.total + 1,
      });
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        errorRate: (stats.errors / stats.total) * 100,
        totalRequests: stats.total,
      }))
      .sort((a, b) => b.errorRate - a.errorRate);
  }

  /**
   * Get real-time performance alerts
   */
  getPerformanceAlerts(): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];
    const stats = this.getPerformanceStats(300000); // Last 5 minutes

    // High error rate alert
    if (stats.errorRate > 10) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `Error rate is ${stats.errorRate.toFixed(2)}%`,
        severity: 'high',
      });
    }

    // Slow response time alert
    if (stats.averageResponseTime > 2000) {
      alerts.push({
        type: 'SLOW_RESPONSE_TIME',
        message: `Average response time is ${stats.averageResponseTime.toFixed(2)}ms`,
        severity: 'medium',
      });
    }

    // High throughput alert
    if (stats.throughput > 100) {
      alerts.push({
        type: 'HIGH_THROUGHPUT',
        message: `High throughput detected: ${stats.throughput.toFixed(2)} req/s`,
        severity: 'low',
      });
    }

    // Slow queries alert
    if (stats.slowQueries > 10) {
      alerts.push({
        type: 'SLOW_QUERIES',
        message: `${stats.slowQueries} slow queries detected`,
        severity: 'medium',
      });
    }

    return alerts;
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): {
    metrics: PerformanceMetric[];
    dbMetrics: DatabaseMetric[];
    stats: PerformanceStats;
  } {
    return {
      metrics: [...this.metrics],
      dbMetrics: [...this.dbMetrics],
      stats: this.getPerformanceStats(),
    };
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoff = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    
    const initialMetricsCount = this.metrics.length;
    const initialDbMetricsCount = this.dbMetrics.length;

    // Remove old metrics
    while (this.metrics.length > 0 && this.metrics[0].timestamp < cutoff) {
      this.metrics.shift();
    }

    while (this.dbMetrics.length > 0 && this.dbMetrics[0].timestamp < cutoff) {
      this.dbMetrics.shift();
    }

    const removedMetrics = initialMetricsCount - this.metrics.length;
    const removedDbMetrics = initialDbMetricsCount - this.dbMetrics.length;

    if (removedMetrics > 0 || removedDbMetrics > 0) {
      this.logger.log(`Cleared ${removedMetrics} old metrics and ${removedDbMetrics} old DB metrics`);
    }
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): Array<{ category: string; recommendation: string; priority: 'low' | 'medium' | 'high' }> {
    const recommendations: Array<{ category: string; recommendation: string; priority: 'low' | 'medium' | 'high' }> = [];
    const stats = this.getPerformanceStats();
    const slowestEndpoints = this.getSlowestEndpoints(5);
    const slowestQueries = this.getSlowestQueries(5);

    // Response time recommendations
    if (stats.averageResponseTime > 1000) {
      recommendations.push({
        category: 'Response Time',
        recommendation: 'Consider implementing caching for frequently accessed endpoints',
        priority: 'high',
      });
    }

    // Error rate recommendations
    if (stats.errorRate > 5) {
      recommendations.push({
        category: 'Error Rate',
        recommendation: 'Investigate and fix endpoints with high error rates',
        priority: 'high',
      });
    }

    // Database recommendations
    if (slowestQueries.length > 0 && slowestQueries[0].averageTime > 500) {
      recommendations.push({
        category: 'Database',
        recommendation: 'Optimize slow database queries and consider adding indexes',
        priority: 'medium',
      });
    }

    // Caching recommendations
    if (stats.cacheHitRate < 50) {
      recommendations.push({
        category: 'Caching',
        recommendation: 'Implement caching for frequently accessed data',
        priority: 'medium',
      });
    }

    // Throughput recommendations
    if (stats.throughput > 50) {
      recommendations.push({
        category: 'Scalability',
        recommendation: 'Consider horizontal scaling or load balancing',
        priority: 'low',
      });
    }

    return recommendations;
  }
} 
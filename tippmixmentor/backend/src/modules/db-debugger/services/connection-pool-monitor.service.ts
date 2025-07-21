import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import {
  ConnectionPoolMetrics,
  DatabaseEvent,
  DatabaseAlert,
  PerformanceBottleneck,
} from '../interfaces/monitoring.interfaces';
import { DatabaseAdapter } from '../interfaces/database-adapters.interface';
import { DbDebuggerConfig } from '../config/debugger.config';

@Injectable()
export class ConnectionPoolMonitorService {
  private readonly logger = new Logger(ConnectionPoolMonitorService.name);
  private metricsHistory: ConnectionPoolMetrics[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastAlertTime = new Map<string, Date>();

  constructor(private readonly eventEmitter: EventEmitter) {}

  async startMonitoring(
    adapter: DatabaseAdapter,
    config: DbDebuggerConfig,
  ): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Connection pool monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    this.logger.log('Starting connection pool monitoring...');

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics(adapter, config);
      } catch (error) {
        this.logger.error('Error collecting connection pool metrics:', error);
      }
    }, 5000); // Check every 5 seconds

    this.logger.log('Connection pool monitoring started');
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.logger.log('Connection pool monitoring stopped');
  }

  private async collectMetrics(
    adapter: DatabaseAdapter,
    config: DbDebuggerConfig,
  ): Promise<void> {
    try {
      const metrics = await adapter.getConnectionPoolMetrics();
      this.addToHistory(metrics);

      // Check for alerts
      await this.checkAlerts(metrics, config);

      // Check for performance bottlenecks
      const bottlenecks = this.identifyBottlenecks(metrics);
      if (bottlenecks.length > 0) {
        this.eventEmitter.emit('connection_pool.bottlenecks', {
          bottlenecks,
          metrics,
        });
      }

      // Emit metrics update event
      this.eventEmitter.emit('connection_pool.metrics_update', {
        type: 'metrics_update',
        timestamp: metrics.timestamp,
        data: metrics,
      } as DatabaseEvent);
    } catch (error) {
      this.logger.error('Failed to collect connection pool metrics:', error);
    }
  }

  private addToHistory(metrics: ConnectionPoolMetrics): void {
    this.metricsHistory.push(metrics);

    // Keep only last 1000 metrics in memory (about 1.4 hours at 5-second intervals)
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }
  }

  private async checkAlerts(
    metrics: ConnectionPoolMetrics,
    config: DbDebuggerConfig,
  ): Promise<void> {
    const alertThreshold =
      config.monitoring.connectionPoolMonitoring.alertThreshold;
    const now = new Date();

    // High utilization alert
    if (metrics.connectionUtilization >= alertThreshold) {
      const alertKey = 'high_utilization';
      const lastAlert = this.lastAlertTime.get(alertKey);

      // Only alert if we haven't alerted in the last 5 minutes
      if (!lastAlert || now.getTime() - lastAlert.getTime() > 5 * 60 * 1000) {
        const alert: DatabaseAlert = {
          id: `conn_pool_${Date.now()}`,
          ruleId: 'connection-pool-utilization',
          ruleName: 'High Connection Pool Utilization',
          severity:
            metrics.connectionUtilization >= 95 ? 'critical' : 'warning',
          message: `Connection pool utilization is ${metrics.connectionUtilization}% (${metrics.activeConnections}/${metrics.maxConnections})`,
          timestamp: now,
          resolved: false,
          metadata: {
            utilization: metrics.connectionUtilization,
            activeConnections: metrics.activeConnections,
            maxConnections: metrics.maxConnections,
            threshold: alertThreshold,
          },
        };

        this.eventEmitter.emit('alert', {
          type: 'alert',
          timestamp: now,
          data: alert,
        } as DatabaseEvent);

        this.lastAlertTime.set(alertKey, now);
        this.logger.warn(`Connection pool alert: ${alert.message}`);
      }
    }

    // Connection errors alert
    if (metrics.connectionErrors > 0) {
      const alertKey = 'connection_errors';
      const lastAlert = this.lastAlertTime.get(alertKey);

      if (!lastAlert || now.getTime() - lastAlert.getTime() > 2 * 60 * 1000) {
        const alert: DatabaseAlert = {
          id: `conn_errors_${Date.now()}`,
          ruleId: 'connection-errors',
          ruleName: 'Connection Errors Detected',
          severity: 'error',
          message: `${metrics.connectionErrors} connection errors detected`,
          timestamp: now,
          resolved: false,
          metadata: {
            connectionErrors: metrics.connectionErrors,
            connectionTimeouts: metrics.connectionTimeouts,
          },
        };

        this.eventEmitter.emit('alert', {
          type: 'alert',
          timestamp: now,
          data: alert,
        } as DatabaseEvent);

        this.lastAlertTime.set(alertKey, now);
        this.logger.error(`Connection errors alert: ${alert.message}`);
      }
    }

    // Connection timeouts alert
    if (metrics.connectionTimeouts > 0) {
      const alertKey = 'connection_timeouts';
      const lastAlert = this.lastAlertTime.get(alertKey);

      if (!lastAlert || now.getTime() - lastAlert.getTime() > 2 * 60 * 1000) {
        const alert: DatabaseAlert = {
          id: `conn_timeouts_${Date.now()}`,
          ruleId: 'connection-timeouts',
          ruleName: 'Connection Timeouts Detected',
          severity: 'warning',
          message: `${metrics.connectionTimeouts} connection timeouts detected`,
          timestamp: now,
          resolved: false,
          metadata: {
            connectionTimeouts: metrics.connectionTimeouts,
            connectionErrors: metrics.connectionErrors,
          },
        };

        this.eventEmitter.emit('alert', {
          type: 'alert',
          timestamp: now,
          data: alert,
        } as DatabaseEvent);

        this.lastAlertTime.set(alertKey, now);
        this.logger.warn(`Connection timeouts alert: ${alert.message}`);
      }
    }
  }

  private identifyBottlenecks(
    metrics: ConnectionPoolMetrics,
  ): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];
    const now = new Date();

    // High utilization bottleneck
    if (metrics.connectionUtilization >= 90) {
      bottlenecks.push({
        type: 'connection_pool',
        severity: metrics.connectionUtilization >= 95 ? 'critical' : 'high',
        description: `Connection pool utilization is ${metrics.connectionUtilization}%`,
        suggestedFix:
          'Consider increasing max_connections or optimizing query performance',
        impact: Math.min(10, Math.floor(metrics.connectionUtilization / 10)),
        frequency: 1,
        firstSeen: now,
        lastSeen: now,
      });
    }

    // Too many waiting connections
    if (metrics.waitingConnections > metrics.maxConnections * 0.1) {
      bottlenecks.push({
        type: 'connection_pool',
        severity: 'medium',
        description: `${metrics.waitingConnections} connections are waiting for available connections`,
        suggestedFix:
          'Increase connection pool size or optimize long-running queries',
        impact: 6,
        frequency: 1,
        firstSeen: now,
        lastSeen: now,
      });
    }

    // High connection errors
    if (metrics.connectionErrors > 0) {
      bottlenecks.push({
        type: 'connection_pool',
        severity: 'high',
        description: `${metrics.connectionErrors} connection errors detected`,
        suggestedFix: 'Check database connectivity and network issues',
        impact: 8,
        frequency: metrics.connectionErrors,
        firstSeen: now,
        lastSeen: now,
      });
    }

    return bottlenecks;
  }

  // Public methods for accessing monitoring data
  getCurrentMetrics(): ConnectionPoolMetrics | null {
    return this.metricsHistory.length > 0
      ? this.metricsHistory[this.metricsHistory.length - 1]
      : null;
  }

  getMetricsHistory(limit = 100): ConnectionPoolMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  getConnectionPoolStatistics(): {
    averageUtilization: number;
    peakUtilization: number;
    averageActiveConnections: number;
    peakActiveConnections: number;
    totalErrors: number;
    totalTimeouts: number;
    uptimePercentage: number;
  } {
    if (this.metricsHistory.length === 0) {
      return {
        averageUtilization: 0,
        peakUtilization: 0,
        averageActiveConnections: 0,
        peakActiveConnections: 0,
        totalErrors: 0,
        totalTimeouts: 0,
        uptimePercentage: 100,
      };
    }

    const totalUtilization = this.metricsHistory.reduce(
      (sum, m) => sum + m.connectionUtilization,
      0,
    );
    const totalActiveConnections = this.metricsHistory.reduce(
      (sum, m) => sum + m.activeConnections,
      0,
    );
    const totalErrors = this.metricsHistory.reduce(
      (sum, m) => sum + m.connectionErrors,
      0,
    );
    const totalTimeouts = this.metricsHistory.reduce(
      (sum, m) => sum + m.connectionTimeouts,
      0,
    );

    const peakUtilization = Math.max(
      ...this.metricsHistory.map((m) => m.connectionUtilization),
    );
    const peakActiveConnections = Math.max(
      ...this.metricsHistory.map((m) => m.activeConnections),
    );

    const averageUtilization = totalUtilization / this.metricsHistory.length;
    const averageActiveConnections =
      totalActiveConnections / this.metricsHistory.length;

    // Calculate uptime percentage (assuming errors indicate downtime)
    const errorCount = this.metricsHistory.filter(
      (m) => m.connectionErrors > 0,
    ).length;
    const uptimePercentage =
      ((this.metricsHistory.length - errorCount) / this.metricsHistory.length) *
      100;

    return {
      averageUtilization: Math.round(averageUtilization * 100) / 100,
      peakUtilization,
      averageActiveConnections:
        Math.round(averageActiveConnections * 100) / 100,
      peakActiveConnections,
      totalErrors,
      totalTimeouts,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    };
  }

  getUtilizationTrend(minutes = 30): {
    timestamps: Date[];
    utilization: number[];
    activeConnections: number[];
  } {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    const recentMetrics = this.metricsHistory.filter(
      (m) => m.timestamp >= cutoffTime,
    );

    return {
      timestamps: recentMetrics.map((m) => m.timestamp),
      utilization: recentMetrics.map((m) => m.connectionUtilization),
      activeConnections: recentMetrics.map((m) => m.activeConnections),
    };
  }

  async getConnectionPoolHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) {
      return {
        status: 'critical',
        score: 0,
        issues: ['No connection pool metrics available'],
        recommendations: ['Check database connectivity'],
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check utilization
    if (currentMetrics.connectionUtilization >= 95) {
      issues.push(
        `Critical utilization: ${currentMetrics.connectionUtilization}%`,
      );
      recommendations.push(
        'Immediately increase max_connections or scale database',
      );
      score -= 40;
    } else if (currentMetrics.connectionUtilization >= 80) {
      issues.push(`High utilization: ${currentMetrics.connectionUtilization}%`);
      recommendations.push('Consider increasing max_connections');
      score -= 20;
    }

    // Check waiting connections
    if (currentMetrics.waitingConnections > 0) {
      issues.push(`${currentMetrics.waitingConnections} connections waiting`);
      recommendations.push(
        'Optimize long-running queries or increase pool size',
      );
      score -= 15;
    }

    // Check errors
    if (currentMetrics.connectionErrors > 0) {
      issues.push(`${currentMetrics.connectionErrors} connection errors`);
      recommendations.push('Check database connectivity and network');
      score -= 25;
    }

    // Check timeouts
    if (currentMetrics.connectionTimeouts > 0) {
      issues.push(`${currentMetrics.connectionTimeouts} connection timeouts`);
      recommendations.push(
        'Check network latency and connection timeout settings',
      );
      score -= 10;
    }

    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) status = 'healthy';
    else if (score >= 60) status = 'warning';
    else status = 'critical';

    if (issues.length === 0) {
      recommendations.push('Connection pool is operating normally');
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  }

  clearHistory(): void {
    this.metricsHistory = [];
    this.lastAlertTime.clear();
    this.logger.log('Connection pool metrics history cleared');
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

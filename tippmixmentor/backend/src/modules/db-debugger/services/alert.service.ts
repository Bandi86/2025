import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import {
  AlertRule,
  DatabaseAlert,
  DatabaseEvent,
  QueryMetrics,
  ConnectionPoolMetrics,
  DatabaseMemoryMetrics,
  DeadlockInfo,
} from '../interfaces/monitoring.interfaces';
import { DbDebuggerConfig, WebhookConfig } from '../config/debugger.config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private activeAlerts = new Map<string, DatabaseAlert>();
  private alertHistory: DatabaseAlert[] = [];
  private alertRules: AlertRule[] = [];
  private lastRuleExecution = new Map<string, Date>();

  constructor(private readonly eventEmitter: EventEmitter) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for various database events
    this.eventEmitter.on('query.completed', (event: DatabaseEvent) => {
      this.evaluateQueryAlerts(event.data as QueryMetrics);
    });

    this.eventEmitter.on('connection_pool.metrics_update', (event: DatabaseEvent) => {
      this.evaluateConnectionPoolAlerts(event.data as ConnectionPoolMetrics);
    });

    this.eventEmitter.on('memory.metrics_update', (event: DatabaseEvent) => {
      this.evaluateMemoryAlerts(event.data as DatabaseMemoryMetrics);
    });

    this.eventEmitter.on('deadlock.detected', (event: DatabaseEvent) => {
      this.evaluateDeadlockAlerts(event.data as DeadlockInfo);
    });
  }

  async initializeAlertRules(config: DbDebuggerConfig): Promise<void> {
    this.alertRules = config.monitoring.alerting.rules;
    this.logger.log(`Initialized ${this.alertRules.length} alert rules`);
  }

  private async evaluateQueryAlerts(query: QueryMetrics): Promise<void> {
    const queryRules = this.alertRules.filter(rule =>
      rule.type === 'query_time' && rule.enabled
    );

    for (const rule of queryRules) {
      if (this.shouldSkipRule(rule)) continue;

      const shouldAlert = this.evaluateQueryRule(rule, query);
      if (shouldAlert) {
        await this.triggerAlert(rule, {
          queryId: query.id,
          executionTime: query.executionTime,
          query: query.query.substring(0, 200) + (query.query.length > 200 ? '...' : ''),
        });
      }
    }
  }

  private async evaluateConnectionPoolAlerts(metrics: ConnectionPoolMetrics): Promise<void> {
    const poolRules = this.alertRules.filter(rule =>
      rule.type === 'connection_pool' && rule.enabled
    );

    for (const rule of poolRules) {
      if (this.shouldSkipRule(rule)) continue;

      const shouldAlert = this.evaluateConnectionPoolRule(rule, metrics);
      if (shouldAlert) {
        await this.triggerAlert(rule, {
          utilization: metrics.connectionUtilization,
          activeConnections: metrics.activeConnections,
          maxConnections: metrics.maxConnections,
          waitingConnections: metrics.waitingConnections,
        });
      }
    }
  }

  private async evaluateMemoryAlerts(metrics: DatabaseMemoryMetrics): Promise<void> {
    const memoryRules = this.alertRules.filter(rule =>
      rule.type === 'memory' && rule.enabled
    );

    for (const rule of memoryRules) {
      if (this.shouldSkipRule(rule)) continue;

      const shouldAlert = this.evaluateMemoryRule(rule, metrics);
      if (shouldAlert) {
        await this.triggerAlert(rule, {
          memoryUtilization: metrics.memoryUtilization,
          usedMemory: metrics.usedMemory,
          totalMemory: metrics.totalMemory,
        });
      }
    }
  }

  private async evaluateDeadlockAlerts(deadlock: DeadlockInfo): Promise<void> {
    const deadlockRules = this.alertRules.filter(rule =>
      rule.type === 'deadlock' && rule.enabled
    );

    for (const rule of deadlockRules) {
      if (this.shouldSkipRule(rule)) continue;

      // Always alert on deadlocks
      await this.triggerAlert(rule, {
        deadlockId: deadlock.id,
        processCount: deadlock.processes.length,
        resolution: deadlock.resolution,
        victimProcess: deadlock.victimProcess,
      });
    }
  }

  private shouldSkipRule(rule: AlertRule): boolean {
    const lastExecution = this.lastRuleExecution.get(rule.id);
    if (!lastExecution) return false;

    const cooldownMs = rule.cooldown * 60 * 1000; // Convert minutes to milliseconds
    const timeSinceLastExecution = Date.now() - lastExecution.getTime();

    return timeSinceLastExecution < cooldownMs;
  }

  private evaluateQueryRule(rule: AlertRule, query: QueryMetrics): boolean {
    // Simple condition evaluation for query time
    if (rule.condition.includes('execution_time >')) {
      return query.executionTime > rule.threshold;
    }

    if (rule.condition.includes('execution_time >=')) {
      return query.executionTime >= rule.threshold;
    }

    // Add more complex condition evaluation as needed
    return false;
  }

  private evaluateConnectionPoolRule(rule: AlertRule, metrics: ConnectionPoolMetrics): boolean {
    if (rule.condition.includes('utilization >')) {
      return metrics.connectionUtilization > rule.threshold;
    }

    if (rule.condition.includes('utilization >=')) {
      return metrics.connectionUtilization >= rule.threshold;
    }

    if (rule.condition.includes('waiting_connections >')) {
      return metrics.waitingConnections > rule.threshold;
    }

    return false;
  }

  private evaluateMemoryRule(rule: AlertRule, metrics: DatabaseMemoryMetrics): boolean {
    if (rule.condition.includes('memory_utilization >')) {
      return metrics.memoryUtilization > rule.threshold;
    }

    if (rule.condition.includes('memory_utilization >=')) {
      return metrics.memoryUtilization >= rule.threshold;
    }

    return false;
  }

  private async triggerAlert(rule: AlertRule, metadata: Record<string, any>): Promise<void> {
    const alert: DatabaseAlert = {
      id: uuidv4(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, metadata),
      timestamp: new Date(),
      resolved: false,
      metadata,
    };

    // Add to active alerts
    this.activeAlerts.set(alert.id, alert);

    // Add to history
    this.addToHistory(alert);

    // Update last execution time
    this.lastRuleExecution.set(rule.id, new Date());
    rule.lastTriggered = new Date();

    // Execute alert actions
    await this.executeAlertActions(rule, alert);

    // Emit alert event
    this.eventEmitter.emit('alert', {
      type: 'alert',
      timestamp: alert.timestamp,
      data: alert,
    } as DatabaseEvent);

    this.logger.warn(`Alert triggered: ${alert.ruleName} - ${alert.message}`);
  }

  private generateAlertMessage(rule: AlertRule, metadata: Record<string, any>): string {
    switch (rule.type) {
      case 'query_time':
        return `Slow query detected: ${metadata.executionTime}ms execution time (threshold: ${rule.threshold}ms)`;

      case 'connection_pool':
        if (rule.condition.includes('utilization')) {
          return `High connection pool utilization: ${metadata.utilization}% (threshold: ${rule.threshold}%)`;
        }
        if (rule.condition.includes('waiting_connections')) {
          return `Too many waiting connections: ${metadata.waitingConnections} (threshold: ${rule.threshold})`;
        }
        return `Connection pool alert: ${rule.condition}`;

      case 'memory':
        return `High memory usage: ${metadata.memoryUtilization}% (threshold: ${rule.threshold}%)`;

      case 'deadlock':
        return `Deadlock detected involving ${metadata.processCount} processes`;

      case 'custom':
        return `Custom alert: ${rule.name}`;

      default:
        return `Alert: ${rule.name}`;
    }
  }

  private async executeAlertActions(rule: AlertRule, alert: DatabaseAlert): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'log':
            this.executeLogAction(action, alert);
            break;
          case 'email':
            await this.executeEmailAction(action, alert);
            break;
          case 'webhook':
            await this.executeWebhookAction(action, alert);
            break;
          case 'slack':
            await this.executeSlackAction(action, alert);
            break;
          default:
            this.logger.warn(`Unknown alert action type: ${action.type}`);
        }
      } catch (error) {
        this.logger.error(`Failed to execute alert action ${action.type}:`, error);
      }
    }
  }

  private executeLogAction(action: any, alert: DatabaseAlert): void {
    const level = action.config?.level || 'warn';
    const message = `[ALERT] ${alert.ruleName}: ${alert.message}`;

    switch (level) {
      case 'error':
        this.logger.error(message);
        break;
      case 'warn':
        this.logger.warn(message);
        break;
      case 'info':
        this.logger.log(message);
        break;
      default:
        this.logger.log(message);
    }
  }

  private async executeEmailAction(action: any, alert: DatabaseAlert): Promise<void> {
    // Email implementation would go here
    // For now, just log that we would send an email
    this.logger.log(`Would send email alert: ${alert.message} to ${action.config?.recipients}`);
  }

  private async executeWebhookAction(action: any, alert: DatabaseAlert): Promise<void> {
    const webhookUrl = action.config?.url;
    if (!webhookUrl) {
      this.logger.error('Webhook action missing URL configuration');
      return;
    }

    try {
      const payload = {
        alert: {
          id: alert.id,
          ruleName: alert.ruleName,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp,
          metadata: alert.metadata,
        },
        timestamp: new Date().toISOString(),
      };

      // In a real implementation, you would use fetch or axios
      this.logger.log(`Would send webhook to ${webhookUrl} with payload:`, payload);
    } catch (error) {
      this.logger.error(`Failed to send webhook:`, error);
    }
  }

  private async executeSlackAction(action: any, alert: DatabaseAlert): Promise<void> {
    const webhookUrl = action.config?.webhookUrl;
    if (!webhookUrl) {
      this.logger.error('Slack action missing webhook URL configuration');
      return;
    }

    const color = this.getSeverityColor(alert.severity);
    const payload = {
      text: `Database Alert: ${alert.ruleName}`,
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Message',
              value: alert.message,
              short: false,
            },
            {
              title: 'Timestamp',
              value: alert.timestamp.toISOString(),
              short: true,
            },
          ],
        },
      ],
    };

    // In a real implementation, you would use fetch or axios
    this.logger.log(`Would send Slack message:`, payload);
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'good';
      default: return 'warning';
    }
  }

  private addToHistory(alert: DatabaseAlert): void {
    this.alertHistory.push(alert);

    // Keep only last 1000 alerts in memory
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
  }

  // Public methods for managing alerts
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    if (resolvedBy) {
      alert.metadata.resolvedBy = resolvedBy;
    }

    this.activeAlerts.delete(alertId);

    this.eventEmitter.emit('alert.resolved', {
      type: 'alert',
      timestamp: new Date(),
      data: alert,
    } as DatabaseEvent);

    this.logger.log(`Alert resolved: ${alert.id} - ${alert.ruleName}`);
    return true;
  }

  async addAlertRule(rule: AlertRule): Promise<void> {
    this.alertRules.push(rule);
    this.logger.log(`Added new alert rule: ${rule.name}`);
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<boolean> {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      return false;
    }

    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    this.logger.log(`Updated alert rule: ${ruleId}`);
    return true;
  }

  async removeAlertRule(ruleId: string): Promise<boolean> {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      return false;
    }

    this.alertRules.splice(ruleIndex, 1);
    this.lastRuleExecution.delete(ruleId);
    this.logger.log(`Removed alert rule: ${ruleId}`);
    return true;
  }

  getActiveAlerts(): DatabaseAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit = 100): DatabaseAlert[] {
    return this.alertHistory.slice(-limit);
  }

  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  getAlertStatistics(): {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    alertsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
  } {
    const totalAlerts = this.alertHistory.length;
    const activeAlerts = this.activeAlerts.size;
    const resolvedAlerts = this.alertHistory.filter(a => a.resolved).length;

    const alertsByType = this.alertHistory.reduce((acc, alert) => {
      const rule = this.alertRules.find(r => r.id === alert.ruleId);
      const type = rule?.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsBySeverity = this.alertHistory.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      alertsByType,
      alertsBySeverity,
    };
  }

  clearAlertHistory(): void {
    this.alertHistory = [];
    this.activeAlerts.clear();
    this.lastRuleExecution.clear();
    this.logger.log('Alert history cleared');
  }
}
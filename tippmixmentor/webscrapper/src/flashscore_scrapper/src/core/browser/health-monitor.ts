/**
 * Browser Health Monitoring and Automatic Recovery System
 */

import { Browser, Page } from 'playwright';
import { EventEmitter } from 'events';
import { BrowserHealth, BrowserMetrics } from '../../types/browser.js';
import { Logger } from '../logging/index.js';

export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  maxFailures: number;
  recoveryDelay: number;
  enableAutoRestart: boolean;
  enablePageHealthCheck: boolean;
  enableMemoryMonitoring: boolean;
}

export interface HealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  issues: HealthIssue[];
  metrics: BrowserHealth;
}

export interface HealthIssue {
  type: 'connection' | 'memory' | 'performance' | 'pages' | 'timeout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  data?: any;
}

export interface RecoveryAction {
  type: 'restart' | 'cleanup' | 'gc' | 'page_cleanup';
  reason: string;
  timestamp: Date;
  success: boolean;
  error?: Error;
}

export class BrowserHealthMonitor extends EventEmitter {
  private readonly logger: Logger;
  private readonly config: HealthCheckConfig;
  private browser: Browser | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private currentStatus: HealthStatus;
  private recoveryActions: RecoveryAction[] = [];
  private isDestroyed = false;
  private onBrowserRestart?: () => Promise<Browser>;

  constructor(
    config: Partial<HealthCheckConfig> = {},
    logger?: Logger
  ) {
    super();
    
    this.logger = logger || new Logger('BrowserHealthMonitor');
    this.config = {
      interval: 30000, // 30 seconds
      timeout: 10000, // 10 seconds
      maxFailures: 3,
      recoveryDelay: 5000, // 5 seconds
      enableAutoRestart: true,
      enablePageHealthCheck: true,
      enableMemoryMonitoring: true,
      ...config
    };

    this.currentStatus = {
      isHealthy: false,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      issues: [],
      metrics: {
        isResponsive: false,
        memoryUsage: 0,
        pageCount: 0,
        uptime: 0,
        lastActivity: new Date()
      }
    };
  }

  /**
   * Start monitoring a browser instance
   */
  startMonitoring(browser: Browser, onRestart?: () => Promise<Browser>): void {
    if (this.isDestroyed) {
      throw new Error('Health monitor has been destroyed');
    }

    this.browser = browser;
    this.onBrowserRestart = onRestart;
    
    this.setupBrowserEventListeners();
    this.startHealthChecks();
    
    this.logger.info('Browser health monitoring started');
    this.emit('monitoringStarted', { browser });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.browser = null;
    this.onBrowserRestart = undefined;
    
    this.logger.info('Browser health monitoring stopped');
    this.emit('monitoringStopped');
  }

  /**
   * Perform immediate health check
   */
  async performHealthCheck(): Promise<HealthStatus> {
    if (!this.browser) {
      this.updateStatus(false, [{
        type: 'connection',
        severity: 'critical',
        message: 'No browser instance available',
        timestamp: new Date()
      }]);
      return this.currentStatus;
    }

    const issues: HealthIssue[] = [];
    let isHealthy = true;

    try {
      // Check browser connection
      if (!this.browser.isConnected()) {
        issues.push({
          type: 'connection',
          severity: 'critical',
          message: 'Browser is not connected',
          timestamp: new Date()
        });
        isHealthy = false;
      }

      // Check browser responsiveness
      const responsiveCheck = await this.checkResponsiveness();
      if (!responsiveCheck.isResponsive) {
        issues.push({
          type: 'performance',
          severity: 'high',
          message: 'Browser is not responsive',
          timestamp: new Date(),
          data: { responseTime: responsiveCheck.responseTime }
        });
        isHealthy = false;
      }

      // Check memory usage
      if (this.config.enableMemoryMonitoring) {
        const memoryIssues = await this.checkMemoryUsage();
        issues.push(...memoryIssues);
        if (memoryIssues.some(issue => issue.severity === 'critical')) {
          isHealthy = false;
        }
      }

      // Check page health
      if (this.config.enablePageHealthCheck) {
        const pageIssues = await this.checkPageHealth();
        issues.push(...pageIssues);
        if (pageIssues.some(issue => issue.severity === 'high' || issue.severity === 'critical')) {
          isHealthy = false;
        }
      }

      // Update metrics
      await this.updateMetrics();

    } catch (error) {
      this.logger.error('Error during health check:', error);
      issues.push({
        type: 'timeout',
        severity: 'critical',
        message: `Health check failed: ${error.message}`,
        timestamp: new Date(),
        data: { error }
      });
      isHealthy = false;
    }

    this.updateStatus(isHealthy, issues);
    
    // Trigger recovery if needed
    if (!isHealthy && this.config.enableAutoRestart) {
      await this.handleUnhealthyBrowser();
    }

    return this.currentStatus;
  }

  /**
   * Get current health status
   */
  getStatus(): HealthStatus {
    return { ...this.currentStatus };
  }

  /**
   * Get recovery action history
   */
  getRecoveryHistory(): RecoveryAction[] {
    return [...this.recoveryActions];
  }

  /**
   * Force browser restart
   */
  async forceRestart(): Promise<boolean> {
    if (!this.onBrowserRestart) {
      this.logger.error('No restart handler available');
      return false;
    }

    const action: RecoveryAction = {
      type: 'restart',
      reason: 'Manual restart requested',
      timestamp: new Date(),
      success: false
    };

    try {
      this.logger.info('Forcing browser restart...');
      
      const newBrowser = await this.onBrowserRestart();
      this.browser = newBrowser;
      
      action.success = true;
      this.recoveryActions.push(action);
      
      this.logger.info('Browser restart completed successfully');
      this.emit('browserRestarted', { browser: newBrowser, action });
      
      return true;

    } catch (error) {
      action.error = error as Error;
      this.recoveryActions.push(action);
      
      this.logger.error('Browser restart failed:', error);
      this.emit('restartFailed', { error, action });
      
      return false;
    }
  }

  /**
   * Destroy the health monitor
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.stopMonitoring();
    
    this.logger.info('Browser health monitor destroyed');
    this.emit('destroyed');
  }

  // Private methods

  private setupBrowserEventListeners(): void {
    if (!this.browser) return;

    this.browser.on('disconnected', () => {
      this.logger.warn('Browser disconnected event received');
      this.updateStatus(false, [{
        type: 'connection',
        severity: 'critical',
        message: 'Browser disconnected',
        timestamp: new Date()
      }]);
      this.emit('browserDisconnected');
    });
  }

  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logger.error('Error in scheduled health check:', error);
      }
    }, this.config.interval);
  }

  private async checkResponsiveness(): Promise<{ isResponsive: boolean; responseTime: number }> {
    if (!this.browser) {
      return { isResponsive: false, responseTime: 0 };
    }

    const startTime = Date.now();
    
    try {
      // Create a test page to check responsiveness
      const testPage = await Promise.race([
        this.browser.newPage(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.config.timeout)
        )
      ]);

      await testPage.close();
      const responseTime = Date.now() - startTime;
      
      return { isResponsive: true, responseTime };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return { isResponsive: false, responseTime };
    }
  }

  private async checkMemoryUsage(): Promise<HealthIssue[]> {
    const issues: HealthIssue[] = [];
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;

    // Check heap usage
    if (heapUsedMB > 1024) { // 1GB
      issues.push({
        type: 'memory',
        severity: 'critical',
        message: `High heap usage: ${heapUsedMB.toFixed(2)} MB`,
        timestamp: new Date(),
        data: { heapUsedMB, heapTotalMB }
      });
    } else if (heapUsedMB > 512) { // 512MB
      issues.push({
        type: 'memory',
        severity: 'high',
        message: `Elevated heap usage: ${heapUsedMB.toFixed(2)} MB`,
        timestamp: new Date(),
        data: { heapUsedMB, heapTotalMB }
      });
    }

    // Check memory growth rate
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;
    if (heapUsagePercent > 90) {
      issues.push({
        type: 'memory',
        severity: 'high',
        message: `High heap usage percentage: ${heapUsagePercent.toFixed(1)}%`,
        timestamp: new Date(),
        data: { heapUsagePercent }
      });
    }

    return issues;
  }

  private async checkPageHealth(): Promise<HealthIssue[]> {
    if (!this.browser) return [];

    const issues: HealthIssue[] = [];
    
    try {
      const contexts = this.browser.contexts();
      let totalPages = 0;
      let closedPages = 0;

      for (const context of contexts) {
        const pages = context.pages();
        totalPages += pages.length;
        
        for (const page of pages) {
          if (page.isClosed()) {
            closedPages++;
          }
        }
      }

      // Check for too many pages
      if (totalPages > 20) {
        issues.push({
          type: 'pages',
          severity: 'medium',
          message: `High page count: ${totalPages}`,
          timestamp: new Date(),
          data: { totalPages, closedPages }
        });
      }

      // Check for memory leaks (many closed pages still in memory)
      if (closedPages > 10) {
        issues.push({
          type: 'pages',
          severity: 'medium',
          message: `Many closed pages in memory: ${closedPages}`,
          timestamp: new Date(),
          data: { totalPages, closedPages }
        });
      }

    } catch (error) {
      issues.push({
        type: 'pages',
        severity: 'medium',
        message: `Error checking page health: ${error.message}`,
        timestamp: new Date(),
        data: { error }
      });
    }

    return issues;
  }

  private async updateMetrics(): Promise<void> {
    if (!this.browser) return;

    try {
      const contexts = this.browser.contexts();
      const pageCount = contexts.reduce((count, context) => count + context.pages().length, 0);
      const memoryUsage = process.memoryUsage().heapUsed;

      this.currentStatus.metrics = {
        isResponsive: this.currentStatus.isHealthy,
        memoryUsage,
        pageCount,
        uptime: process.uptime(),
        lastActivity: new Date()
      };

    } catch (error) {
      this.logger.error('Error updating metrics:', error);
    }
  }

  private updateStatus(isHealthy: boolean, issues: HealthIssue[]): void {
    const wasHealthy = this.currentStatus.isHealthy;
    
    this.currentStatus = {
      isHealthy,
      lastCheck: new Date(),
      consecutiveFailures: isHealthy ? 0 : this.currentStatus.consecutiveFailures + 1,
      issues,
      metrics: this.currentStatus.metrics
    };

    // Emit events for status changes
    if (wasHealthy && !isHealthy) {
      this.emit('healthDegraded', { status: this.currentStatus });
    } else if (!wasHealthy && isHealthy) {
      this.emit('healthRestored', { status: this.currentStatus });
    }

    this.emit('healthCheck', { status: this.currentStatus });
  }

  private async handleUnhealthyBrowser(): Promise<void> {
    if (this.currentStatus.consecutiveFailures < this.config.maxFailures) {
      return;
    }

    this.logger.warn(`Browser unhealthy for ${this.currentStatus.consecutiveFailures} consecutive checks, attempting recovery...`);

    // Wait before attempting recovery
    await new Promise(resolve => setTimeout(resolve, this.config.recoveryDelay));

    // Attempt restart
    const restartSuccess = await this.forceRestart();
    
    if (restartSuccess) {
      // Reset failure count on successful restart
      this.currentStatus.consecutiveFailures = 0;
    }
  }
}
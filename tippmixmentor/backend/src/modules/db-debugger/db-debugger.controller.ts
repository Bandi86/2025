import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DbDebuggerService, DataIntegrityReport } from './db-debugger.service';
import { QueryMonitorService } from './services/query-monitor.service';
import { ConnectionPoolMonitorService } from './services/connection-pool-monitor.service';
import { AlertService } from './services/alert.service';

@ApiTags('Database Debugger')
@Controller('db-debugger')
export class DbDebuggerController {
  constructor(
    private readonly dbDebuggerService: DbDebuggerService,
    private readonly queryMonitorService: QueryMonitorService,
    private readonly connectionPoolMonitorService: ConnectionPoolMonitorService,
    private readonly alertService: AlertService,
  ) {}

  @Get('integrity-check')
  @ApiOperation({
    summary: 'Teljes adatbázis integritás ellenőrzés',
    description: 'Átfogó ellenőrzés az adatbázis állapotáról, hiányzó adatokról és hibákról'
  })
  @ApiResponse({
    status: 200,
    description: 'Integritás jelentés sikeresen generálva',
    type: Object
  })
  async runIntegrityCheck(): Promise<DataIntegrityReport> {
    return this.dbDebuggerService.runFullIntegrityCheck();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Adatbázis statisztikák',
    description: 'Általános statisztikák az adatbázis tartalmáról'
  })
  @ApiResponse({
    status: 200,
    description: 'Statisztikák sikeresen lekérve'
  })
  async getDatabaseStats() {
    return this.dbDebuggerService.getDatabaseStats();
  }

  @Post('check-date-range')
  @ApiOperation({
    summary: 'Adott időszak meccsinek ellenőrzése',
    description: 'Ellenőrzi egy megadott időszak meccseit hiányzó adatokért'
  })
  @ApiQuery({ name: 'startDate', description: 'Kezdő dátum (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', description: 'Befejező dátum (YYYY-MM-DD)', example: '2025-01-31' })
  @ApiResponse({
    status: 200,
    description: 'Időszak ellenőrzés befejezve'
  })
  async checkDateRange(
    @Body() body: { startDate: string; endDate: string }
  ) {
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    const issues = await this.dbDebuggerService.checkMatchesByDateRange(startDate, endDate);

    return {
      period: {
        startDate: body.startDate,
        endDate: body.endDate,
      },
      issuesFound: issues.length,
      issues,
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Adatbázis egészség gyors ellenőrzés',
    description: 'Gyors áttekintés az adatbázis állapotáról'
  })
  @ApiResponse({
    status: 200,
    description: 'Egészség ellenőrzés befejezve'
  })
  async getHealthCheck() {
    const stats = await this.dbDebuggerService.getDatabaseStats();

    const healthScore = Math.round(
      (stats.matches.oddsCompleteness + stats.matches.resultCompleteness) / 2
    );

    let status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';

    if (healthScore >= 90) status = 'EXCELLENT';
    else if (healthScore >= 75) status = 'GOOD';
    else if (healthScore >= 50) status = 'WARNING';
    else status = 'CRITICAL';

    return {
      status,
      healthScore,
      summary: {
        totalMatches: stats.matches.total,
        dataCompleteness: {
          odds: `${stats.matches.oddsCompleteness}%`,
          results: `${stats.matches.resultCompleteness}%`,
        },
      },
      recommendation: this.getHealthRecommendation(status, stats),
    };
  }

  // ===== MONITORING DASHBOARD ENDPOINTS =====

  @Get('monitoring/queries')
  @ApiOperation({
    summary: 'Query monitoring dashboard data',
    description: 'Real-time query performance metrics and statistics'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of queries to return', example: 50 })
  @ApiResponse({ status: 200, description: 'Query monitoring data retrieved successfully' })
  async getQueryMonitoringData(@Query('limit') limit?: string) {
    const queryLimit = limit ? parseInt(limit, 10) : 50;

    const [queryStats, queryHistory] = await Promise.all([
      this.queryMonitorService.getQueryStatistics(),
      this.queryMonitorService.getQueryHistory(24), // Last 24 hours
    ]);

    return {
      statistics: queryStats,
      recentQueries: queryHistory.slice(0, queryLimit),
      slowQueries: queryHistory.filter(q => q.executionTime > 1000).slice(0, queryLimit),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('monitoring/queries/slow')
  @ApiOperation({
    summary: 'Slow queries analysis',
    description: 'Detailed analysis of slow-performing queries'
  })
  @ApiQuery({ name: 'threshold', required: false, description: 'Minimum execution time in ms', example: 1000 })
  @ApiResponse({ status: 200, description: 'Slow queries data retrieved successfully' })
  async getSlowQueries(@Query('threshold') threshold?: string) {
    const thresholdMs = threshold ? parseInt(threshold, 10) : 1000;

    const queryHistory = await this.queryMonitorService.getQueryHistory(24);
    const slowQueries = queryHistory.filter(q => q.executionTime >= thresholdMs);

    return {
      slowQueries,
      threshold: thresholdMs,
      count: slowQueries.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('monitoring/connections')
  @ApiOperation({
    summary: 'Connection pool monitoring',
    description: 'Real-time connection pool metrics and health status'
  })
  @ApiResponse({ status: 200, description: 'Connection pool data retrieved successfully' })
  async getConnectionPoolData() {
    const [currentMetrics, history] = await Promise.all([
      this.connectionPoolMonitorService.getCurrentMetrics(),
      this.connectionPoolMonitorService.getMetricsHistory(24), // Last 24 hours
    ]);

    return {
      current: currentMetrics,
      history,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('monitoring/alerts')
  @ApiOperation({
    summary: 'Active alerts and notifications',
    description: 'Current active alerts and recent alert history'
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by alert status', example: 'ACTIVE' })
  @ApiResponse({ status: 200, description: 'Alerts data retrieved successfully' })
  async getAlertsData(@Query('status') status?: string) {
    const [activeAlerts, alertHistory] = await Promise.all([
      this.alertService.getActiveAlerts(),
      this.alertService.getAlertHistory(24), // Last 24 hours
    ]);

    let filteredAlerts = activeAlerts;
    if (status) {
      // Filter by resolved status or other criteria
      filteredAlerts = activeAlerts.filter(alert => alert.resolved === (status === 'RESOLVED'));
    }

    return {
      activeAlerts: filteredAlerts,
      recentAlerts: alertHistory.slice(0, 50),
      summary: {
        total: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        warning: activeAlerts.filter(a => a.severity === 'warning').length,
        info: activeAlerts.filter(a => a.severity === 'info').length,
        error: activeAlerts.filter(a => a.severity === 'error').length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post('monitoring/alerts/:id/resolve')
  @ApiOperation({
    summary: 'Resolve an alert',
    description: 'Mark an alert as resolved with optional resolution notes'
  })
  @ApiParam({ name: 'id', description: 'Alert ID to resolve' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  async resolveAlert(
    @Param('id') alertId: string,
    @Body() body: { notes?: string; resolvedBy?: string }
  ) {
    await this.alertService.resolveAlert(alertId, body.notes);

    return {
      success: true,
      message: 'Alert resolved successfully',
      alertId,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('monitoring/performance')
  @ApiOperation({
    summary: 'Performance metrics dashboard',
    description: 'Comprehensive performance metrics and bottleneck analysis'
  })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range in hours', example: 24 })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  async getPerformanceMetrics(@Query('timeRange') timeRange?: string) {
    const hours = timeRange ? parseInt(timeRange, 10) : 24;

    const [queryStats, connectionMetrics, bottlenecks] = await Promise.all([
      this.queryMonitorService.getQueryStatistics(),
      this.connectionPoolMonitorService.getCurrentMetrics(),
      this.dbDebuggerService.getPerformanceBottlenecks(),
    ]);

    return {
      timeRange: `${hours} hours`,
      queryPerformance: queryStats,
      connectionPerformance: connectionMetrics,
      bottlenecks,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('monitoring/real-time')
  @ApiOperation({
    summary: 'Real-time monitoring data',
    description: 'Live database metrics for real-time dashboard updates'
  })
  @ApiResponse({ status: 200, description: 'Real-time data retrieved successfully' })
  async getRealTimeData() {
    const [queryStats, connectionMetrics] = await Promise.all([
      this.queryMonitorService.getQueryStatistics(),
      this.connectionPoolMonitorService.getCurrentMetrics(),
    ]);

    return {
      queries: queryStats,
      connections: connectionMetrics,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('monitoring/test-alert')
  @ApiOperation({
    summary: 'Test alert system',
    description: 'Send a test alert to verify notification channels'
  })
  @ApiResponse({ status: 200, description: 'Test alert sent successfully' })
  async testAlert(@Body() body: { channel?: string; message?: string }) {
    const testMessage = body.message || 'Test alert from DB Debugger';

    // For now, just log the test alert
    // In a real implementation, this would trigger the actual alert system
    console.log('Test alert triggered:', testMessage);

    return {
      success: true,
      message: 'Test alert sent successfully',
      channel: body.channel || 'all',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('monitoring/export/:type')
  @ApiOperation({
    summary: 'Export monitoring data',
    description: 'Export monitoring data in various formats (JSON, CSV)'
  })
  @ApiParam({ name: 'type', description: 'Export type', enum: ['queries', 'alerts', 'performance'] })
  @ApiQuery({ name: 'format', required: false, description: 'Export format', example: 'json' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range in hours', example: 24 })
  @ApiResponse({ status: 200, description: 'Data exported successfully' })
  async exportData(
    @Param('type') type: string,
    @Query('format') format?: string,
    @Query('timeRange') timeRange?: string
  ) {
    const hours = timeRange ? parseInt(timeRange, 10) : 24;
    const exportFormat = format || 'json';

    let data: any;

    switch (type) {
      case 'queries':
        data = await this.queryMonitorService.getQueryHistory(hours);
        break;
      case 'alerts':
        data = await this.alertService.getAlertHistory(hours);
        break;
      case 'performance':
        data = await this.queryMonitorService.getQueryStatistics();
        break;
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }

    return {
      type,
      format: exportFormat,
      timeRange: `${hours} hours`,
      data,
      exportedAt: new Date().toISOString(),
    };
  }

  private getHealthRecommendation(
    status: string,
    stats: any
  ): string {
    switch (status) {
      case 'EXCELLENT':
        return 'Az adatbázis kiváló állapotban van! 🎉';
      case 'GOOD':
        return 'Az adatbázis jó állapotban van, kisebb hiányosságok lehetnek.';
      case 'WARNING':
        return 'Figyelem: Jelentős adathiányok vannak. Futtasd le a data ingestion folyamatokat.';
      case 'CRITICAL':
        return 'KRITIKUS: Súlyos adathiányok! Azonnali beavatkozás szükséges.';
      default:
        return 'Ismeretlen állapot.';
    }
  }
}

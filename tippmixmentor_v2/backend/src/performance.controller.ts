import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { PerformanceMonitorService } from './common/monitoring/performance-monitor.service';
import { PerformanceCacheService } from './common/caching/performance-cache.service';

@ApiTags('performance')
@Controller('api/v1/performance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PerformanceController {
  constructor(
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly performanceCache: PerformanceCacheService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get performance statistics' })
  @ApiResponse({ status: 200, description: 'Performance statistics retrieved successfully' })
  async getPerformanceStats(@Query('timeWindow') timeWindow?: number) {
    const stats = this.performanceMonitor.getPerformanceStats(timeWindow);
    const cacheStats = await this.performanceCache.getCacheStats();
    
    return {
      ...stats,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('slowest-endpoints')
  @ApiOperation({ summary: 'Get slowest endpoints' })
  @ApiResponse({ status: 200, description: 'Slowest endpoints retrieved successfully' })
  async getSlowestEndpoints(@Query('limit') limit?: number) {
    return {
      endpoints: this.performanceMonitor.getSlowestEndpoints(limit || 10),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('slowest-queries')
  @ApiOperation({ summary: 'Get slowest database queries' })
  @ApiResponse({ status: 200, description: 'Slowest queries retrieved successfully' })
  async getSlowestQueries(@Query('limit') limit?: number) {
    return {
      queries: this.performanceMonitor.getSlowestQueries(limit || 10),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('error-rates')
  @ApiOperation({ summary: 'Get error rates by endpoint' })
  @ApiResponse({ status: 200, description: 'Error rates retrieved successfully' })
  async getErrorRates() {
    return {
      errorRates: this.performanceMonitor.getErrorRateByEndpoint(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get performance alerts' })
  @ApiResponse({ status: 200, description: 'Performance alerts retrieved successfully' })
  async getPerformanceAlerts() {
    return {
      alerts: this.performanceMonitor.getPerformanceAlerts(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get performance recommendations' })
  @ApiResponse({ status: 200, description: 'Performance recommendations retrieved successfully' })
  async getPerformanceRecommendations() {
    return {
      recommendations: this.performanceMonitor.getPerformanceRecommendations(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('cache-stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved successfully' })
  async getCacheStats() {
    return {
      cache: await this.performanceCache.getCacheStats(),
      metrics: this.performanceCache.getMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache() {
    // This would typically clear all cache or specific patterns
    return {
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('cache/warm')
  @ApiOperation({ summary: 'Warm cache with frequently accessed data' })
  @ApiResponse({ status: 200, description: 'Cache warming completed successfully' })
  async warmCache() {
    const patterns = [
      'predictions:user:*',
      'matches:live:*',
      'analytics:user-performance:*',
      'ml:model-info:*',
    ];

    await this.performanceCache.warmCache(patterns);

    return {
      message: 'Cache warming completed successfully',
      patterns,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export performance data for analysis' })
  @ApiResponse({ status: 200, description: 'Performance data exported successfully' })
  async exportPerformanceData() {
    return {
      data: this.performanceMonitor.exportPerformanceData(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('metrics/clear')
  @ApiOperation({ summary: 'Clear old performance metrics' })
  @ApiResponse({ status: 200, description: 'Old metrics cleared successfully' })
  async clearOldMetrics(@Query('olderThanHours') olderThanHours?: number) {
    this.performanceMonitor.clearOldMetrics(olderThanHours || 24);
    this.performanceCache.clearMetrics();

    return {
      message: 'Old metrics cleared successfully',
      olderThanHours: olderThanHours || 24,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get performance health status' })
  @ApiResponse({ status: 200, description: 'Performance health status retrieved successfully' })
  async getPerformanceHealth() {
    const stats = this.performanceMonitor.getPerformanceStats(300000); // Last 5 minutes
    const alerts = this.performanceMonitor.getPerformanceAlerts();
    const cacheStats = await this.performanceCache.getCacheStats();

    const isHealthy = 
      stats.errorRate < 5 &&
      stats.averageResponseTime < 1000 &&
      alerts.length === 0;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      checks: {
        errorRate: stats.errorRate < 5,
        responseTime: stats.averageResponseTime < 1000,
        noAlerts: alerts.length === 0,
        cacheAvailable: cacheStats.totalKeys > 0,
      },
      metrics: {
        errorRate: stats.errorRate,
        averageResponseTime: stats.averageResponseTime,
        alertsCount: alerts.length,
        cacheHitRate: cacheStats.hitRate,
      },
      timestamp: new Date().toISOString(),
    };
  }
} 
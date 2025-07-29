import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MonitoringService } from './common/monitoring/monitoring.service';
import { LoggingService } from './common/logging/logging.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(
    private monitoringService: MonitoringService,
    private loggingService: LoggingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get comprehensive performance metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async getMetrics() {
    const metrics = this.monitoringService.getPerformanceMetrics();
    
    this.loggingService.log('Metrics requested', 'METRICS', {
      apiRequests: metrics.api.totalRequests,
      errorRate: metrics.api.errorRate,
      avgResponseTime: metrics.api.averageResponseTime,
    });

    return metrics;
  }

  @Get('api')
  @ApiOperation({ summary: 'Get API performance metrics' })
  @ApiResponse({ status: 200, description: 'API metrics retrieved' })
  getApiMetrics() {
    const metrics = this.monitoringService.getPerformanceMetrics();
    return metrics.api;
  }

  @Get('database')
  @ApiOperation({ summary: 'Get database performance metrics' })
  @ApiResponse({ status: 200, description: 'Database metrics retrieved' })
  getDatabaseMetrics() {
    const metrics = this.monitoringService.getPerformanceMetrics();
    return metrics.database;
  }

  @Get('errors')
  @ApiOperation({ summary: 'Get error metrics' })
  @ApiResponse({ status: 200, description: 'Error metrics retrieved' })
  getErrorMetrics() {
    const metrics = this.monitoringService.getPerformanceMetrics();
    return metrics.errors;
  }

  @Get('system')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved' })
  getSystemMetrics() {
    const metrics = this.monitoringService.getPerformanceMetrics();
    return metrics.system;
  }

  @Get('services')
  @ApiOperation({ summary: 'Get service health and performance' })
  @ApiResponse({ status: 200, description: 'Service metrics retrieved' })
  getServiceMetrics() {
    return {
      health: this.monitoringService.getServiceHealth(),
      services: this.monitoringService.getServices(),
    };
  }
} 
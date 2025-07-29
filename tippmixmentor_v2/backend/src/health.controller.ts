import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MonitoringService } from './common/monitoring/monitoring.service';
import { LoggingService } from './common/logging/logging.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private monitoringService: MonitoringService,
    private loggingService: LoggingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'Health check successful' })
  @ApiResponse({ status: 503, description: 'Service unhealthy' })
  async check() {
    const healthCheck = await this.monitoringService.getHealthCheck();
    
    this.loggingService.log('Health check requested', 'HEALTH', {
      status: healthCheck.status,
      uptime: healthCheck.uptime,
    });

    return healthCheck;
  }

  @Get('simple')
  @ApiOperation({ summary: 'Get simple health status' })
  @ApiResponse({ status: 200, description: 'Simple health check' })
  simple() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('services')
  @ApiOperation({ summary: 'Get service health status' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  getServiceHealth() {
    return this.monitoringService.getServiceHealth();
  }
} 
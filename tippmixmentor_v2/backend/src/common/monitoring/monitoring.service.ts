import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../logging/logging.service';
import { MetricsService } from './metrics.service';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  redis: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  services: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
  };
}

@Injectable()
export class MonitoringService {
  private startTime: number = Date.now();

  constructor(
    private configService: ConfigService,
    private loggingService: LoggingService,
    private metricsService: MetricsService,
  ) {}

  async getHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    const memory = this.getMemoryUsage();
    const cpu = await this.getCpuUsage();

    // Check database connection
    const database = await this.checkDatabaseHealth();

    // Check Redis connection
    const redis = await this.checkRedisHealth();

    // Check external services
    const services = await this.checkExternalServices();

    const result: HealthCheckResult = {
      status: this.determineOverallStatus(database, redis, services),
      timestamp,
      uptime,
      memory,
      cpu,
      database,
      redis,
      services,
    };

    // Log health check result
    this.loggingService.log('Health check completed', 'MONITORING', {
      status: result.status,
      uptime,
      memoryUsage: memory.percentage,
    });

    return result;
  }

  private getMemoryUsage() {
    const memUsage = process.memoryUsage();
    const total = memUsage.heapTotal;
    const used = memUsage.heapUsed;
    const percentage = (used / total) * 100;

    return {
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  private async getCpuUsage(): Promise<{ usage: number }> {
    // Simple CPU usage calculation
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);
    
    const usage = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds
    return { usage: Math.round(usage * 100) / 100 };
  }

  private async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      // This would be implemented with actual database connection check
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected' as const,
        responseTime,
      };
    } catch (error) {
      this.loggingService.logError(error as Error, 'MONITORING');
      return {
        status: 'disconnected' as const,
      };
    }
  }

  private async checkRedisHealth() {
    try {
      const startTime = Date.now();
      // This would be implemented with actual Redis connection check
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected' as const,
        responseTime,
      };
    } catch (error) {
      this.loggingService.logError(error as Error, 'MONITORING');
      return {
        status: 'disconnected' as const,
      };
    }
  }

  private async checkExternalServices() {
    const services: HealthCheckResult['services'] = {};

    // Check ML service if configured
    const mlServiceUrl = this.configService.get('ML_SERVICE_URL');
    if (mlServiceUrl) {
      try {
        const startTime = Date.now();
        // This would be an actual HTTP request to the ML service
        const responseTime = Date.now() - startTime;
        
        services.mlService = {
          status: 'healthy',
          responseTime,
        };
      } catch (error) {
        services.mlService = {
          status: 'unhealthy',
          error: (error as Error).message,
        };
      }
    }

    return services;
  }

  private determineOverallStatus(
    database: HealthCheckResult['database'],
    redis: HealthCheckResult['redis'],
    services: HealthCheckResult['services'],
  ): 'healthy' | 'unhealthy' | 'degraded' {
    const criticalServices = [database, redis];
    const hasUnhealthyCritical = criticalServices.some(service => service.status === 'disconnected');
    const hasUnhealthyService = Object.values(services).some(service => service.status === 'unhealthy');

    if (hasUnhealthyCritical) {
      return 'unhealthy';
    }

    if (hasUnhealthyService) {
      return 'degraded';
    }

    return 'healthy';
  }

  getPerformanceMetrics() {
    return this.metricsService.getMetrics();
  }

  recordApiCall(method: string, path: string, statusCode: number, duration: number) {
    this.metricsService.recordApiCall(method, path, statusCode, duration);
  }

  recordDatabaseQuery(operation: string, duration: number, success: boolean) {
    this.metricsService.recordDatabaseQuery(operation, duration, success);
  }

  recordError(error: Error, context: string) {
    this.metricsService.recordError(error, context);
  }

  getServiceHealth() {
    // This would return the health status of all services
    return {
      auth: { status: 'healthy', lastCheck: Date.now() },
      users: { status: 'healthy', lastCheck: Date.now() },
      matches: { status: 'healthy', lastCheck: Date.now() },
      predictions: { status: 'healthy', lastCheck: Date.now() },
      analytics: { status: 'healthy', lastCheck: Date.now() },
      notifications: { status: 'healthy', lastCheck: Date.now() },
    };
  }

  getServices() {
    // This would return the configuration of all services
    return {
      auth: { url: 'http://localhost:3001', timeout: 5000 },
      users: { url: 'http://localhost:3001', timeout: 5000 },
      matches: { url: 'http://localhost:3001', timeout: 5000 },
      predictions: { url: 'http://localhost:3001', timeout: 5000 },
      analytics: { url: 'http://localhost:3001', timeout: 5000 },
      notifications: { url: 'http://localhost:3001', timeout: 5000 },
    };
  }
} 
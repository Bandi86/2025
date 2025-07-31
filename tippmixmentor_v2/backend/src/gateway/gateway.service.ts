import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { LoggingService } from '../common/logging/logging.service';
import { MonitoringService } from '../common/monitoring/monitoring.service';
import { RedisService } from '../common/redis/redis.service';

export interface ServiceConfig {
  name: string;
  url: string;
  healthCheck: string;
  timeout: number;
  retries: number;
}

export interface CachedResponse {
  data: any;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class GatewayService {
  private services: Map<string, ServiceConfig> = new Map();
  private serviceHealth: Map<string, { status: 'healthy' | 'unhealthy'; lastCheck: number }> = new Map();

  constructor(
    private configService: ConfigService,
    private loggingService: LoggingService,
    private monitoringService: MonitoringService,
    private redisService: RedisService,
  ) {
    this.initializeServices();
    this.startHealthChecks();
  }

  private initializeServices() {
    // Define service configurations
    const serviceConfigs: ServiceConfig[] = [
      {
        name: 'auth',
        url: this.configService.get('AUTH_SERVICE_URL', 'http://localhost:3001'),
        healthCheck: '/health',
        timeout: 5000,
        retries: 3,
      },
      {
        name: 'users',
        url: this.configService.get('USERS_SERVICE_URL', 'http://localhost:3001'),
        healthCheck: '/health',
        timeout: 5000,
        retries: 3,
      },
      {
        name: 'matches',
        url: this.configService.get('MATCHES_SERVICE_URL', 'http://localhost:3001'),
        healthCheck: '/health',
        timeout: 5000,
        retries: 3,
      },
      {
        name: 'predictions',
        url: this.configService.get('PREDICTIONS_SERVICE_URL', 'http://localhost:3001'),
        healthCheck: '/health',
        timeout: 5000,
        retries: 3,
      },

      {
        name: 'notifications',
        url: this.configService.get('NOTIFICATIONS_SERVICE_URL', 'http://localhost:3001'),
        healthCheck: '/health',
        timeout: 5000,
        retries: 3,
      },
      {
        name: 'agents',
        url: this.configService.get('AGENTS_SERVICE_URL', 'http://localhost:3001'),
        healthCheck: '/health',
        timeout: 5000,
        retries: 3,
      },
    ];

    serviceConfigs.forEach(config => {
      this.services.set(config.name, config);
      this.serviceHealth.set(config.name, { status: 'healthy', lastCheck: Date.now() });
    });
  }

  private startHealthChecks() {
    // Check service health every 30 seconds
    setInterval(() => {
      this.checkAllServicesHealth();
    }, 30000);
  }

  private async checkAllServicesHealth() {
    for (const [serviceName, config] of this.services) {
      try {
        const response = await axios.get(`${config.url}${config.healthCheck}`, {
          timeout: config.timeout,
        });

        if (response.status === 200) {
          this.serviceHealth.set(serviceName, {
            status: 'healthy',
            lastCheck: Date.now(),
          });
        } else {
          this.serviceHealth.set(serviceName, {
            status: 'unhealthy',
            lastCheck: Date.now(),
          });
        }
      } catch (error) {
        this.serviceHealth.set(serviceName, {
          status: 'unhealthy',
          lastCheck: Date.now(),
        });

        this.loggingService.warn(`Service health check failed`, 'GATEWAY', {
          service: serviceName,
          error: (error as Error).message,
        });
      }
    }
  }

  async routeRequest(req: Request, res: Response, method: string): Promise<void> {
    const startTime = Date.now();
    const path = req.path.replace('/api/v1', '');
    const serviceName = this.getServiceFromPath(path);

    try {
      // Check if service exists
      if (!this.services.has(serviceName)) {
        throw new HttpException(`Service '${serviceName}' not found`, HttpStatus.NOT_FOUND);
      }

      // Check service health
      const health = this.serviceHealth.get(serviceName);
      if (health?.status === 'unhealthy') {
        throw new HttpException(`Service '${serviceName}' is unavailable`, HttpStatus.SERVICE_UNAVAILABLE);
      }

      // Check cache for GET requests
      if (method === 'GET') {
        const cachedResponse = await this.getCachedResponse(req);
        if (cachedResponse) {
          this.loggingService.log('Serving cached response', 'GATEWAY', {
            service: serviceName,
            path,
            cacheHit: true,
          });
          res.json(cachedResponse.data);
          return;
        }
      }

      // Route request to appropriate service
      const response = await this.forwardRequest(req, method, serviceName);

      // Cache response for GET requests
      if (method === 'GET' && response.status >= 200 && response.status < 300) {
        await this.cacheResponse(req, response.data);
      }

      // Record metrics
      const duration = Date.now() - startTime;
      this.monitoringService.recordApiCall(method, path, response.status, duration);

      // Send response
      res.status(response.status).json(response.data);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof HttpException) {
        this.monitoringService.recordApiCall(method, path, error.getStatus(), duration);
        res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        this.loggingService.logError(error as Error, 'GATEWAY', {
          service: serviceName,
          path,
          method,
        });

        this.monitoringService.recordApiCall(method, path, HttpStatus.INTERNAL_SERVER_ERROR, duration);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  private getServiceFromPath(path: string): string {
    const segments = path.split('/').filter(Boolean);
    const service = segments[0] || 'auth';
    
    // Map specific agent-related paths to the agents service
    if (service === 'agents' || path.includes('/agents/')) {
      return 'agents';
    }
    
    return service;
  }

  private async forwardRequest(req: Request, method: string, serviceName: string): Promise<AxiosResponse> {
    const config = this.services.get(serviceName);
    if (!config) {
      throw new HttpException(`Service '${serviceName}' not found`, HttpStatus.NOT_FOUND);
    }

    const targetUrl = `${config.url}${req.path}`;
    const headers = this.prepareHeaders(req);
    const data = method !== 'GET' ? req.body : undefined;

    this.loggingService.log('Forwarding request to service', 'GATEWAY', {
      service: serviceName,
      method,
      targetUrl,
      userId: (req as any).user?.id,
    });

    try {
      const response = await axios({
        method,
        url: targetUrl,
        headers,
        data,
        timeout: config.timeout,
        validateStatus: () => true, // Don't throw on HTTP error status
      });

      return response;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      this.loggingService.logError(error as Error, 'GATEWAY', {
        service: serviceName,
        method,
        targetUrl,
        status: axiosError.response?.status,
      });

      if (axiosError.code === 'ECONNABORTED') {
        throw new HttpException(`Service '${serviceName}' timeout`, HttpStatus.REQUEST_TIMEOUT);
      }

      if (axiosError.code === 'ECONNREFUSED') {
        throw new HttpException(`Service '${serviceName}' unavailable`, HttpStatus.SERVICE_UNAVAILABLE);
      }

      throw new HttpException(
        `Service '${serviceName}' error: ${axiosError.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private prepareHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};

    // Forward important headers
    const importantHeaders = [
      'authorization',
      'content-type',
      'accept',
      'user-agent',
      'x-forwarded-for',
      'x-request-id',
    ];

    importantHeaders.forEach(header => {
      if (req.headers[header]) {
        headers[header] = req.headers[header] as string;
      }
    });

    // Add gateway-specific headers
    headers['x-gateway-timestamp'] = Date.now().toString();
    headers['x-gateway-version'] = '2.0.0';

    return headers;
  }

  private async getCachedResponse(req: Request): Promise<CachedResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(req);
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        const cachedResponse: CachedResponse = JSON.parse(cached);
        
        // Check if cache is still valid
        if (Date.now() - cachedResponse.timestamp < cachedResponse.ttl) {
          return cachedResponse;
        } else {
          // Remove expired cache
          await this.redisService.del(cacheKey);
        }
      }
    } catch (error) {
      this.loggingService.warn('Cache retrieval failed', 'GATEWAY', {
        error: (error as Error).message,
      });
    }

    return null;
  }

  private async cacheResponse(req: Request, data: any): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(req);
      const ttl = this.getCacheTTL(req.path);
      
      const cachedResponse: CachedResponse = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      await this.redisService.set(cacheKey, JSON.stringify(cachedResponse), ttl / 1000);
    } catch (error) {
      this.loggingService.warn('Cache storage failed', 'GATEWAY', {
        error: (error as Error).message,
      });
    }
  }

  private generateCacheKey(req: Request): string {
    const path = req.path;
    const query = req.query ? JSON.stringify(req.query) : '';
    const userId = (req as any).user?.id || 'anonymous';
    
    return `gateway:cache:${userId}:${path}:${query}`;
  }

  private getCacheTTL(path: string): number {
    // Different cache TTLs based on endpoint type
    if (path.includes('/matches')) {
      return 5 * 60 * 1000; // 5 minutes for match data
    }
    if (path.includes('/predictions')) {
      return 2 * 60 * 1000; // 2 minutes for predictions
    }
    
    return 1 * 60 * 1000; // 1 minute default
  }

  getServiceHealth() {
    return Object.fromEntries(this.serviceHealth);
  }

  getServices() {
    return Object.fromEntries(this.services);
  }
} 
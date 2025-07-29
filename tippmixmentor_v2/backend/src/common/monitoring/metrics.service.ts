import { Injectable } from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';

export interface ApiMetrics {
  totalRequests: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  statusCodes: { [key: number]: number };
  endpoints: { [key: string]: { count: number; avgTime: number; errors: number } };
}

export interface DatabaseMetrics {
  totalQueries: number;
  averageQueryTime: number;
  errorRate: number;
  operations: { [key: string]: { count: number; avgTime: number; errors: number } };
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsPerHour: number;
  errorTypes: { [key: string]: number };
  contexts: { [key: string]: number };
}

export interface SystemMetrics {
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
  activeConnections: number;
}

@Injectable()
export class MetricsService {
  private apiMetrics: Map<string, any> = new Map();
  private databaseMetrics: Map<string, any> = new Map();
  private errorMetrics: Map<string, any> = new Map();
  private systemMetrics: Map<string, any> = new Map();

  constructor(private loggingService: LoggingService) {
    this.initializeMetrics();
    this.startMetricsCollection();
  }

  private initializeMetrics() {
    // Initialize API metrics
    this.apiMetrics.set('requests', []);
    this.apiMetrics.set('statusCodes', {});
    this.apiMetrics.set('endpoints', {});

    // Initialize database metrics
    this.databaseMetrics.set('queries', []);
    this.databaseMetrics.set('operations', {});

    // Initialize error metrics
    this.errorMetrics.set('errors', []);
    this.errorMetrics.set('errorTypes', {});
    this.errorMetrics.set('contexts', {});

    // Initialize system metrics
    this.systemMetrics.set('memory', []);
    this.systemMetrics.set('cpu', []);
  }

  private startMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);
  }

  recordApiCall(method: string, path: string, statusCode: number, duration: number) {
    const timestamp = Date.now();
    const key = `${method} ${path}`;

    // Record request
    const requests = this.apiMetrics.get('requests');
    requests.push({ timestamp, method, path, statusCode, duration });
    
    // Keep only last 1000 requests
    if (requests.length > 1000) {
      requests.splice(0, requests.length - 1000);
    }

    // Update status codes
    const statusCodes = this.apiMetrics.get('statusCodes');
    statusCodes[statusCode] = (statusCodes[statusCode] || 0) + 1;

    // Update endpoint metrics
    const endpoints = this.apiMetrics.get('endpoints');
    if (!endpoints[key]) {
      endpoints[key] = { count: 0, totalTime: 0, errors: 0 };
    }
    endpoints[key].count++;
    endpoints[key].totalTime += duration;
    if (statusCode >= 400) {
      endpoints[key].errors++;
    }

    // Log performance if slow
    if (duration > 1000) {
      this.loggingService.warn('Slow API call detected', 'METRICS', {
        method,
        path,
        duration,
        statusCode,
      });
    }
  }

  recordDatabaseQuery(operation: string, duration: number, success: boolean) {
    const timestamp = Date.now();

    // Record query
    const queries = this.databaseMetrics.get('queries');
    queries.push({ timestamp, operation, duration, success });
    
    // Keep only last 1000 queries
    if (queries.length > 1000) {
      queries.splice(0, queries.length - 1000);
    }

    // Update operation metrics
    const operations = this.databaseMetrics.get('operations');
    if (!operations[operation]) {
      operations[operation] = { count: 0, totalTime: 0, errors: 0 };
    }
    operations[operation].count++;
    operations[operation].totalTime += duration;
    if (!success) {
      operations[operation].errors++;
    }

    // Log slow queries
    if (duration > 100) {
      this.loggingService.warn('Slow database query detected', 'METRICS', {
        operation,
        duration,
        success,
      });
    }
  }

  recordError(error: Error, context: string) {
    const timestamp = Date.now();
    const errorType = error.constructor.name;

    // Record error
    const errors = this.errorMetrics.get('errors');
    errors.push({ timestamp, errorType, context, message: error.message });
    
    // Keep only last 1000 errors
    if (errors.length > 1000) {
      errors.splice(0, errors.length - 1000);
    }

    // Update error types
    const errorTypes = this.errorMetrics.get('errorTypes');
    errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;

    // Update contexts
    const contexts = this.errorMetrics.get('contexts');
    contexts[context] = (contexts[context] || 0) + 1;
  }

  private collectSystemMetrics() {
    const timestamp = Date.now();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Record memory usage
    const memory = this.systemMetrics.get('memory');
    memory.push({
      timestamp,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    });

    // Record CPU usage
    const cpu = this.systemMetrics.get('cpu');
    cpu.push({
      timestamp,
      user: cpuUsage.user,
      system: cpuUsage.system,
    });

    // Keep only last 1000 entries
    if (memory.length > 1000) {
      memory.splice(0, memory.length - 1000);
    }
    if (cpu.length > 1000) {
      cpu.splice(0, cpu.length - 1000);
    }
  }

  private cleanupOldMetrics() {
    const oneHourAgo = Date.now() - 3600000;

    // Clean up old API requests
    const requests = this.apiMetrics.get('requests');
    const filteredRequests = requests.filter((req: any) => req.timestamp > oneHourAgo);
    this.apiMetrics.set('requests', filteredRequests);

    // Clean up old database queries
    const queries = this.databaseMetrics.get('queries');
    const filteredQueries = queries.filter((query: any) => query.timestamp > oneHourAgo);
    this.databaseMetrics.set('queries', filteredQueries);

    // Clean up old errors
    const errors = this.errorMetrics.get('errors');
    const filteredErrors = errors.filter((error: any) => error.timestamp > oneHourAgo);
    this.errorMetrics.set('errors', filteredErrors);
  }

  getMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    // Calculate API metrics
    const requests = this.apiMetrics.get('requests');
    const recentRequests = requests.filter((req: any) => req.timestamp > oneMinuteAgo);
    const statusCodes = this.apiMetrics.get('statusCodes');
    const endpoints = this.apiMetrics.get('endpoints');

    const apiMetrics: ApiMetrics = {
      totalRequests: requests.length,
      requestsPerMinute: recentRequests.length,
      averageResponseTime: requests.length > 0 
        ? requests.reduce((sum: number, req: any) => sum + req.duration, 0) / requests.length 
        : 0,
      errorRate: requests.length > 0 
        ? (requests.filter((req: any) => req.statusCode >= 400).length / requests.length) * 100 
        : 0,
      statusCodes,
      endpoints: Object.fromEntries(
        Object.entries(endpoints).map(([key, value]: [string, any]) => [
          key,
          {
            count: value.count,
            avgTime: value.count > 0 ? value.totalTime / value.count : 0,
            errors: value.errors,
          },
        ])
      ),
    };

    // Calculate database metrics
    const queries = this.databaseMetrics.get('queries');
    const operations = this.databaseMetrics.get('operations');

    const databaseMetrics: DatabaseMetrics = {
      totalQueries: queries.length,
      averageQueryTime: queries.length > 0 
        ? queries.reduce((sum: number, query: any) => sum + query.duration, 0) / queries.length 
        : 0,
      errorRate: queries.length > 0 
        ? (queries.filter((query: any) => !query.success).length / queries.length) * 100 
        : 0,
      operations: Object.fromEntries(
        Object.entries(operations).map(([key, value]: [string, any]) => [
          key,
          {
            count: value.count,
            avgTime: value.count > 0 ? value.totalTime / value.count : 0,
            errors: value.errors,
          },
        ])
      ),
    };

    // Calculate error metrics
    const errors = this.errorMetrics.get('errors');
    const recentErrors = errors.filter((error: any) => error.timestamp > oneHourAgo);
    const errorTypes = this.errorMetrics.get('errorTypes');
    const contexts = this.errorMetrics.get('contexts');

    const errorMetrics: ErrorMetrics = {
      totalErrors: errors.length,
      errorsPerHour: recentErrors.length,
      errorTypes,
      contexts,
    };

    // Calculate system metrics
    const memory = this.systemMetrics.get('memory');
    const latestMemory = memory[memory.length - 1] || {};
    const cpu = this.systemMetrics.get('cpu');
    const latestCpu = cpu[cpu.length - 1] || {};

    const systemMetrics: SystemMetrics = {
      memoryUsage: latestMemory.heapUsed ? (latestMemory.heapUsed / latestMemory.heapTotal) * 100 : 0,
      cpuUsage: latestCpu.user ? (latestCpu.user + latestCpu.system) / 1000000 : 0,
      uptime: process.uptime(),
      activeConnections: 0, // This would be implemented with actual connection tracking
    };

    return {
      api: apiMetrics,
      database: databaseMetrics,
      errors: errorMetrics,
      system: systemMetrics,
      timestamp: now,
    };
  }
} 
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggingService } from '../logging/logging.service';
import { MonitoringService } from '../monitoring/monitoring.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private loggingService: LoggingService,
    private monitoringService: MonitoringService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id;

    const startTime = Date.now();

    // Log request
    this.loggingService.logRequest(method, url, ip, userAgent, userId);

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const statusCode = response.statusCode;

        // Log response
        this.loggingService.logResponse(method, url, statusCode, responseTime, userId);

        // Record metrics
        this.monitoringService.recordApiCall(method, url, statusCode, responseTime);

        // Log slow responses
        if (responseTime > 1000) {
          this.loggingService.warn('Slow API response detected', 'INTERCEPTOR', {
            method,
            url,
            responseTime,
            statusCode,
            userId,
          });
        }
      }),
      catchError((error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const statusCode = error.status || 500;

        // Log error response
        this.loggingService.logResponse(method, url, statusCode, responseTime, userId);

        // Record error metrics
        this.monitoringService.recordError(error, 'API');

        // Record API call metrics
        this.monitoringService.recordApiCall(method, url, statusCode, responseTime);

        throw error;
      }),
    );
  }
} 
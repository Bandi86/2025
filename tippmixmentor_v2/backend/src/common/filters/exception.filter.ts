import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from '../logging/logging.service';
import { MonitoringService } from '../monitoring/monitoring.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private loggingService: LoggingService,
    private monitoringService: MonitoringService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        errorCode = (exceptionResponse as any).errorCode || 'HTTP_EXCEPTION';
      } else {
        message = exception.message;
        errorCode = 'HTTP_EXCEPTION';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = exception.name || 'UNKNOWN_ERROR';
    }

    // Log the error
    this.loggingService.logError(exception as Error, 'EXCEPTION_FILTER', {
      method: request.method,
      url: request.url,
      statusCode: status,
      errorCode,
      userId: (request as any).user?.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    // Record error metrics
    this.monitoringService.recordError(exception as Error, 'EXCEPTION_FILTER');

    // Create error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errorCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    // Send response
    response.status(status).json(errorResponse);
  }
} 
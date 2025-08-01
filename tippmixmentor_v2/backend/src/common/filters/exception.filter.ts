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

// Centralized error codes for consistent frontend handling
export enum ErrorCode {
  // Authentication errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_FAILED = 'AUTH_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_FAILED = 'OPERATION_FAILED',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

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
    let errorCode = ErrorCode.INTERNAL_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        errorCode = (exceptionResponse as any).errorCode || this.mapHttpStatusToErrorCode(status);
      } else {
        message = exception.message;
        errorCode = this.mapHttpStatusToErrorCode(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = this.mapErrorNameToErrorCode(exception.name);
    }

    // Scrub sensitive information from request for logging
    const sanitizedRequest = this.sanitizeRequest(request);

    // Log the error with sanitized data
    this.loggingService.logError(exception as Error, 'EXCEPTION_FILTER', {
      method: sanitizedRequest.method,
      url: sanitizedRequest.url,
      statusCode: status,
      errorCode,
      userId: sanitizedRequest.userId,
      ip: sanitizedRequest.ip,
      userAgent: sanitizedRequest.userAgent,
    });

    // Record error metrics
    this.monitoringService.recordError(exception as Error, 'EXCEPTION_FILTER');

    // Create error response - never expose stack traces in production
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errorCode,
      // Only include stack trace in development environment
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    // Send response
    response.status(status).json(errorResponse);
  }

  /**
   * Map HTTP status codes to error codes
   */
  private mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTH_REQUIRED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.INSUFFICIENT_PERMISSIONS;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.RESOURCE_CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ErrorCode.INTERNAL_ERROR;
      default:
        return ErrorCode.UNKNOWN_ERROR;
    }
  }

  /**
   * Map error names to error codes
   */
  private mapErrorNameToErrorCode(errorName: string): ErrorCode {
    switch (errorName) {
      case 'ValidationError':
        return ErrorCode.VALIDATION_ERROR;
      case 'UnauthorizedError':
        return ErrorCode.AUTH_REQUIRED;
      case 'ForbiddenError':
        return ErrorCode.INSUFFICIENT_PERMISSIONS;
      case 'NotFoundError':
        return ErrorCode.RESOURCE_NOT_FOUND;
      case 'ConflictError':
        return ErrorCode.RESOURCE_CONFLICT;
      case 'DatabaseError':
        return ErrorCode.DATABASE_ERROR;
      default:
        return ErrorCode.UNKNOWN_ERROR;
    }
  }

  /**
   * Sanitize request data to remove sensitive information
   */
  private sanitizeRequest(request: Request): {
    method: string;
    url: string;
    userId?: string;
    ip: string;
    userAgent?: string;
  } {
    return {
      method: request.method,
      url: request.url,
      userId: (request as any).user?.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };
  }
} 
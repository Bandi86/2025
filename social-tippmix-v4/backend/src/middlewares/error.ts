import { Request, Response, NextFunction } from 'express';
import { ApiError, isOperationalError, createErrorResponse } from '../lib/error';
import { logError } from '../lib/logger';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

// Global error handling middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log the error
  logError('Error occurred', err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: (req.user as any)?.id || 'unauthenticated',
    body: process.env.NODE_ENV !== 'production' ? req.body : undefined,
  });

  // If headers are already sent, let Express handle it
  if (res.headersSent) {
    return next(err);
  }

  // Handle specific error types

  // 1. ApiError - Our custom error class
  if (err instanceof ApiError) {
    return res.status(err.status).json(createErrorResponse(err));
  }

  // 2. Prisma Errors
  if (err instanceof PrismaClientKnownRequestError) {
    const status = 400;
    const prismaError = {
      error: {
        message: 'Database operation failed',
        code: err.code,
        status,
        meta: err.meta,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
    };
    return res.status(status).json(prismaError);
  }

  if (err instanceof PrismaClientValidationError) {
    const status = 400;
    const prismaError = {
      error: {
        message: 'Invalid data provided for database operation',
        status,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
    };
    return res.status(status).json(prismaError);
  }

  // 3. Handle ZodError if somehow not caught earlier
  if (err.name === 'ZodError') {
    const status = 400;
    const zodError = {
      error: {
        message: 'Validation failed',
        status,
        details: err,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
    };
    return res.status(status).json(zodError);
  }

  // 4. Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    const status = 401;
    const jwtError = {
      error: {
        message: 'Invalid token',
        status,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
    };
    return res.status(status).json(jwtError);
  }

  if (err.name === 'TokenExpiredError') {
    const status = 401;
    const jwtError = {
      error: {
        message: 'Token expired',
        status,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
    };
    return res.status(status).json(jwtError);
  }

  // 5. Multer Errors
  if (err.name === 'MulterError') {
    const status = 400;
    const multerError = {
      error: {
        message: `File upload error: ${err.message}`,
        status,
        field: (err as any).field,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
    };
    return res.status(status).json(multerError);
  }

  // 6. Handle operational errors
  if (isOperationalError(err)) {
    return res.status(500).json({
      error: {
        message: err.message,
        status: 500,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
    });
  }

  // 7. For unexpected errors in production, don't expose details
  const responseMessage =
    process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;

  const responseData = {
    error: {
      message: responseMessage,
      status: 500,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  };

  return res.status(500).json(responseData);
}

// Not Found handler middleware
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const notFoundError = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
  next(notFoundError);
}

// Request Timeout middleware
export function requestTimeoutHandler(timeout: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set a timeout for the request
    const timeoutId = setTimeout(() => {
      const timeoutError = new ApiError(504, 'Request Timeout', 'REQUEST_TIMEOUT', 'HIGH', {
        timeoutMs: timeout,
      });
      next(timeoutError);
    }, timeout);

    // Clear the timeout when the response is sent
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime();

  // Add response listener to log after response
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';

    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime}ms`;

    if (logLevel === 'error') {
      logError(logMessage, null, {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.ip,
        userId: (req.user as any)?.id || 'unauthenticated',
      });
    } else {
      // Import dynamically to avoid circular dependencies
      const { logHttp, logWarning } = require('../lib/logger');

      if (logLevel === 'warn') {
        logWarning(logMessage, {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          responseTime: `${responseTime}ms`,
          ip: req.ip,
          userId: (req.user as any)?.id || 'unauthenticated',
        });
      } else {
        logHttp(logMessage, {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          responseTime: `${responseTime}ms`,
          ip: req.ip,
          userId: (req.user as any)?.id || 'unauthenticated',
        });
      }
    }
  });

  next();
}

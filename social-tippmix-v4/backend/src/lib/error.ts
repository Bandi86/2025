import { ZodError } from 'zod'
import { logError } from './logger'

// Error codes for better error categorization
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Database
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Business Logic
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',

  // File Operations
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Base API Error class
export class ApiError extends Error {
  public readonly status: number
  public readonly code: ErrorCode
  public readonly severity: ErrorSeverity
  public readonly timestamp: Date
  public readonly context?: Record<string, any>
  public readonly isOperational: boolean

  constructor(
    status: number,
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message)

    this.name = this.constructor.name
    this.status = status
    this.code = code
    this.severity = severity
    this.timestamp = new Date()
    this.context = context
    this.isOperational = isOperational

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)

    // Log the error
    logError(`${this.constructor.name}: ${message}`, this, {
      code: this.code,
      severity: this.severity,
      context: this.context,
      status: this.status
    })
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      severity: this.severity,
      timestamp: this.timestamp,
      context: this.context,
      ...(process.env.NODE_ENV !== 'production' && { stack: this.stack })
    }
  }
}

// Specific Error Classes
export class ValidationError extends ApiError {
  public readonly fields?: Array<{ field: string; message: string }>

  constructor(
    message: string = 'Validation failed',
    fields?: Array<{ field: string; message: string }>,
    context?: Record<string, any>
  ) {
    super(400, message, ErrorCode.VALIDATION_FAILED, ErrorSeverity.LOW, context)
    this.fields = fields
  }

  static fromZod(error: ZodError, message: string = 'Validation failed') {
    const fields = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }))

    return new ValidationError(message, fields, { zodError: error.errors })
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', identifier?: string, context?: Record<string, any>) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`

    super(404, message, ErrorCode.RESOURCE_NOT_FOUND, ErrorSeverity.LOW, {
      resource,
      identifier,
      ...context
    })
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(401, message, ErrorCode.UNAUTHORIZED, ErrorSeverity.MEDIUM, context)
  }
}

export class ForbiddenError extends ApiError {
  constructor(
    message: string = 'Access forbidden',
    requiredPermission?: string,
    context?: Record<string, any>
  ) {
    super(403, message, ErrorCode.FORBIDDEN, ErrorSeverity.MEDIUM, {
      requiredPermission,
      ...context
    })
  }
}

export class ConflictError extends ApiError {
  constructor(
    message: string = 'Resource conflict',
    conflictingField?: string,
    context?: Record<string, any>
  ) {
    super(409, message, ErrorCode.DUPLICATE_RESOURCE, ErrorSeverity.LOW, {
      conflictingField,
      ...context
    })
  }
}

export class DatabaseError extends ApiError {
  constructor(
    message: string = 'Database operation failed',
    operation?: string,
    context?: Record<string, any>
  ) {
    super(500, message, ErrorCode.DATABASE_ERROR, ErrorSeverity.HIGH, {
      operation,
      ...context
    })
  }
}

export class RateLimitError extends ApiError {
  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(429, message, ErrorCode.RATE_LIMIT_EXCEEDED, ErrorSeverity.MEDIUM, {
      retryAfter,
      ...context
    })
  }
}

export class FileUploadError extends ApiError {
  constructor(
    message: string = 'File upload failed',
    code: ErrorCode = ErrorCode.FILE_UPLOAD_FAILED,
    context?: Record<string, any>
  ) {
    super(400, message, code, ErrorSeverity.LOW, context)
  }
}

// Utility functions
export function isOperationalError(error: Error): boolean {
  if (error instanceof ApiError) {
    return error.isOperational
  }
  return false
}

export function createErrorResponse(error: ApiError) {
  return {
    error: {
      message: error.message,
      code: error.code,
      status: error.status,
      timestamp: error.timestamp,
      ...(error.context && { context: error.context }),
      ...(error instanceof ValidationError && error.fields && { fields: error.fields }),
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    }
  }
}

// Error factory functions for common scenarios
export const ErrorFactory = {
  userNotFound: (userId: string) => new NotFoundError('User', userId),

  postNotFound: (postId: string) => new NotFoundError('Post', postId),

  commentNotFound: (commentId: string) => new NotFoundError('Comment', commentId),

  invalidCredentials: () =>
    new UnauthorizedError('Invalid username or password', { code: ErrorCode.INVALID_CREDENTIALS }),

  insufficientPermissions: (action: string) =>
    new ForbiddenError(`Insufficient permissions to ${action}`, action),

  emailAlreadyExists: (email: string) =>
    new ConflictError('Email already exists', 'email', { email }),

  usernameAlreadyExists: (username: string) =>
    new ConflictError('Username already exists', 'username', { username }),

  fileTooLarge: (maxSize: string) =>
    new FileUploadError(`File size exceeds limit of ${maxSize}`, ErrorCode.FILE_TOO_LARGE),

  invalidFileType: (allowedTypes: string[]) =>
    new FileUploadError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      ErrorCode.INVALID_FILE_TYPE
    )
}

// Legacy function for backwards compatibility
export function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

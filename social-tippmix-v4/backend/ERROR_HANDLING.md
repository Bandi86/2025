# Error Handling System Documentation

This document describes the comprehensive error handling system implemented in the Social Tippmix v4 backend.

## Overview

The error handling system provides:

- Structured error logging using Winston
- Enhanced error classes with error codes and context
- Input validation with Zod
- Standardized error responses across the API
- Global error handling middleware

## Core Components

### 1. Error Classes

Located in `/src/lib/error.ts`, this file defines a hierarchy of error classes:

```typescript
class ApiError extends Error {
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;
  public readonly isOperational: boolean;

  // ...constructor and methods
}

// Specialized error classes
class ValidationError extends ApiError { /* ... */ }
class NotFoundError extends ApiError { /* ... */ }
class UnauthorizedError extends ApiError { /* ... */ }
class ForbiddenError extends ApiError { /* ... */ }
class ConflictError extends ApiError { /* ... */ }
class DatabaseError extends ApiError { /* ... */ }
class RateLimitError extends ApiError { /* ... */ }
class FileUploadError extends ApiError { /* ... */ }
```

### 2. Error Codes

```typescript
enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED, FORBIDDEN, TOKEN_EXPIRED, INVALID_CREDENTIALS,

  // Validation
  VALIDATION_FAILED, INVALID_INPUT, MISSING_REQUIRED_FIELD,

  // Database
  RESOURCE_NOT_FOUND, DUPLICATE_RESOURCE, DATABASE_ERROR,

  // ...and more
}
```

### 3. Structured Logging

Located in `/src/lib/logger.ts`, the logger provides multiple levels and formats:

```typescript
// Helper functions
export const logError = (message: string, error?: Error | any, meta?: any) => { /* ... */ }
export const logWarning = (message: string, meta?: any) => { /* ... */ }
export const logInfo = (message: string, meta?: any) => { /* ... */ }
export const logHttp = (message: string, meta?: any) => { /* ... */ }
export const logDebug = (message: string, meta?: any) => { /* ... */ }
```

### 4. Validation

Located in `/src/lib/validation.ts` and `/src/middlewares/validation.ts`:

```typescript
// Example validation schemas
export const registerUserSchema = z.object({ /* ... */ })
export const loginUserSchema = z.object({ /* ... */ })

// Middleware functions
export function validateSchema(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') { /* ... */ }
export function validateSchemas(schemas: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema; }) { /* ... */ }
```

### 5. Global Error Handling

Located in `/src/middlewares/error.ts`:

```typescript
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log the error
  logError('Error occurred', err, { /* request context */ })

  // Handle different error types (ApiError, Prisma errors, etc.)
  if (err instanceof ApiError) { /* ... */ }
  if (err instanceof PrismaClientKnownRequestError) { /* ... */ }
  // ...and more
}
```

## Usage Examples

### Handling Validation Errors

```typescript
// 1. Using schema validation middleware
router.post('/register', validateSchema(registerUserSchema), asyncHandler(register))

// 2. Manual validation in controller
const validationResult = createPostSchema.safeParse(req.body)
if (!validationResult.success) {
  throw ValidationError.fromZod(validationResult.error, 'Post validation failed')
}
```

### Throwing Custom Errors

```typescript
// Not Found Error
throw new NotFoundError('User', userId)

// Unauthorized Error
throw new UnauthorizedError('Authentication required')

// Forbidden Error
throw new ForbiddenError('Insufficient permissions', 'post:edit')

// Database Error
throw new DatabaseError('Failed to create post', 'insert', { postId })
```

### Error Factory Methods

```typescript
// Using factory methods for common errors
throw ErrorFactory.userNotFound(userId)
throw ErrorFactory.emailAlreadyExists(email)
throw ErrorFactory.insufficientPermissions('delete_post')
```

### Try-Catch in Controllers

```typescript
export async function someController(req: Request, res: Response, next: NextFunction) {
  try {
    // Controller logic here
    // ...
  } catch (error) {
    // Pass to global error handler
    next(error)
  }
}
```

## Testing Error Handling

The `/api/test` routes provide endpoints to test various error scenarios:

- `/api/test/validation-error`: Test validation errors
- `/api/test/not-found-error`: Test not found errors
- `/api/test/unauthorized-error`: Test unauthorized errors
- `/api/test/forbidden-error`: Test forbidden errors
- `/api/test/conflict-error`: Test conflict errors
- `/api/test/database-error`: Test database errors
- `/api/test/rate-limit-error`: Test rate limit errors
- `/api/test/file-upload-error`: Test file upload errors
- `/api/test/custom-error`: Test custom API errors
- `/api/test/internal-server-error`: Test internal server errors

## Error Response Format

Standard error response format:

```json
{
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "status": 400,
    "timestamp": "2025-05-22T10:30:45.123Z",
    "context": { /* Additional context */ },
    "fields": [ /* For validation errors only */ ]
  }
}
```

## Implementing in New Controllers

1. Import necessary error classes and logger:
   ```typescript
   import { NotFoundError, ValidationError } from '../lib/error'
   import { logInfo, logError } from '../lib/logger'
   ```

2. Use try-catch and pass errors to next():
   ```typescript
   export async function myController(req: Request, res: Response, next: NextFunction) {
     try {
       // Controller logic
     } catch (error) {
       next(error)
     }
   }
   ```

3. Use proper validation:
   ```typescript
   const validation = mySchema.safeParse(req.body)
   if (!validation.success) {
     throw ValidationError.fromZod(validation.error)
   }
   ```

4. Use appropriate error types:
   ```typescript
   if (!resource) {
     throw new NotFoundError('Resource', id)
   }

   if (!hasPermission) {
     throw new ForbiddenError('Insufficient permissions')
   }
   ```

5. Add structured logging:
   ```typescript
   logInfo('Operation successful', { resourceId, userId })
   ```

## Client-Side Error Handling

For consistent error handling in the frontend application, consider implementing the following:

### 1. Axios Error Interceptor

```typescript
// api/axios.ts
import axios from 'axios';
import { toast } from 'some-toast-library';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  withCredentials: true,
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorResponse = error.response?.data?.error;

    if (errorResponse) {
      // Handle specific error types
      switch (errorResponse.code) {
        case 'UNAUTHORIZED':
        case 'TOKEN_EXPIRED':
          toast.error('Please log in to continue');
          // Redirect to login page if needed
          break;

        case 'FORBIDDEN':
          toast.error('You do not have permission to perform this action');
          break;

        case 'VALIDATION_FAILED':
          // Format validation errors for forms
          if (errorResponse.fields) {
            return Promise.reject({
              message: errorResponse.message,
              fields: errorResponse.fields.reduce((acc, field) => {
                acc[field.field] = field.message;
                return acc;
              }, {})
            });
          }
          toast.error(errorResponse.message || 'Validation failed');
          break;

        case 'RESOURCE_NOT_FOUND':
          toast.error(errorResponse.message || 'Resource not found');
          break;

        default:
          toast.error(errorResponse.message || 'An error occurred');
      }

      return Promise.reject(errorResponse);
    }

    // Generic error handling
    toast.error('An unexpected error occurred. Please try again later.');
    return Promise.reject(error);
  }
);

export default api;
```

### 2. React Query Error Handling

When using React Query for data fetching:

```typescript
import { useQuery, useMutation } from 'react-query';
import api from '../api/axios';

// For queries
const useFetchData = (id) => {
  return useQuery(['data', id],
    () => api.get(`/api/resource/${id}`),
    {
      onError: (error) => {
        // Error already handled by axios interceptor
        console.error('Query error:', error);
      },
    }
  );
};

// For mutations
const useUpdateData = () => {
  return useMutation(
    (data) => api.post('/api/resource', data),
    {
      onError: (error) => {
        // Additional error handling if needed
      },
    }
  );
};
```

### 3. Form Validation with Error Handling

Using a form library like Formik or React Hook Form:

```typescript
import { useForm } from 'react-hook-form';
import api from '../api/axios';

const MyForm = () => {
  const { register, handleSubmit, setError, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/api/resource', data);
      // Handle success
    } catch (error) {
      // Handle validation errors from API
      if (error.fields) {
        Object.entries(error.fields).forEach(([field, message]) => {
          setError(field, { type: 'server', message });
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

### 4. Global Error Boundary

Using React Error Boundary for catching rendering errors:

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error boundary caught error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>Please try again or contact support if the problem persists.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Use this error boundary in your app:

```tsx
// In your app root or page components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 5. Error Status Pages

Create dedicated error pages for common HTTP error codes:

- 404 Not Found page
- 403 Forbidden page
- 500 Server Error page

These can be implemented as Next.js error pages or React Router components based on your frontend structure.

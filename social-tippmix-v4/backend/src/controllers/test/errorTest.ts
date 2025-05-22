import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
  RateLimitError,
  FileUploadError,
  ErrorCode,
  ErrorSeverity,
} from '../lib/error';
import { logInfo, logError, logWarning } from '../lib/logger';
import prisma from '../lib/client';

// Teszt validációs séma
const testSchema = z.object({
  id: z.string().min(1, 'ID is required').uuid('ID must be a valid UUID'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().min(18, 'You must be at least 18 years old'),
});

// API végpontok a különböző hibatípusok teszteléséhez
export const testErrorHandling = {
  // 1. Validation Error teszt
  testValidationError: async (req: Request, res: Response, next: NextFunction) => {
    try {
      logInfo('Testing validation error', { body: req.body });

      // Zod validáció
      const result = testSchema.safeParse(req.body);

      if (!result.success) {
        throw ValidationError.fromZod(result.error, 'Validation test failed');
      }

      res.json({ success: true, data: result.data });
    } catch (err) {
      next(err);
    }
  },

  // 2. Not Found Error teszt
  testNotFoundError: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id || 'test-id';
      logInfo('Testing not found error', { id });

      throw new NotFoundError('User', id, { reason: 'Testing not found error' });
    } catch (err) {
      next(err);
    }
  },

  // 3. Unauthorized Error teszt
  testUnauthorizedError: async (req: Request, res: Response, next: NextFunction) => {
    try {
      logInfo('Testing unauthorized error');

      throw new UnauthorizedError('Authentication is required to access this resource');
    } catch (err) {
      next(err);
    }
  },

  // 4. Forbidden Error teszt
  testForbiddenError: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resource = (req.query.resource as string) || 'post';
      const action = (req.query.action as string) || 'delete';

      logInfo('Testing forbidden error', { resource, action });

      throw new ForbiddenError(
        `You do not have permission to ${action} this ${resource}`,
        `${resource}:${action}`,
        { userId: req.user?.id || 'anonymous' }
      );
    } catch (err) {
      next(err);
    }
  },

  // 5. Conflict Error teszt
  testConflictError: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = (req.query.email as string) || 'test@example.com';

      logInfo('Testing conflict error', { email });

      throw new ConflictError('User with this email already exists', 'email', { email });
    } catch (err) {
      next(err);
    }
  },

  // 6. Database Error teszt
  testDatabaseError: async (req: Request, res: Response, next: NextFunction) => {
    try {
      logInfo('Testing database error');

      // Szándékosan hibás Prisma lekérdezés
      await prisma.$queryRaw`SELECT * FROM nonexistent_table`;
    } catch (err) {
      // Átkonvertáljuk a hibát egy DatabaseError-rá
      const dbError = new DatabaseError('Failed to execute database query', 'SELECT', {
        originalError: (err as Error).message,
      });
      next(dbError);
    }
  },

  // 7. Rate Limit Error teszt
  testRateLimitError: async (req: Request, res: Response, next: NextFunction) => {
    try {
      logInfo('Testing rate limit error');

      throw new RateLimitError(
        'Too many requests, please try again later',
        60, // 60 másodperc múlva próbálkozhat újra
        { ip: req.ip, endpoint: req.originalUrl }
      );
    } catch (err) {
      next(err);
    }
  },

  // 8. File Upload Error teszt
  testFileUploadError: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileType = (req.query.type as string) || 'image/gif';

      logInfo('Testing file upload error', { fileType });

      throw new FileUploadError('Invalid file type provided', ErrorCode.INVALID_FILE_TYPE, {
        providedType: fileType,
        allowedTypes: ['image/jpeg', 'image/png'],
      });
    } catch (err) {
      next(err);
    }
  },

  // 9. Egyedi API Error teszt
  testCustomError: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = parseInt(req.query.status as string) || 400;
      const code = (req.query.code as ErrorCode) || ErrorCode.INTERNAL_ERROR;
      const severity = (req.query.severity as ErrorSeverity) || ErrorSeverity.MEDIUM;

      logInfo('Testing custom API error', { status, code, severity });

      throw new ApiError(
        status,
        'This is a custom API error for testing purposes',
        code,
        severity,
        {
          customField: 'custom value',
          timestamp: new Date().toISOString(),
        }
      );
    } catch (err) {
      next(err);
    }
  },

  // 10. Szimulált belső szerver hiba
  testInternalServerError: async (req: Request, res: Response, next: NextFunction) => {
    try {
      logInfo('Testing internal server error');

      // Szimulált nem-operációs hiba
      const simulatedError = new Error('This is a simulated internal server error');
      simulatedError.stack = 'Simulated stack trace for testing purposes';

      logError('Unhandled error occurred', simulatedError);
      throw simulatedError;
    } catch (err) {
      next(err);
    }
  },

  // Sikeres válasz - minden rendben
  testSuccess: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message =
        (req.query.message as string) || 'Error handling system is working correctly!';
      logInfo('Testing success response', { message });

      res.json({
        success: true,
        message,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
};

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../lib/error';

// Validation middleware factory
export function validateSchema(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let dataToValidate;

      switch (target) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        default:
          dataToValidate = req.body;
      }

      // Validate the data
      const validatedData = schema.parse(dataToValidate);

      // Replace the original data with validated data
      switch (target) {
        case 'body':
          req.body = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = ValidationError.fromZod(error);
        next(validationError);
      } else {
        next(error);
      }
    }
  };
}

// Multiple schema validation middleware
export function validateSchemas(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validate query if schema provided
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      // Validate params if schema provided
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = ValidationError.fromZod(error);
        next(validationError);
      } else {
        next(error);
      }
    }
  };
}

// File validation middleware
export function validateFile(options: {
  required?: boolean;
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;

    // Check if file is required
    if (options.required && !file) {
      return next(new ValidationError('File is required'));
    }

    // If no file and not required, skip validation
    if (!file && !options.required) {
      return next();
    }

    if (file) {
      // Check file size
      if (options.maxSize && file.size > options.maxSize) {
        return next(new ValidationError(`File size exceeds limit of ${options.maxSize} bytes`));
      }

      // Check mime type
      if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
        return next(
          new ValidationError(
            `Invalid file type. Allowed types: ${options.allowedMimeTypes.join(', ')}`
          )
        );
      }

      // Check file extension
      if (options.allowedExtensions) {
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        if (!fileExtension || !options.allowedExtensions.includes(fileExtension)) {
          return next(
            new ValidationError(
              `Invalid file extension. Allowed extensions: ${options.allowedExtensions.join(', ')}`
            )
          );
        }
      }
    }

    next();
  };
}

// Conditional validation middleware
export function validateConditional(
  condition: (req: Request) => boolean,
  schema: ZodSchema,
  target: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      return validateSchema(schema, target)(req, res, next);
    }
    next();
  };
}

// Sanitization middleware
export function sanitizeInput() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Recursively sanitize object
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        // Basic HTML tag removal and trim
        return obj.replace(/<[^>]*>/g, '').trim();
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitize(value);
        }
        return sanitized;
      }

      return obj;
    };

    // Sanitize body, query, and params
    if (req.body) {
      req.body = sanitize(req.body);
    }

    if (req.query) {
      req.query = sanitize(req.query);
    }

    if (req.params) {
      req.params = sanitize(req.params);
    }

    next();
  };
}

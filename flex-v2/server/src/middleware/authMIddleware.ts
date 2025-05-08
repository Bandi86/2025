import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/error'
import * as jwt from 'jsonwebtoken'


// Extend the Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string; email?: string; [key: string]: any } // Adjusted user type
    }
  }
}

export function authMiddleware (req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.authToken

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization
    const headerToken = authHeader.split(' ')[1]
    if (authHeader.startsWith('Bearer ') && headerToken) {
      token = headerToken
    }
  }

  if (!token) {
    return next(new ApiError(401, 'Hozzáférés megtagadva. Token szükséges.'))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string)

    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'id' in decoded &&
      'username' in decoded
    ) {
      // Ensure the properties exist and cast them to the expected types for req.user
      req.user = {
        id: String(decoded.id),
        username: String(decoded.username)
        // email: decoded.email ? String(decoded.email) : undefined, // Example if email is in JWT
        // Add other properties from decoded if they are part of your JWT payload and req.user type
      }
      next() // Call next() only on successful verification and assignment
    } else {
      // If token is valid but payload structure is not as expected
      return next(new ApiError(401, 'Érvénytelen token tartalom.'))
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'Lejárt token.'))
    }
    // For other jwt errors (JsonWebTokenError, NotBeforeError) or unexpected errors
    return next(new ApiError(401, 'Érvénytelen token.'))
  }
}

import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/client';
import { UnauthorizedError, DatabaseError, ApiError, ErrorCode } from '../../lib/error';
import { logAuth, logError } from '../../lib/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret';
const NODE_ENV = process.env.NODE_ENV || 'development';

export default async function login(req: Request, res: Response, next: NextFunction) {
  interface AuthInfo {
    message?: string;
  }

  interface User {
    id: string;
    username: string;
    password: string;
    role: string;
  }

  passport.authenticate('local', (err: any, user: User | false, info: AuthInfo | undefined) => {
    if (err) {
      // Handle Passport authentication error
      logError('Authentication error', err);
      return next(new ApiError(500, 'Authentication error occurred', ErrorCode.INTERNAL_ERROR));
    }

    if (!user) {
      // Handle invalid credentials
      logAuth('login_failed', undefined, { username: req.body.username, message: info?.message });
      return next(
        new UnauthorizedError(info?.message || 'Invalid credentials', {
          code: ErrorCode.INVALID_CREDENTIALS,
          username: req.body.username,
        })
      );
    }

    req.logIn(user, async (err: any) => {
      if (err) return next(err);

      try {
        // Update user online status and last login time
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isOnline: true,
            lastLogin: new Date(),
          },
        });

        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '1d' }
        );

        // Set JWT as an HTTPOnly cookie
        res.cookie('session_token', token, {
          httpOnly: true,
          secure: NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        });

        // Log successful login
        logAuth('login_success', user.id, { username: user.username, role: user.role });

        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        res.json({
          user: userWithoutPassword,
          sessionId: req.sessionID,
        });
      } catch (error) {
        // Handle database errors
        logError('Login database operation failed', error);
        return next(
          new DatabaseError('Failed to update user login status', 'update', {
            userId: user.id,
          })
        );
      }
    });
  })(req, res, next);
}

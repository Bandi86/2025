import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import { DatabaseError } from '../../lib/error';
import { logAuth, logError } from '../../lib/logger';

// Define a type for the user object if it's not already globally available
interface AuthenticatedUser {
  id: string;
  username?: string;
  // Add other properties from your JWT payload if needed
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as AuthenticatedUser | undefined;

    // Clear the session_token cookie
    res.clearCookie('session_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    if (user && user.id) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { isOnline: false },
        });

        // Log successful logout
        logAuth('user_logout', user.id, { username: user.username });
      } catch (dbError) {
        // Log the error but continue with the logout process
        logError('Failed to update user online status during logout', dbError, { userId: user.id });
      }
    }

    // Handle session logout
    req.logout(function (err) {
      if (err) {
        logError('Error during session logout', err, { userId: user?.id });
        return next(
          new DatabaseError('Failed to complete logout', 'session', { error: err.message })
        );
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  } catch (error) {
    next(error);
  }
}

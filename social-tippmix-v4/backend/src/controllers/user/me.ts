import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import { UnauthorizedError, NotFoundError } from '../../lib/error';
import { logInfo } from '../../lib/logger';

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const userId = (req.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        status: true,
        isOnline: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    logInfo('User retrieved profile', { userId });

    res.json(user);
  } catch (error) {
    next(error);
  }
}

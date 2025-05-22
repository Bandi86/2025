import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import { getPagination } from '../../lib/pagination';
import { getFilters } from '../../lib/filters';
import { getSorting } from '../../lib/sorting';
import { getSearch } from '../../lib/search';
import { DatabaseError, ForbiddenError } from '../../lib/error';
import { logInfo, logError } from '../../lib/logger';

export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if user has admin privileges
    const user = req.user as any;
    if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      throw new ForbiddenError('Insufficient permissions to access user list', 'users:list');
    }

    const { page = '1', pageSize = '10', ...filters } = req.query;
    const pageStr = Array.isArray(page) ? page[0] : page;
    const pageSizeStr = Array.isArray(pageSize) ? pageSize[0] : pageSize;
    const take = Math.max(1, Math.min(100, parseInt(pageSizeStr as string, 10) || 10));
    const skip = (Math.max(1, parseInt(pageStr as string, 10) || 1) - 1) * take;

    const pagination = getPagination({ page: String(pageStr), pageSize: String(pageSizeStr) });
    const search = getSearch({ ...req.query });
    const sorting = getSorting({ ...req.query });
    const filter = getFilters({ ...req.query });

    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: {
            ...filter,
            ...(search && {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }),
          },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
            isOnline: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
            // Exclude sensitive data
            password: false,
          },
          skip,
          take,
          orderBy: sorting,
        }),
        prisma.user.count({
          where: {
            ...filter,
            ...(search && {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }),
          },
        }),
      ]);

      logInfo('User list retrieved', {
        admin: user.id,
        filters: Object.keys(filter).length > 0 ? filter : 'none',
        search: search || 'none',
        count: users.length,
        total,
      });

      res.json({
        users,
        pagination: {
          ...pagination,
          total,
          pages: Math.ceil(total / take),
        },
      });
    } catch (dbError) {
      throw new DatabaseError('Failed to retrieve user list', 'query', {
        error: (dbError as Error).message,
      });
    }
  } catch (error) {
    next(error);
  }
}

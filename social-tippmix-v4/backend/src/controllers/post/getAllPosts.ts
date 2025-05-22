import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import { DatabaseError, ValidationError } from '../../lib/error';
import { postQuerySchema, PostQueryInput } from '../../lib/validation';
import { logInfo, logError } from '../../lib/logger';

export async function getAllPosts(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate query parameters with Zod
    const validationResult = postQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      throw ValidationError.fromZod(validationResult.error, 'Invalid query parameters');
    }

    // Extract validated query parameters
    const {
      category,
      authorId,
      tag: tagId,
      search,
      sort: sortBy = 'createdAt',
      order: sortOrder = 'desc',
      page = '1',
      pageSize = '10',
    } = validationResult.data as PostQueryInput;

    // Build Prisma where clause
    const where: any = {};
    if (category) where.category = category;
    if (authorId) where.authorId = authorId;
    if (tagId) where.tags = { some: { name: tagId } };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Set up ordering
    let orderBy: any = { [sortBy as string]: sortOrder };

    // Special ordering by counts
    if (sortBy === 'likes') {
      orderBy = { likes: { _count: sortOrder } };
    } else if ((sortBy as string) === 'comments') {
      orderBy = { comments: { _count: sortOrder } };
    }

    // Set up pagination
    const take = Math.max(1, Math.min(100, parseInt(String(pageSize), 10) || 10));
    const skip = (Math.max(1, parseInt(String(page), 10) || 1) - 1) * take;
    const pageNumber = Math.max(1, parseInt(String(page), 10) || 1);

    try {
      // Fetch posts and total count
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            tags: true,
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        }),
        prisma.post.count({ where }),
      ]);

      // Log post retrieval
      logInfo('Posts retrieved', {
        filters: {
          category,
          authorId,
          tagId,
          search,
        },
        pagination: {
          page: pageNumber,
          pageSize: take,
          total,
        },
        count: posts.length,
      });

      // Return posts with pagination info
      res.json({
        success: true,
        total,
        page: pageNumber,
        pageSize: take,
        totalPages: Math.ceil(total / take),
        posts,
      });
    } catch (dbError) {
      throw new DatabaseError('Failed to retrieve posts', 'query', {
        error: (dbError as Error).message,
      });
    }
  } catch (error) {
    next(error);
  }
}

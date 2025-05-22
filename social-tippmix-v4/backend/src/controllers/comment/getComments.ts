import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import { ValidationError, DatabaseError } from '../../lib/error';
import { z } from 'zod';
import { logInfo } from '../../lib/logger';

// Query schema for the getComments endpoint
const commentsQuerySchema = z.object({
  postId: z.string().optional(),
  authorId: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'likes']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate query parameters
    const validation = commentsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      throw ValidationError.fromZod(validation.error, 'Invalid query parameters');
    }

    // Extract validated parameters
    const { postId, authorId, page, pageSize, sortBy, sortOrder } = validation.data;

    // Set up pagination
    const take = Math.max(1, Math.min(100, pageSize || 20));
    const skip = (Math.max(1, page || 1) - 1) * take;
    const pageNumber = Math.max(1, page || 1);

    // Set up filtering
    const where: any = {};
    if (postId) where.postId = postId;
    if (authorId) where.authorId = authorId;

    // Set up ordering
    let orderBy: any = { [sortBy]: sortOrder };

    if (sortBy === 'likes') {
      orderBy = { likes: { _count: sortOrder } };
    }

    try {
      // Fetch comments and total count
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
        }),
        prisma.comment.count({ where }),
      ]);

      // Get current user ID for context
      const currentUserId = (req.user as any)?.id || 'anonymous';

      // Log comments retrieval
      logInfo('Comments retrieved', {
        filters: {
          postId,
          authorId,
        },
        pagination: {
          page: pageNumber,
          pageSize: take,
          total,
        },
        count: comments.length,
        requestedBy: currentUserId,
      });

      // Return comments with pagination info
      res.json({
        success: true,
        total,
        page: pageNumber,
        pageSize: take,
        totalPages: Math.ceil(total / take),
        comments: comments.map((comment) => ({
          ...comment,
          likesCount: comment._count.likes,
        })),
      });
    } catch (dbError) {
      throw new DatabaseError('Failed to retrieve comments', 'query', {
        error: (dbError as Error).message,
      });
    }
  } catch (error) {
    next(error);
  }
}

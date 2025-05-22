import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import { ValidationError, NotFoundError, DatabaseError } from '../../lib/error';
import { idParamSchema } from '../../lib/validation';
import { logInfo } from '../../lib/logger';

export async function getCommentById(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate path parameter (comment ID)
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      throw ValidationError.fromZod(validation.error, 'Invalid comment ID');
    }

    const { id } = validation.data;

    try {
      // Find the comment
      const comment = await prisma.comment.findUnique({
        where: { id },
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
              authorId: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundError('Comment', id);
      }

      // Get current user ID for context
      const currentUserId = (req.user as any)?.id || 'anonymous';

      // Calculate if current user has liked this comment
      const userHasLiked = comment.likes.some((like) => like.userId === currentUserId);

      // Log comment view
      logInfo('Comment retrieved', {
        commentId: id,
        postId: comment.postId,
        viewedBy: currentUserId,
      });

      // Return comment with additional context
      res.json({
        success: true,
        comment: {
          ...comment,
          userHasLiked,
          likesCount: comment._count.likes,
        },
      });
    } catch (dbError) {
      if (!(dbError instanceof NotFoundError)) {
        throw new DatabaseError('Failed to retrieve comment', 'query', {
          error: (dbError as Error).message,
          commentId: id,
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
}

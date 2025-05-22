import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  DatabaseError,
} from '../../lib/error';
import { idParamSchema } from '../../lib/validation';
import { logInfo, logWarning, logError } from '../../lib/logger';

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate post ID
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      throw ValidationError.fromZod(validation.error, 'Invalid post ID');
    }

    const { id } = validation.data;

    // Get authenticated user ID
    let userId: string | undefined;
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      userId = (req.user as any).id;
    } else if (req.session && req.session.userId) {
      userId = req.session.userId;
    }

    if (!userId) {
      throw new UnauthorizedError('Authentication required to delete a post');
    }

    // Get user role to check if admin/moderator
    const userRole = (req.user as any)?.role || 'USER';
    const isAdminOrModerator = ['ADMIN', 'MODERATOR'].includes(userRole);

    try {
      // Find the post
      const post = await prisma.post.findUnique({ where: { id } });

      if (!post) {
        throw new NotFoundError('Post', id);
      }

      // Check permissions
      if (post.authorId !== userId && !isAdminOrModerator) {
        logWarning('Unauthorized post deletion attempt', {
          postId: id,
          attemptedBy: userId,
          postAuthor: post.authorId,
        });

        throw new ForbiddenError('You do not have permission to delete this post', 'post:delete', {
          postId: id,
        });
      }

      // Log who is deleting the post and why
      const deletionReason = post.authorId === userId ? 'own_post' : 'admin_action';

      // Delete the post with cascade to comments, likes, etc.
      await prisma.post.delete({ where: { id } });

      logInfo('Post deleted', {
        postId: id,
        title: post.title,
        deletedBy: userId,
        originalAuthor: post.authorId,
        reason: deletionReason,
      });

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (dbError) {
      if (!(dbError instanceof NotFoundError || dbError instanceof ForbiddenError)) {
        throw new DatabaseError('Failed to delete post', 'delete', {
          error: (dbError as Error).message,
          postId: id,
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
}

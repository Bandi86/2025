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
import { logInfo, logWarning } from '../../lib/logger';

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate comment ID
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      throw ValidationError.fromZod(validation.error, 'Invalid comment ID');
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
      throw new UnauthorizedError('Authentication required to delete a comment');
    }

    // Get user role to check if admin/moderator
    const userRole = (req.user as any)?.role || 'USER';
    const isAdminOrModerator = ['ADMIN', 'MODERATOR'].includes(userRole);

    try {
      // Find the comment
      const comment = await prisma.comment.findUnique({
        where: { id },
        include: { post: { select: { id: true, authorId: true } } },
      });

      if (!comment) {
        throw new NotFoundError('Comment', id);
      }

      // Check permissions
      const isPostAuthor = comment.post.authorId === userId;
      const isCommentAuthor = comment.authorId === userId;

      if (!isCommentAuthor && !isAdminOrModerator && !isPostAuthor) {
        logWarning('Unauthorized comment deletion attempt', {
          commentId: id,
          attemptedBy: userId,
          commentAuthor: comment.authorId,
        });

        throw new ForbiddenError(
          'You do not have permission to delete this comment',
          'comment:delete',
          { commentId: id }
        );
      }

      // Log who is deleting the comment and why
      const deletionReason = isCommentAuthor
        ? 'own_comment'
        : isAdminOrModerator
        ? 'admin_action'
        : 'post_owner';

      // Delete the comment
      await prisma.comment.delete({ where: { id } });

      logInfo('Comment deleted', {
        commentId: id,
        deletedBy: userId,
        originalAuthor: comment.authorId,
        reason: deletionReason,
      });

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (dbError) {
      if (!(dbError instanceof NotFoundError || dbError instanceof ForbiddenError)) {
        throw new DatabaseError('Failed to delete comment', 'delete', {
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

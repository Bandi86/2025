import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  DatabaseError,
} from '../../lib/error';
import { updateCommentSchema, UpdateCommentInput, idParamSchema } from '../../lib/validation';
import { logInfo, logWarning } from '../../lib/logger';

export async function editComment(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate path parameter (comment ID)
    const pathValidation = idParamSchema.safeParse(req.params);
    if (!pathValidation.success) {
      throw ValidationError.fromZod(pathValidation.error, 'Invalid comment ID');
    }
    const { id } = pathValidation.data;

    // Validate request body
    const bodyValidation = updateCommentSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      throw ValidationError.fromZod(bodyValidation.error, 'Invalid comment data');
    }
    const { content } = bodyValidation.data as UpdateCommentInput;

    // Get authenticated user ID
    let userId: string | undefined;
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      userId = (req.user as any).id;
    } else if (req.session && req.session.userId) {
      userId = req.session.userId;
    }

    if (!userId) {
      throw new UnauthorizedError('Authentication required to edit a comment');
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

      if (!isCommentAuthor && !isAdminOrModerator) {
        logWarning('Unauthorized comment edit attempt', {
          commentId: id,
          attemptedBy: userId,
          commentAuthor: comment.authorId,
        });

        throw new ForbiddenError(
          'You do not have permission to edit this comment',
          'comment:edit',
          { commentId: id }
        );
      }

      // Get original content for logging
      const originalContent = comment.content;

      // Update the comment
      const updated = await prisma.comment.update({
        where: { id },
        data: { content },
        include: {
          author: { select: { id: true, username: true, avatar: true } },
          post: { select: { id: true, title: true } },
        },
      });

      logInfo('Comment edited', {
        commentId: id,
        postId: comment.postId,
        editedBy: userId,
        originalAuthor: comment.authorId,
        contentChanged: originalContent !== content,
        isAdminEdit: isAdminOrModerator && !isCommentAuthor,
      });

      res.json({
        success: true,
        message: 'Comment updated successfully',
        comment: updated,
      });
    } catch (dbError) {
      if (!(dbError instanceof NotFoundError || dbError instanceof ForbiddenError)) {
        throw new DatabaseError('Failed to update comment', 'update', {
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

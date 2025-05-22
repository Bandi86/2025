import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  DatabaseError,
} from '../../lib/error';
import { updatePostSchema, UpdatePostInput, idParamSchema } from '../../lib/validation';
import { logInfo, logWarning } from '../../lib/logger';

/**
 * Get a post for editing
 * This controller fetches a post and checks if the user has permission to edit it
 */
export async function editPost(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate path parameter (post ID)
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
      throw new UnauthorizedError('Authentication required to edit a post');
    }

    // Get user role to check if admin/moderator
    const userRole = (req.user as any)?.role || 'USER';
    const isAdminOrModerator = ['ADMIN', 'MODERATOR'].includes(userRole);

    try {
      // Fetch the post with all needed relations for editing
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          tags: true,
        },
      });

      if (!post) {
        throw new NotFoundError('Post', id);
      }

      // Check if user has permission to edit
      if (post.authorId !== userId && !isAdminOrModerator) {
        logWarning('Unauthorized post edit attempt', {
          postId: id,
          attemptedBy: userId,
          postAuthor: post.authorId,
        });

        throw new ForbiddenError('You do not have permission to edit this post', 'post:edit', {
          postId: id,
        });
      }

      // Fetch available tags for dropdown options
      const availableTags = await prisma.tag.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Fetch available categories (if using an enum, this would come from schema)
      const categories = Object.values(prisma.PostCategory);

      logInfo('Post fetched for editing', {
        postId: id,
        userId,
        isAuthor: post.authorId === userId,
        isAdmin: isAdminOrModerator,
      });

      res.json({
        success: true,
        post,
        meta: {
          availableTags,
          categories,
          userCanEdit: true,
        },
      });
    } catch (dbError) {
      if (!(dbError instanceof NotFoundError || dbError instanceof ForbiddenError)) {
        throw new DatabaseError('Failed to fetch post for editing', 'query', {
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

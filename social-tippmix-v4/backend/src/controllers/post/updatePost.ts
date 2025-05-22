import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
} from '../../lib/error';
import { updatePostSchema, UpdatePostInput, idParamSchema } from '../../lib/validation';
import { logInfo, logWarning } from '../../lib/logger';
import slugify from 'slugify';

export async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate path parameter (post ID)
    const pathValidation = idParamSchema.safeParse(req.params);
    if (!pathValidation.success) {
      throw ValidationError.fromZod(pathValidation.error, 'Invalid post ID');
    }
    const { id } = pathValidation.data;

    // Validate request body
    const bodyValidation = updatePostSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      throw ValidationError.fromZod(bodyValidation.error, 'Invalid post update data');
    }
    const updateData = bodyValidation.data as UpdatePostInput;

    // Get authenticated user ID
    let userId: string | undefined;
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      userId = (req.user as any).id;
    } else if (req.session && req.session.userId) {
      userId = req.session.userId;
    }

    if (!userId) {
      throw new UnauthorizedError('Authentication required to update a post');
    }

    // Get user role to check if admin/moderator
    const userRole = (req.user as any)?.role || 'USER';
    const isAdminOrModerator = ['ADMIN', 'MODERATOR'].includes(userRole);

    try {
      // Fetch the post
      const post = await prisma.post.findUnique({
        where: { id },
        include: { tags: true },
      });

      if (!post) {
        throw new NotFoundError('Post', id);
      }

      // Check permissions
      if (post.authorId !== userId && !isAdminOrModerator) {
        logWarning('Unauthorized post update attempt', {
          postId: id,
          attemptedBy: userId,
          postAuthor: post.authorId,
        });

        throw new ForbiddenError('You do not have permission to update this post', 'post:update', {
          postId: id,
        });
      }
      // Generate slug if title is changing
      let slugToUse = post.slug;
      if (updateData.title) {
        slugToUse = slugify(updateData.title, { lower: true, strict: true });
      }

      // Check slug uniqueness if changing
      if (slugToUse !== post.slug) {
        const existingSlug = await prisma.post.findUnique({
          where: {
            slug: slugToUse,
            NOT: { id }, // Exclude the current post
          },
        });

        if (existingSlug) {
          // Generate unique slug by appending timestamp
          const timestamp = new Date().getTime().toString().slice(-6);
          slugToUse = `${slugToUse}-${timestamp}`;

          logInfo('Generated unique slug for post update', {
            postId: id,
            originalSlug: slugify(updateData.title!, { lower: true, strict: true }),
            newSlug: slugToUse,
          });
        }
      }

      // Prepare tag connections if provided
      const tagConnections = updateData.tags
        ? { set: updateData.tags.map((tagId: string) => ({ id: tagId })) }
        : undefined;

      // Update the post
      const updated = await prisma.post.update({
        where: { id },
        data: {
          title: updateData.title,
          content: updateData.content,
          slug: slugToUse,
          category: updateData.category as any, // Type cast to work with Prisma enum
          imageUrl: updateData.imageUrl,
          tags: tagConnections,
        },
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

      logInfo('Post updated', {
        postId: id,
        updatedBy: userId,
        fields: Object.keys(updateData),
        tagsUpdated: !!tagConnections,
      });

      res.json({
        success: true,
        message: 'Post updated successfully',
        post: updated,
      });
    } catch (dbError) {
      if (!(dbError instanceof NotFoundError || dbError instanceof ForbiddenError)) {
        throw new DatabaseError('Failed to update post', 'update', {
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

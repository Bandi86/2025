import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import { NotFoundError, ValidationError, DatabaseError } from '../../lib/error';
import { logInfo, logError } from '../../lib/logger';

export async function getPostById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('ID parameter is required', [
        { field: 'id', message: 'Post ID or slug is required' },
      ]);
    }

    try {
      // Find post by ID or slug
      const post = await prisma.post.findFirst({
        where: {
          OR: [{ id }, { slug: id }],
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
              _count: { select: { likes: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          likes: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
      });

      if (!post) {
        throw new NotFoundError('Post', id);
      }

      // Ensure imageUrl is always present (null if missing or undefined)
      const postWithDefaults = {
        ...post,
        imageUrl: post.imageUrl ?? null,
      };

      // Log post view
      const userId = (req.user as any)?.id || 'anonymous';
      logInfo('Post viewed', {
        postId: post.id,
        slug: post.slug,
        title: post.title,
        viewedBy: userId,
      });

      // Note: PostView tracking is disabled because PostView model is not defined
      // TODO: Consider adding PostView model to schema.prisma if view tracking is needed

      res.json(postWithDefaults);
    } catch (dbError) {
      if (!(dbError instanceof NotFoundError)) {
        throw new DatabaseError('Failed to retrieve post', 'query', {
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

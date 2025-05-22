import { NextFunction, Request, Response } from 'express';
import prisma from '../../lib/client';
import slugify from 'slugify';
import { ValidationError, UnauthorizedError, ConflictError, DatabaseError } from '../../lib/error';
import { logInfo, logError } from '../../lib/logger';
import { CreatePostInput, createPostSchema } from '../../lib/validation';

export async function createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate input with Zod
    const validationResult = createPostSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw ValidationError.fromZod(validationResult.error, 'Post validation failed');
    }

    const { title, content, category, imageUrl, tags } = validationResult.data as CreatePostInput;

    // Generate slug from title
    let postSlug = slugify(title, { lower: true, strict: true });

    // Check for authenticated user
    let authorId: string | undefined;
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      authorId = (req.user as any).id;
    } else if (req.session && req.session.userId) {
      authorId = req.session.userId;
    }

    if (!authorId) {
      throw new UnauthorizedError('Authentication required to create a post');
    }

    // Check if slug already exists
    const existingSlug = await prisma.post.findUnique({ where: { slug: postSlug } });
    if (existingSlug) {
      // Generate a unique slug by appending a timestamp
      const timestamp = new Date().getTime().toString().slice(-6);
      postSlug = `${postSlug}-${timestamp}`;

      logInfo('Generated unique slug for post', {
        originalSlug: postSlug,
        newSlug: postSlug,
        userId: authorId,
      });
    }

    try {
      // Create post
      const post = await prisma.post.create({
        data: {
          title,
          content,
          slug: postSlug,
          category: category as any, // Type cast to work with Prisma enum
          imageUrl,
          authorId,
          // Connect tags if provided
          tags:
            tags && Array.isArray(tags)
              ? { connect: tags.map((tagId: string) => ({ id: tagId })) }
              : undefined,
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

      logInfo('Post created successfully', {
        postId: post.id,
        authorId,
        category,
        tagsCount: post.tags?.length || 0,
      });

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        post,
      });
    } catch (dbError) {
      throw new DatabaseError('Failed to create post', 'insert', {
        error: (dbError as Error).message,
      });
    }
  } catch (error) {
    next(error);
  }
}

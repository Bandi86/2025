import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  DatabaseError
} from '../../lib/error'
import { likeSchema, LikeInput, idParamSchema } from '../../lib/validation'
import { logInfo, logWarning } from '../../lib/logger'
import { createLikeNotification } from '../../lib/notification'

// Toggle like for post or comment
export async function toggleLike(req: Request, res: Response, next: NextFunction) {
  try {
    // Get authenticated user ID
    const userId = (req.user as any)?.id
    if (!userId) {
      throw new UnauthorizedError('Authentication required to like content')
    }

    // Validate request parameters
    const { postId, commentId } = req.params
    if (!postId && !commentId) {
      throw new ValidationError('Post ID or Comment ID is required', [
        { field: 'targetId', message: 'Post ID or Comment ID is required' }
      ])
    }

    // Determine target type
    const targetType = postId ? 'POST' : 'COMMENT'
    const targetId = postId || commentId

    // Build where clause for database operations
    let where: any = { userId }
    if (postId) where.postId = postId
    if (commentId) where.commentId = commentId

    try {
      // Check if target exists and prevent self-liking
      if (postId) {
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { authorId: true, title: true }
        })

        if (!post) {
          throw new NotFoundError('Post', postId)
        }

        if (post.authorId === userId) {
          throw new ForbiddenError('You cannot like your own post', 'like:self-post', { postId })
        }
      }

      if (commentId) {
        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          select: { authorId: true, postId: true }
        })

        if (!comment) {
          throw new NotFoundError('Comment', commentId)
        }

        if (comment.authorId === userId) {
          throw new ForbiddenError('You cannot like your own comment', 'like:self-comment', {
            commentId
          })
        }
      }

      // Check if like already exists
      const existing = await prisma.like.findFirst({ where })

      if (existing) {
        // Remove existing like
        await prisma.like.delete({ where: { id: existing.id } })

        logInfo('Content unliked', {
          targetType,
          targetId,
          userId
        })

        res.json({
          success: true,
          liked: false,
          message: targetType === 'POST' ? 'Post unliked' : 'Comment unliked'
        })
      } else {
        // Create new like
        const created = await prisma.like.create({
          data: where,
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        })

        logInfo('Content liked', {
          targetType,
          targetId,
          userId,
          likeId: created.id
        }) // Create notification for target author
        try {
          const authorId = postId
            ? (await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } }))
                ?.authorId
            : (
                await prisma.comment.findUnique({
                  where: { id: commentId },
                  select: { authorId: true }
                })
              )?.authorId

          if (authorId && authorId !== userId) {
            await createLikeNotification({
              userId: authorId,
              actorId: userId,
              postId: postId || undefined,
              commentId: commentId || undefined
            })
          }
        } catch (notifError) {
          // Don't fail if notification creation fails
          logWarning('Failed to create like notification', {
            error: (notifError as Error).message,
            userId,
            targetId
          })
        }

        res.json({
          success: true,
          liked: true,
          like: created,
          message: targetType === 'POST' ? 'Post liked' : 'Comment liked'
        })
      }
    } catch (dbError) {
      if (!(dbError instanceof NotFoundError || dbError instanceof ForbiddenError)) {
        throw new DatabaseError('Failed to process like operation', 'upsert', {
          error: (dbError as Error).message,
          targetType,
          targetId
        })
      }
      throw dbError
    }
  } catch (error) {
    next(error)
  }
}

// Get all likes for a post
export async function getLikesForPost(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate post ID
    const validation = idParamSchema.safeParse(req.params)
    if (!validation.success) {
      throw ValidationError.fromZod(validation.error, 'Invalid post ID')
    }

    const { id: postId } = validation.data

    try {
      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, title: true }
      })

      if (!post) {
        throw new NotFoundError('Post', postId)
      }

      // Get likes with user info
      const likes = await prisma.like.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              profileImage: true
            }
          }
        }
      })

      logInfo('Post likes retrieved', {
        postId,
        likesCount: likes.length
      })

      res.json({
        success: true,
        likes,
        count: likes.length,
        postId
      })
    } catch (dbError) {
      if (!(dbError instanceof NotFoundError)) {
        throw new DatabaseError('Failed to retrieve post likes', 'query', {
          error: (dbError as Error).message,
          postId
        })
      }
      throw dbError
    }
  } catch (error) {
    next(error)
  }
}

// Get all likes for a comment
export async function getLikesForComment(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate comment ID
    const validation = idParamSchema.safeParse(req.params)
    if (!validation.success) {
      throw ValidationError.fromZod(validation.error, 'Invalid comment ID')
    }

    const { id: commentId } = validation.data

    try {
      // Check if comment exists
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { id: true, postId: true }
      })

      if (!comment) {
        throw new NotFoundError('Comment', commentId)
      }

      // Get likes with user info
      const likes = await prisma.like.findMany({
        where: { commentId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              profileImage: true
            }
          }
        }
      })

      logInfo('Comment likes retrieved', {
        commentId,
        postId: comment.postId,
        likesCount: likes.length
      })

      res.json({
        success: true,
        likes,
        count: likes.length,
        commentId
      })
    } catch (dbError) {
      if (!(dbError instanceof NotFoundError)) {
        throw new DatabaseError('Failed to retrieve comment likes', 'query', {
          error: (dbError as Error).message,
          commentId
        })
      }
      throw dbError
    }
  } catch (error) {
    next(error)
  }
}

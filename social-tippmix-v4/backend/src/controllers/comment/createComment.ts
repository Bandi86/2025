import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'
import { ValidationError, UnauthorizedError, NotFoundError, DatabaseError } from '../../lib/error'
import { CreateCommentInput, createCommentSchema } from '../../lib/validation'
import { logInfo, logError } from '../../lib/logger'
import { createCommentNotification } from '../../lib/notification'

export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate input with Zod
    const validationResult = createCommentSchema.safeParse(req.body)
    if (!validationResult.success) {
      throw ValidationError.fromZod(validationResult.error, 'Comment validation failed')
    }

    const { postId, content } = validationResult.data as CreateCommentInput

    // Get authenticated user ID
    let userId: string | undefined
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      userId = (req.user as any).id
    } else if (req.session && req.session.userId) {
      userId = req.session.userId
    }

    if (!userId) {
      throw new UnauthorizedError('Authentication required to create a comment')
    }

    try {
      // Check if post exists
      const postExists = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, authorId: true }
      })

      if (!postExists) {
        throw new NotFoundError('Post', postId)
      }

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          content,
          postId,
          authorId: userId
        },
        include: {
          author: { select: { id: true, username: true, avatar: true } },
          post: { select: { id: true, title: true, authorId: true } }
        }
      })

      logInfo('Comment created', {
        commentId: comment.id,
        postId,
        authorId: userId,
        postAuthorId: comment.post.authorId
      }) // Create notification for post author if different from comment author
      if (comment.post.authorId !== userId) {
        try {
          await createCommentNotification({
            userId: comment.post.authorId,
            actorId: userId,
            postId: postId,
            commentId: comment.id
          })
        } catch (notifError) {
          // Don't fail if notification creation fails
          logError('Failed to create notification for comment', notifError)
        }
      }

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        comment
      })
    } catch (dbError) {
      if (!(dbError instanceof NotFoundError)) {
        throw new DatabaseError('Failed to create comment', 'insert', {
          error: (dbError as Error).message,
          postId,
          userId
        })
      }
      throw dbError
    }
  } catch (error) {
    next(error)
  }
}

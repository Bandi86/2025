import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'
import { DatabaseError } from '../../lib/error'
import { logInfo, logError } from '../../lib/logger'

export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, message, userId, actorId, postId, commentId } = req.body

    // Validation
    if (!type || !message || !userId) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Missing required fields: type, message, userId'
        }
      })
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        type,
        message,
        userId,
        actorId,
        postId,
        commentId,
        isRead: false
      }
    })

    logInfo('Notification created', { notificationId: notification.id })

    return res.status(201).json({
      message: 'Notification created successfully',
      data: notification
    })
  } catch (error) {
    logError('Failed to create notification', error)

    // Handle unique constraint violations or other database errors
    if ((error as any).code === 'P2002') {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A notification with these details already exists'
        }
      })
    }

    next(new DatabaseError('Failed to create notification', (error as Error).message))
  }
}

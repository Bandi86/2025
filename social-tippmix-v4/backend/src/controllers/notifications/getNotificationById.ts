import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'
import { DatabaseError, NotFoundError } from '../../lib/error'
import { logInfo, logError } from '../../lib/logger'

export async function getNotificationById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Notification ID is required'
        }
      })
    }

    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification) {
      throw new NotFoundError('Notification not found', 'NOTIFICATION_NOT_FOUND')
    }

    // Check if user has permission to view this notification
    // Typically, users should only be able to view their own notifications
    const userId = (req.user as any)?.id
    if (userId && notification.userId !== userId && (req.user as any)?.role !== 'ADMIN') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this notification'
        }
      })
    }

    logInfo('Notification fetched by ID', { notificationId: id })

    return res.status(200).json({
      message: 'Notification fetched successfully',
      data: notification
    })
  } catch (error) {
    logError('Failed to get notification by ID', error)

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: {
          code: error.code,
          message: error.message
        }
      })
    }

    next(new DatabaseError('Failed to get notification by ID', (error as Error).message))
  }
}

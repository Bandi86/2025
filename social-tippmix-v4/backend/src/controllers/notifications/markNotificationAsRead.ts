import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'
import { DatabaseError, NotFoundError } from '../../lib/error'
import { logInfo, logError } from '../../lib/logger'

export async function markNotificationAsRead(req: Request, res: Response, next: NextFunction) {
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

    // Check if notification exists and belongs to the current user
    const existingNotification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!existingNotification) {
      throw new NotFoundError('Notification not found', 'NOTIFICATION_NOT_FOUND')
    }

    // Verify ownership or admin rights
    const userId = (req.user as any)?.id
    if (userId && existingNotification.userId !== userId && (req.user as any)?.role !== 'ADMIN') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this notification'
        }
      })
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    })

    logInfo('Notification marked as read', { notificationId: id })

    return res.status(200).json({
      message: 'Notification marked as read successfully',
      data: updatedNotification
    })
  } catch (error) {
    logError('Failed to mark notification as read', error)

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: {
          code: error.code,
          message: error.message
        }
      })
    }

    next(new DatabaseError('Failed to mark notification as read', (error as Error).message))
  }
}

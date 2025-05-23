import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'
import { DatabaseError } from '../../lib/error'
import { logInfo, logError } from '../../lib/logger'

export async function markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as any)?.id

    if (!userId) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'User ID is required'
        }
      })
    }

    // Update all unread notifications for the user
    const { count } = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    logInfo(`Marked ${count} notifications as read for user`, { userId, count })

    return res.status(200).json({
      message: `Successfully marked ${count} notifications as read`,
      data: { count }
    })
  } catch (error) {
    logError('Failed to mark all notifications as read', error)
    next(new DatabaseError('Failed to mark all notifications as read', (error as Error).message))
  }
}

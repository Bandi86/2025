import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'
import { DatabaseError } from '../../lib/error'
import { logInfo, logError } from '../../lib/logger'

export async function getUnreadNotificationCount(req: Request, res: Response, next: NextFunction) {
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

    // Count unread notifications
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    })

    logInfo('Retrieved unread notification count', { userId, count })

    return res.status(200).json({
      message: 'Unread notification count retrieved successfully',
      data: { count }
    })
  } catch (error: any) {
    logError('Failed to get unread notification count', error)
    next(new DatabaseError('Failed to get unread notification count', error.message))
  }
}

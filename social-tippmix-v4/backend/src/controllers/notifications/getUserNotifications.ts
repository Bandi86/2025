import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'
import { getPagination } from '../../lib/pagination'
import { logInfo, logError } from '../../lib/logger'
import { DatabaseError } from '../../lib/error'

export async function getUserNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract user ID from request
    const userId = req.params.userId || (req.user as any)?.id

    if (!userId) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'User ID is required'
        }
      })
    }

    // Get pagination parameters
    const { page = '1', pageSize = '10' } = req.query
    const pageStr = Array.isArray(page) ? page[0] : page
    const pageSizeStr = Array.isArray(pageSize) ? pageSize[0] : pageSize
    const take = Math.max(1, Math.min(100, parseInt(pageSizeStr as string, 10) || 10))
    const skip = (Math.max(1, parseInt(pageStr as string, 10) || 1) - 1) * take

    // Check if we only want unread notifications
    const unreadOnly = req.query.unreadOnly === 'true'

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly ? { isRead: false } : {})
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take
      }),
      prisma.notification.count({
        where: {
          userId,
          ...(unreadOnly ? { isRead: false } : {})
        }
      })
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(total / take)

    logInfo('Fetched user notifications', { userId, count: notifications.length })

    return res.status(200).json({
      message: 'Notifications fetched successfully',
      data: notifications,
      pagination: {
        page: parseInt(pageStr as string, 10) || 1,
        pageSize: take,
        totalItems: total,
        totalPages,
        hasMore: parseInt(pageStr as string, 10) < totalPages
      }
    })
  } catch (error) {
    logError('Failed to fetch notifications', error)
    next(new DatabaseError('Failed to fetch notifications', (error as Error).message))
  }
}

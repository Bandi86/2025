import prisma from './client'
import { logInfo, logError } from './logger'

/**
 * Notification types
 */
export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM'
}

/**
 * Create a notification in the database
 */
export async function createNotification({
  type,
  message,
  userId,
  actorId,
  postId,
  commentId
}: {
  type: string
  message: string
  userId: string
  actorId?: string
  postId?: string
  commentId?: string
}) {
  try {
    // Don't notify user about their own actions
    if (actorId && userId === actorId) {
      return null
    }

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

    logInfo('Notification created via helper', {
      notificationId: notification.id,
      type,
      userId,
      actorId
    })

    return notification
  } catch (error) {
    logError('Failed to create notification via helper', error)
    throw error
  }
}

/**
 * Create a like notification
 */
export async function createLikeNotification({
  userId,
  actorId,
  postId,
  commentId
}: {
  userId: string
  actorId: string
  postId?: string
  commentId?: string
}) {
  const targetType = commentId ? 'hozzászólását' : 'bejegyzését'
  const message = `Valaki kedvelte a ${targetType}`

  return createNotification({
    type: NotificationType.LIKE,
    message,
    userId,
    actorId,
    postId,
    commentId
  })
}

/**
 * Create a comment notification
 */
export async function createCommentNotification({
  userId,
  actorId,
  postId,
  commentId
}: {
  userId: string
  actorId: string
  postId: string
  commentId?: string
}) {
  const message = commentId
    ? 'Valaki válaszolt a hozzászólásodra'
    : 'Valaki hozzászólt a bejegyzésedhez'

  return createNotification({
    type: NotificationType.COMMENT,
    message,
    userId,
    actorId,
    postId,
    commentId
  })
}

/**
 * Create a follow notification
 */
export async function createFollowNotification({
  userId,
  actorId
}: {
  userId: string
  actorId: string
}) {
  // Get actor username for personalized message
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { username: true }
  })

  const message = actor?.username
    ? `${actor.username} követni kezdett téged`
    : 'Valaki követni kezdett téged'

  return createNotification({
    type: NotificationType.FOLLOW,
    message,
    userId,
    actorId
  })
}

/**
 * Create a mention notification
 */
export async function createMentionNotification({
  userId,
  actorId,
  postId,
  commentId
}: {
  userId: string
  actorId: string
  postId?: string
  commentId?: string
}) {
  // Get actor username for personalized message
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { username: true }
  })

  const message = actor?.username
    ? `${actor.username} megemlített téged`
    : 'Valaki megemlített téged'

  return createNotification({
    type: NotificationType.MENTION,
    message,
    userId,
    actorId,
    postId,
    commentId
  })
}

/**
 * Create a system notification for a specific user
 */
export async function createSystemNotification({
  userId,
  message
}: {
  userId: string
  message: string
}) {
  return createNotification({
    type: NotificationType.SYSTEM,
    message,
    userId
  })
}

/**
 * Create a system notification for all users
 */
export async function createSystemNotificationForAll(message: string) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true }
    })

    const notificationPromises = users.map((user) =>
      createNotification({
        type: NotificationType.SYSTEM,
        message,
        userId: user.id
      })
    )

    await Promise.all(notificationPromises)

    logInfo('System notification sent to all users', { message })
  } catch (error) {
    logError('Failed to send system notification to all users', error)
    throw error
  }
}

import { Router } from 'express'
import { requireAuth } from '../middlewares/auth'
import asyncHandler from '../lib/asyncHandler'
import { createNotification } from '../controllers/notifications/createNotification'
import { getUserNotifications } from '../controllers/notifications/getUserNotifications'
import { getNotificationById } from '../controllers/notifications/getNotificationById'
import { markNotificationAsRead } from '../controllers/notifications/markNotificationAsRead'
import { markAllNotificationsAsRead } from '../controllers/notifications/markAllNotificationsAsRead'
import { deleteNotification } from '../controllers/notifications/deleteNotification'
import { getUnreadNotificationCount } from '../controllers/notifications/getUnreadNotificationCount'

const router = Router()

// Get current user's notifications
router.get('/', requireAuth, asyncHandler(getUserNotifications))

// Get count of unread notifications
router.get('/count', requireAuth, asyncHandler(getUnreadNotificationCount))

// Get a notification by ID
router.get('/:id', requireAuth, asyncHandler(getNotificationById))

// Create a new notification
router.post('/', requireAuth, asyncHandler(createNotification))

// Mark a notification as read
router.patch('/:id/read', requireAuth, asyncHandler(markNotificationAsRead))

// Mark all notifications as read
router.patch('/read-all', requireAuth, asyncHandler(markAllNotificationsAsRead))

// Delete a notification
router.delete('/:id', requireAuth, asyncHandler(deleteNotification))

export default router

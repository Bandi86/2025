/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - id
 *         - type
 *         - message
 *         - userId
 *         - isRead
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the notification
 *         type:
 *           type: string
 *           description: Type of notification (e.g., LIKE, COMMENT, FOLLOW, MENTION, SYSTEM)
 *         message:
 *           type: string
 *           description: The notification message
 *         userId:
 *           type: string
 *           description: The ID of the user who will receive the notification
 *         actorId:
 *           type: string
 *           description: The ID of the user who triggered the notification
 *         postId:
 *           type: string
 *           description: The ID of the related post (if applicable)
 *         commentId:
 *           type: string
 *           description: The ID of the related comment (if applicable)
 *         isRead:
 *           type: boolean
 *           description: Whether the notification has been read
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the notification was created
 *
 *     NotificationResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: A message about the operation result
 *         data:
 *           $ref: '#/components/schemas/Notification'
 *
 *     NotificationsListResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: A message about the operation result
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               description: Current page number
 *             pageSize:
 *               type: integer
 *               description: Number of items per page
 *             totalItems:
 *               type: integer
 *               description: Total number of items
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *             hasMore:
 *               type: boolean
 *               description: Whether there are more pages
 *
 *     NotificationCountResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: A message about the operation result
 *         data:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: The number of unread notifications
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               description: An error code
 *             message:
 *               type: string
 *               description: Error message
 */

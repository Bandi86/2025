/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the comment.
 *           example: clx3x2y0z0000a8b4c2d6e8f7
 *         content:
 *           type: string
 *           description: The content of the comment.
 *           example: Great post!
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the comment was created.
 *           example: 2024-05-15T10:30:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the comment was last updated.
 *           example: 2024-05-15T10:30:00.000Z
 *         userId:
 *           type: string
 *           description: The ID of the user who created the comment.
 *           example: clx3x1y0a0000b8c4d2e6f8g7
 *         postId:
 *           type: string
 *           description: The ID of the post to which the comment belongs.
 *           example: clx3x0z0b0000c8d4e2f6g8h7
 *         user:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *               description: The username of the user who created the comment.
 *               example: john_doe
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           description: The HTTP status code.
 *         message:
 *           type: string
 *           description: A human-readable error message.
 *       example:
 *         status: 404
 *         message: Resource not found
 */

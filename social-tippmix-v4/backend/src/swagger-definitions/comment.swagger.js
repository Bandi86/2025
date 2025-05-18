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
 *         authorId:
 *           type: string
 *           description: The ID of the user who created the comment.
 *           example: clx3x1y0a0000b8c4d2e6f8g7
 *         postId:
 *           type: string
 *           description: The ID of the post to which the comment belongs.
 *           example: clx3x0z0b0000c8d4e2f6g8h7
 *         author:
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
 *         message: Not found
 *
 * paths:
 *   /api/comment:
 *     get:
 *       summary: Get all comments (optionally filtered by postId or authorId)
 *       tags: [Comments]
 *       parameters:
 *         - in: query
 *           name: postId
 *           schema:
 *             type: string
 *           description: Filter comments by postId
 *         - in: query
 *           name: authorId
 *           schema:
 *             type: string
 *           description: Filter comments by authorId
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *           description: Page number for pagination
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *           description: Number of items per page
 *       responses:
 *         200:
 *           description: A list of comments
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Comment'
 *         400:
 *           description: Invalid query parameters
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *     post:
 *       summary: Create a new comment
 *       tags: [Comments]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - content
 *                 - postId
 *               properties:
 *                 content:
 *                   type: string
 *                 postId:
 *                   type: string
 *       responses:
 *         201:
 *           description: Comment created successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Comment'
 *         400:
 *           description: Bad request
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *   /api/comment/{id}:
 *     get:
 *       summary: Get a comment by ID
 *       tags: [Comments]
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: The ID of the comment
 *       responses:
 *         200:
 *           description: The comment data
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Comment'
 *         404:
 *           description: Comment not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *     put:
 *       summary: Edit a comment (only by author)
 *       tags: [Comments]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: The ID of the comment
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - content
 *               properties:
 *                 content:
 *                   type: string
 *       responses:
 *         200:
 *           description: Comment updated
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Comment'
 *         400:
 *           description: Bad request
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         403:
 *           description: Forbidden
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         404:
 *           description: Comment not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *     delete:
 *       summary: Delete a comment (only by author)
 *       tags: [Comments]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: The ID of the comment
 *       responses:
 *         200:
 *           description: Comment deleted
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         403:
 *           description: Forbidden
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         404:
 *           description: Comment not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 */

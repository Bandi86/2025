import express from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { createComment } from '../controllers/comments/createComment'
import { getCommentsByPostId } from '../controllers/comments/getCommentsByPostId'

const router = express.Router()

// Útvonal loggolása DEBUG módban (opcionális, de hasznos lehet)
router.use((req, res, next) => {
  console.log(
    `[commentsRoute.ts] Kérés érkezett: ${req.method} ${req.originalUrl} (routeren belüli útvonal: ${req.url})`
  )
  next()
})

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Kommentek kezelése
 */

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - postId
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the comment.
 *               postId:
 *                 type: string
 *                 description: The ID of the post to which the comment belongs.
 *     responses:
 *       201:
 *         description: Comment created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request (e.g., missing content or postId).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized (user not logged in).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Post not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/comments', authenticate, createComment)

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get all comments for a specific post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post for which to retrieve comments.
 *     responses:
 *       200:
 *         description: A list of comments for the specified post.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Post not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/posts/:postId/comments', authenticate, getCommentsByPostId)

// TODO: Később hozzáadandó útvonalak:
// PUT /api/comments/:commentId - Komment szerkesztése
// DELETE /api/comments/:commentId - Komment törlése

export default router

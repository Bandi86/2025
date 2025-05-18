/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Globális keresés user, post vagy comment entitásban
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Globális keresés user, post vagy comment entitásban
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, post, comment]
 *         description: Keresés típusa
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Keresőszöveg
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Oldalszám
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Oldalméret
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: (user keresésnél) Szerepkör szűrés
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: (post keresésnél) Kategória szűrés
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: (comment keresésnél) Szerző szűrés
 *     responses:
 *       200:
 *         description: Keresési találatok
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - $ref: '#/components/schemas/User'
 *                       - $ref: '#/components/schemas/Post'
 *                       - $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Hibás paraméterek
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         avatar:
 *           type: string
 *         role:
 *           type: string
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         author:
 *           $ref: '#/components/schemas/User'
 *         post:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             title:
 *               type: string
 */

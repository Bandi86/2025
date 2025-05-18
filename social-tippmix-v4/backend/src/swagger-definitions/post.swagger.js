/**
 * @swagger
 * tags:
 *   name: Post
 *   description: Posztok kezelése
 */

/**
 * @swagger
 * /api/post:
 *   get:
 *     summary: Posztok listázása szűréssel, rendezéssel, paginációval
 *     tags: [Post]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Poszt kategóriája
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Szerző ID
 *       - in: query
 *         name: tagId
 *         schema:
 *           type: string
 *         description: Tag ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Keresőszöveg (title/content)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, likes, comments, title]
 *         description: Rendezés mező szerint
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Rendezés iránya
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
 *     responses:
 *       200:
 *         description: Posztok listája
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 */

/**
 * @swagger
 * /api/post/{id}:
 *   get:
 *     summary: Egy poszt lekérdezése id vagy slug alapján
 *     tags: [Post]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poszt ID vagy slug
 *     responses:
 *       200:
 *         description: Poszt adatai
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Poszt nem található
 */

/**
 * @swagger
 * /api/post:
 *   post:
 *     summary: Új poszt létrehozása
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - slug
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Tippmix elemzés"
 *               content:
 *                 type: string
 *                 example: "Ez egy elemző poszt."
 *               slug:
 *                 type: string
 *                 example: "tippmix-elemzes-2025"
 *               category:
 *                 type: string
 *                 example: "HIR"
 *               imageUrl:
 *                 type: string
 *                 example: "https://..."
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["tagid1", "tagid2"]
 *     responses:
 *       201:
 *         description: Sikeres létrehozás
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Hibás vagy hiányzó adatok
 *       409:
 *         description: Slug már létezik
 */

/**
 * @swagger
 * /api/post/{id}:
 *   put:
 *     summary: Poszt módosítása (csak szerző)
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poszt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               slug:
 *                 type: string
 *               category:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Sikeres módosítás
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       401:
 *         description: Nem hitelesített
 *       403:
 *         description: Nem a szerző
 *       404:
 *         description: Poszt nem található
 *       409:
 *         description: Slug már létezik
 */

/**
 * @swagger
 * /api/post/{id}:
 *   delete:
 *     summary: Poszt törlése (csak szerző)
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poszt ID
 *     responses:
 *       200:
 *         description: Sikeres törlés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post deleted
 *       401:
 *         description: Nem hitelesített
 *       403:
 *         description: Nem a szerző
 *       404:
 *         description: Poszt nem található
 */

/**
 * @swagger
 * /api/post/my:
 *   get:
 *     summary: Saját (bejelentkezett user) posztjai szűréssel/rendezéssel
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Poszt kategóriája
 *       - in: query
 *         name: tagId
 *         schema:
 *           type: string
 *         description: Tag ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Keresőszöveg (title/content)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, likes, comments, title]
 *         description: Rendezés mező szerint
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Rendezés iránya
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
 *     responses:
 *       200:
 *         description: Saját posztok listája
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       401:
 *         description: Nem hitelesített
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         slug:
 *           type: string
 *         category:
 *           type: string
 *         imageUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         author:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             username:
 *               type: string
 *             avatar:
 *               type: string
 *         tags:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *         _count:
 *           type: object
 *           properties:
 *             likes:
 *               type: integer
 *             comments:
 *               type: integer
 */

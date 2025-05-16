/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Poszt egyedi azonosítója
 *         title:
 *           type: string
 *           description: Poszt címe
 *         content:
 *           type: string
 *           description: Poszt tartalma
 *         authorId:
 *           type: string
 *           description: Szerző azonosítója
 *         category:
 *           type: string
 *           description: Poszt kategóriája
 *         imageUrl:
 *           type: string
 *           nullable: true
 *           description: Kép URL címe
 *         slug:
 *           type: string
 *           description: Poszt slug-ja
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Létrehozás időpontja
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Utolsó módosítás időpontja
 *     PostInput:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - authorId
 *         - category
 *       properties:
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         authorId:
 *           type: string
 *           description: A poszt szerzőjének ID-ja (általában az authentikált felhasználó ID-ja lesz)
 *         category:
 *           type: string
 *         imageUrl:
 *           type: string
 *           nullable: true
 *     PostUpdateInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         category:
 *           type: string
 *         imageUrl:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Új poszt létrehozása
 *     tags:
 *       - Post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostInput'
 *     responses:
 *       201:
 *         description: Sikeres poszt létrehozás
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Hibás kérés (pl. hiányzó adatok)
 *       401:
 *         description: Nincs jogosultság
 */

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Poszt lekérdezése ID alapján
 *     tags:
 *       - Post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: A poszt azonosítója
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sikeres lekérdezés
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       401:
 *         description: Nincs jogosultság
 *       404:
 *         description: Nem található poszt
 */

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Poszt szerkesztése ID alapján
 *     tags:
 *       - Post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: A szerkesztendő poszt azonosítója
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostUpdateInput'
 *     responses:
 *       200:
 *         description: Sikeres szerkesztés
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Hibás kérés
 *       401:
 *         description: Nincs jogosultság (pl. nem a saját posztját próbálja szerkeszteni)
 *       404:
 *         description: Nem található poszt
 */

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Poszt törlése ID alapján
 *     tags:
 *       - Post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: A törlendő poszt azonosítója
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sikeres törlés (üzenettel)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       # Vagy 204 No Content, ha nem küldünk vissza üzenetet
 *       # 204:
 *       #   description: Sikeres törlés (nincs tartalom)
 *       401:
 *         description: Nincs jogosultság (pl. nem a saját posztját próbálja törölni)
 *       404:
 *         description: Nem található poszt
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Posztok listázása szűrési és lapozási lehetőségekkel
 *     tags:
 *       - Post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Poszt címének részleges keresése (case-insensitive)
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Szerző ID szerinti szűrés
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Kategória szerinti szűrés (pontos egyezés, case-insensitive)
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Slug szerinti szűrés (pontos egyezés)
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Kezdő dátum (ISO 8601 formátum, pl. 2024-01-01T00:00:00Z) a createdAt mezőre
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Záró dátum (ISO 8601 formátum) a createdAt mezőre
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, category]
 *           default: createdAt
 *         description: Rendezés mező szerint
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Rendezés iránya
 *       - in: query
 *         name: myPosts
 *         schema:
 *           type: boolean
 *         description: Csak a bejelentkezett felhasználó saját posztjainak listázása (myPosts=true)
 *       - in: query
 *         name: minComments
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Kommentek minimális száma
 *       - in: query
 *         name: maxComments
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Kommentek maximális száma
 *       - in: query
 *         name: minLikes
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Kedvelések minimális száma
 *       - in: query
 *         name: maxLikes
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Kedvelések maximális száma
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Oldalszám a lapozáshoz
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Elemek száma oldalanként
 *     responses:
 *       200:
 *         description: Sikeres lekérdezés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 *       401:
 *         description: Nincs jogosultság
 */

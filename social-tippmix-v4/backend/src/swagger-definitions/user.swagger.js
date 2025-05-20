/**
 * @swagger
 * tags:
 *   name: User
 *   description: Felhasználói műveletek
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Új felhasználó regisztrációja
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 example: tesztuser
 *               password:
 *                 type: string
 *                 example: Jelszo123!
 *               email:
 *                 type: string
 *                 example: teszt@user.hu
 *     responses:
 *       201:
 *         description: Sikeres regisztráció
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Hiányzó adatok vagy gyenge jelszó
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: A jelszónak legalább 8 karakteresnek kell lennie, tartalmaznia kell kis- és nagybetűt, számot és speciális karaktert.
 *       409:
 *         description: Felhasználónév már létezik
 */

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Bejelentkezés felhasználónévvel és jelszóval
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: tesztuser
 *               password:
 *                 type: string
 *                 example: Jelszo123!
 *     responses:
 *       200:
 *         description: Sikeres bejelentkezés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 sessionId:
 *                   type: string
 *       401:
 *         description: Hibás hitelesítési adatok
 */

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Kijelentkezés
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sikeres kijelentkezés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Bejelentkezett felhasználó lekérdezése
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Felhasználó adatai
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Nincs bejelentkezve
 *       404:
 *         description: Felhasználó nem található
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Felhasználók listázása (összes, szűrés, lapozás)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Oldalszám
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Oldalméret
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Keresés felhasználónévre vagy emailre
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Rendezés (pl. username:asc,email:desc)
 *     responses:
 *       200:
 *         description: Felhasználók listája
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       role:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 */

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Felhasználó lekérdezése ID alapján
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Felhasználó azonosítója
 *     responses:
 *       200:
 *         description: Felhasználó részletes adatai
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                   nullable: true
 *                 profileImage:
 *                   type: string
 *                   nullable: true
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                 website:
 *                   type: string
 *                   nullable: true
 *                 location:
 *                   type: string
 *                   nullable: true
 *                 birthDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 role:
 *                   type: string
 *                 isOnline:
 *                   type: boolean
 *                 lastLogin:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 status:
 *                   type: string
 *                 postCount:
 *                   type: integer
 *                 commentCount:
 *                   type: integer
 *                 followerCount:
 *                   type: integer
 *                 followingCount:
 *                   type: integer
 *                 notificationCount:
 *                   type: integer
 *                 unreadNotificationCount:
 *                   type: integer
 *       404:
 *         description: Felhasználó nem található
 */

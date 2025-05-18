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
 *             properties:
 *               username:
 *                 type: string
 *                 example: tesztuser
 *               password:
 *                 type: string
 *                 example: Jelszo123!
 *     responses:
 *       201:
 *         description: Sikeres regisztráció
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
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
 *                       type: integer
 *                     username:
 *                       type: string
 *                 sessionId:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Hibás hitelesítési adatok
 *
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Kijelentkezés
 *     tags: [User]
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
 *                   example: Logged out
 */

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Bejelentkezett felhasználó lekérdezése
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Felhasználó adatai
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *       401:
 *         description: Nincs bejelentkezve
 *       404:
 *         description: Felhasználó nem található
 */

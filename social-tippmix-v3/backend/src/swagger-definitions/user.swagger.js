/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Felhasználó egyedi azonosítója
 *         name:
 *           type: string
 *           description: Felhasználó neve
 *         email:
 *           type: string
 *           format: email
 *           description: Felhasználó email címe
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *           description: Felhasználó szerepköre
 *         isOnline:
 *           type: boolean
 *           description: Felhasználó online státusza
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Létrehozás időpontja
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Utolsó módosítás időpontja
 *     UserInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     UserLogin:
 *       type: object
 *       required:
 *         - name
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         password:
 *           type: string
 *     UserUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Felhasználó új neve (opcionális)
 *         email:
 *           type: string
 *           format: email
 *           description: Felhasználó új email címe (opcionális)
 *         password:
 *           type: string
 *           format: password
 *           description: Felhasználó új jelszava (opcionális, minimum 6 karakter)
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *           description: Felhasználó új szerepköre (opcionális, csak ADMIN frissítheti)
 *         isOnline:
 *           type: boolean
 *           description: Felhasználó online állapota (opcionális, csak ADMIN frissítheti)
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Új felhasználó regisztrálása
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Sikeres regisztráció
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Hibás kérés (pl. email már létezik, hiányzó adatok)
 */

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Felhasználó bejelentkezése
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Sikeres bejelentkezés, token a cookie-ban
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                    type: string
 *                    description: JWT token
 *       401:
 *         description: Hibás név vagy jelszó
 */

/**
 * @swagger
 * /api/user/logout:
 *   get:
 *     summary: Kijelentkezés (token törlése a cookie-ból és isOnline: false)
 *     tags:
 *       - User
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
 *       401:
 *         description: Nincs jogosultság (nincs érvényes token)
 */

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Authentikált felhasználó adatainak lekérdezése
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sikeres lekérdezés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Nincs jogosultság
 */

/**
 * @swagger
 * /api/user/{id}:
 *   put:
 *     summary: Felhasználó adatainak frissítése ID alapján
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: A frissítendő felhasználó azonosítója
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateInput'
 *     responses:
 *       200:
 *         description: Sikeres frissítés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: Hibás kérés (pl. email már használatban, nincs frissítendő adat)
 *       401:
 *         description: Nincs jogosultság
 *       403:
 *         description: Tiltott művelet (pl. nem admin próbál szerepkört módosítani)
 *       404:
 *         description: Felhasználó nem található
 */

/**
 * @swagger
 * /api/user/{id}:
 *   delete:
 *     summary: Felhasználó törlése ID alapján
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: A törlendő felhasználó azonosítója
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sikeres törlés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Nincs jogosultság
 *       403:
 *         description: Tiltott művelet
 *       404:
 *         description: Felhasználó nem található
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Felhasználók listázása, szűréssel, kereséssel, rendezéssel és lapozással
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Oldalszám a lapozáshoz
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Elemek száma oldalanként
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: sortBy
 *         in: query
 *         description: Mező, ami alapján rendezni kell (pl. name, email, createdAt)
 *         schema:
 *           type: string
 *       - name: sortOrder
 *         in: query
 *         description: Rendezés iránya (asc vagy desc)
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *       - name: search
 *         in: query
 *         description: Keresési kifejezés (névben vagy emailben keres)
 *         schema:
 *           type: string
 *       - name: role
 *         in: query
 *         description: Szűrés szerepkör alapján (USER, ADMIN)
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN]
 *       - name: isOnline
 *         in: query
 *         description: Szűrés online állapot alapján
 *         schema:
 *           type: boolean
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         description: Nincs jogosultság
 *       404:
 *         description: Nincs felhasználó (vagy a szűrési feltételeknek megfelelő)
 */

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Felhasználó adatainak lekérdezése ID alapján
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Felhasználó azonosítója
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sikeres lekérdezés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Nincs jogosultság
 *       404:
 *         description: Nincs felhasználó
 */

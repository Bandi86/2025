import express, { Request, Response, NextFunction } from 'express'
import { createPost } from '../controllers/posts/createPost'
import prisma from '../lib/client'
import getPostById from '../controllers/posts/getPostById'
import { authenticate } from '../middlewares/auth.middleware'
import editPost from '../controllers/posts/editPost'
import deletePost from '../controllers/posts/deletePost'
import getPosts from '../controllers/posts/getPosts'

const router = express.Router()

// Útvonal loggolása DEBUG módban
router.use((req, res, next) => {
  console.log(
    `[userRoutes.ts] Kérés érkezett a következő útvonalra: ${req.method} ${req.originalUrl} (routeren belüli útvonal: ${req.url})`
  )
  next()
})

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   # FIGYELEM: A backend NEM az Authorization header-ben várja a JWT tokent,
 *   # hanem kizárólag cookie-ban (token néven). A Swagger lock ikon csak a védettséget jelzi,
 *   # de a teszteléshez a token-t cookie-ként kell beállítani, NEM header-ben!
 *   #
 *   # Példa: document.cookie = "token=..." a böngészőben, vagy API kliensben cookie-ként küldd el.
 *   #
 *   # Ha Swagger UI-t használsz, a "Try it out" NEM fog működni, hacsak nem tudsz cookie-t küldeni.
 */

/**
 * @swagger
 * /api/post/create:
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
 *             type: object
 *             properties:
 *              title:
 *                type: string
 *              content:
 *                type: string
 *              authorId:
 *                type: string
 *              category:
 *                type: string
 *              imageUrl:
 *                type: string
 *     responses:
 *       201:
 *         description: Sikeres poszt létrehozás
 *       400:
 *         description: Hibás kérés
 */

// Új poszt létrehozása (autentikációval védve)
router.post('/post', authenticate, createPost)

/**
 * @swagger
 * /api/post/{id}:
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
 *       401:
 *         description: Nincs jogosultság
 *       404:
 *         description: Nem található poszt
 */

// Poszt lekérdezése ID alapján (autentikációval védve)
router.get('/post/:id', authenticate, getPostById)

/**
 * @swagger
 * /api/post/{id}:
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
 *         description: A poszt azonosítója
 *         schema:
 *           type: string
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
 *               authorId:
 *                 type: string
 *               category:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sikeres szerkesztés
 *       400:
 *         description: Hibás kérés
 *       404:
 *         description: Nem található poszt
 *       401:
 *         description: Nincs jogosultság
 */

// Poszt szerkesztése (autentikációval védve)
router.put('/post/:id', authenticate, editPost)

/**
 * @swagger
 * /api/post/{id}:
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
 *         description: A poszt azonosítója
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Sikeres törlés (nincs tartalom)
 *       404:
 *         description: Nem található poszt
 *       401:
 *         description: Nincs jogosultság
 */

// Poszt törlése (autentikációval védve)
router.delete('/post/:id', authenticate, deletePost)

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Posztok listázása szűrési lehetőségekkel
 *     tags:
 *       - Post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Poszt címének részleges keresése
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Szerző ID szerinti szűrés
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Kategória szerinti szűrés
 *       - in: query
 *         name: adminOnly
 *         schema:
 *           type: boolean
 *         description: Csak admin által írt posztok (adminOnly=true)
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Slug szerinti szűrés
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Kezdő dátum (ISO formátum)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Záró dátum (ISO formátum)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Rendezés mező szerint (pl. createdAt, title)
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
 *         description: Csak a saját posztok (myPosts=true)
 *       - in: query
 *         name: minComments
 *         schema:
 *           type: integer
 *         description: Minimum komment szám
 *       - in: query
 *         name: maxComments
 *         schema:
 *           type: integer
 *         description: Maximum komment szám
 *       - in: query
 *         name: minLikes
 *         schema:
 *           type: integer
 *         description: Minimum lájk szám
 *       - in: query
 *         name: maxLikes
 *         schema:
 *           type: integer
 *         description: Maximum lájk szám
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Találatok száma
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Hányadik találattól kezdje a listázást
 *     responses:
 *       200:
 *         description: Sikeres lekérdezés
 *       401:
 *         description: Nincs jogosultság
 */
router.get('/posts', authenticate, getPosts)

export default router

import express from 'express'
import { createNewUser } from '../controllers/users/createNewUser'
import { loginUser } from '../controllers/users/loginUser'
import { authenticate } from '../middlewares/auth.middleware'
import prisma from '../lib/client'

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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sikeres regisztráció
 *       400:
 *         description: Hibás kérés
 */

// Új felhasználó regisztrálása
router.post('/register', async (req, res, next) => {
  try {
    await createNewUser(req, res, next)
  } catch (error) {
    next(error)
  }
})

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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sikeres bejelentkezés
 *       401:
 *         description: Hibás név vagy jelszó
 */
router.post('/login', loginUser)

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Kijelentkezés (token törlése)
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: Sikeres kijelentkezés
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    res.clearCookie('token')
    const userId = req.user?.id
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false }
    })
    console.log('[usersRoute.ts] Kijelentkezve:', req.user?.name)
    // Kijelentkezés után a felhasználó adatainak törlése a memóriából
    req.user = undefined
    // Válasz küldése a felhasználónak
    res.status(200).json({ message: 'Kijelentkezve' })
  } catch (error) {
    next(error)
  }
})

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
 *       401:
 *         description: Nincs jogosultság
 */
router.get('/me', authenticate, (req, res, next) => {
  try {
    // Válasz küldése a felhasználó adataival
    res.status(200).json({ user: req.user })
  } catch (error) {
    next(error)
  }
})

export default router

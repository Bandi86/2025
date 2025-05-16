import express from 'express'
import { createNewUser } from '../controllers/users/createNewUser'
import { loginUser } from '../controllers/users/loginUser'
import { authenticate } from '../middlewares/auth.middleware'
import prisma from '../lib/client'
import { getAllUser } from '../controllers/users/getAllUser'
import { getUserById } from '../controllers/users/getUserById'
import { updateUser } from '../controllers/users/updateUser' // Add this import
import { deleteUser } from '../controllers/users/deleteUser' // Add this import

const router = express.Router()

// Útvonal loggolása DEBUG módban
router.use((req, res, next) => {
  console.log(
    `[userRoutes.ts] Kérés érkezett a következő útvonalra: ${req.method} ${req.originalUrl} (routeren belüli útvonal: ${req.url})`
  )
  next()
})

// NOTE: Swagger JSDoc comments for /api/user routes are now in src/swagger-definitions/user.swagger.js

// Új felhasználó regisztrálása
router.post('/register', async (req, res, next) => {
  try {
    await createNewUser(req, res, next)
  } catch (error) {
    next(error)
  }
})

router.post('/login', loginUser)

// Kijelentkezés
// A felhasználó kijelentkezése és a token törlése
// A GET /api/user végpontot átneveztem /api/user/logout-ra, hogy egyértelműbb legyen és ne ütközzön a getAllUser végponttal
router.get('/logout', authenticate, async (req, res, next) => {
  try {
    res.clearCookie('token')
    const userId = req.user?.id
    if (userId) {
      // Csak akkor próbáljon frissíteni, ha van userId
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false }
      })
    }
    console.log('[usersRoute.ts] Kijelentkezve:', req.user?.name)
    req.user = undefined
    res.status(200).json({ message: 'Kijelentkezve' })
  } catch (error) {
    next(error)
  }
})

// Felhasználó adatainak lekérdezése
router.get('/me', authenticate, (req, res, next) => {
  try {
    // Válasz küldése a felhasználó adataival
    res.status(200).json({ user: req.user })
  } catch (error) {
    next(error)
  }
})

// Felhasználó adatainak frissítése
router.put('/:id', authenticate, updateUser) // Changed from /update to /:id for consistency

// Felhasználó adatainak törlése
router.delete('/:id', authenticate, deleteUser)

// Felhasználók listázása, szűrése, keresés, rendezés, lapozás, stb.
router.get('/', authenticate, getAllUser) // Ez most már a GET /api/user végpont lesz a listázáshoz

// Felhasználó adatainak lekérdezése ID alapján
router.get('/:id', authenticate, getUserById)

export default router

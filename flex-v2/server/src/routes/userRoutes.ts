import express from 'express'
import { createNewUser, loginUser, logoutUser, getMe } from '../controllers/userController'
import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth'

const router = express.Router()

// Útvonal loggolása DEBUG módban
router.use((req, res, next) => {
  console.log(`[userRoutes.ts] Kérés érkezett a következő útvonalra: ${req.method} ${req.originalUrl} (routeren belüli útvonal: ${req.url})`)
  next()
})

// Nyilvános útvonalak

// Új felhasználó regisztrálása
router.post('/user/register', async (req, res, next) => {
  try {
    await createNewUser(req, res, next)
  } catch (error) {
    next(error)
  }
})

// Bejelentkezés
router.post('/user/login', async (req, res, next) => {
  try {
    console.log('[userRoutes.ts] /user/login POST kérés érkezett') // Log a login útvonalhoz
    await loginUser(req, res, next)
  } catch (error) {
    next(error)
  }
})

// Kijelentkezés
router.post('/user/logout', async (req, res, next) => {
  try {
    await logoutUser(req, res, next)
  } catch (error) {
    next(error)
  }
})

// Authentikált útvonalak
router.get('/user/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getMe(req, res, next);
  } catch (error) {
    console.error('[userRoutes.ts] Hiba a getMe controllerben a /user/me útvonalon:', error);
    next(error);
  }
});


export default router

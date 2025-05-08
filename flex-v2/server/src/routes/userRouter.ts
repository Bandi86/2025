import { Router, Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../middleware/authMIddleware'
import { createNewUser, loginUser, logoutUser, getMe } from '../controllers/userController'
import { ApiError } from '../lib/error'

const router = Router()

// Middleware a userRoutes-ba érkező összes kérés naplózására
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(
    `[userRoutes.ts] Kérés érkezett a következő útvonalra: ${req.method} ${req.originalUrl} (routeren belüli útvonal: ${req.path})`
  )
  next()
})


// Routes without authentication, or where asyncHandler was working
router.post('/user/', async (req, res, next) => {
  try {
    await createNewUser(req, res, next)
  } catch (error) {
    next(error)
  }
})
router.post('/user/login', async (req, res, next) => {
  try {
    console.log('[userRoutes.ts] /user/login POST kérés érkezett') // Log a login útvonalhoz
    await loginUser(req, res, next)
  } catch (error) {
    next(error)
  }
})
router.post('/user/logout', async (req, res, next) => {
  try {
    await logoutUser(req, res, next)
  } catch (error) {
    next(error)
  }
})


router.get('/user/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
authMiddleware(req, res, async () => {
  try {
    await getMe(req, res, next)
  } catch (error) {
    console.error('[userRoutes.ts] Hiba a getMe controllerben a /user/me útvonalon:', error)
    next(error)
  }
})
})


export default router

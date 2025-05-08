import { Router, Request, Response, NextFunction } from 'express'
import {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  markMediaStatus,
  getUserMediaProgress,
  loginUser,
  logoutUser,
  getMe
} from '../controllers/userController'
import { authenticate } from '../middleware/authMiddleware'

console.log('[userRoutes.ts] Modul betöltve') // Új log

const router = Router()

console.log('[userRoutes.ts] Router inicializálva') // Új log

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
    await createUser(req, res, next)
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

// Routes with authentication - manual chaining

// A /user/me útvonalnak ELŐBB kell lennie, mint a /user/:id, hogy helyesen működjön!
router.get('/user/me', (req: Request, res: Response, next: NextFunction) => {
  console.log('[userRoutes.ts] GET /user/me kérés érkezett. Hívás: authenticate.')
  authenticate(req, res, async () => {
    console.log(
      '[userRoutes.ts] authenticate middleware callback végrehajtva a /user/me útvonalon.'
    )
    try {
      await getMe(req, res, next)
    } catch (error) {
      console.error('[userRoutes.ts] Hiba a getMe controllerben a /user/me útvonalon:', error)
      next(error)
    }
  })
})

router.get('/user/:id', (req, res, next) => {
  console.log(
    `[userRoutes.ts] GET /user/:id kérés érkezett (id: ${req.params.id}). Hívás: authenticate.`
  ) // Log frissítve
  authenticate(req, res, async () => {
    console.log(
      `[userRoutes.ts] authenticate middleware callback végrehajtva a /user/:id útvonalon (id: ${req.params.id}).`
    ) // Log frissítve
    try {
      await getUserById(req, res, next)
    } catch (error) {
      console.error(
        `[userRoutes.ts] Hiba a getUserById controllerben a /user/:id útvonalon (id: ${req.params.id}):`,
        error
      ) // Log frissítve
      next(error)
    }
  })
})

router.put('/user/:id', (req, res, next) => {
  authenticate(req, res, async () => {
    try {
      await updateUser(req, res, next)
    } catch (error) {
      next(error)
    }
  })
})

router.delete('/user/:id', (req, res, next) => {
  authenticate(req, res, async () => {
    try {
      await deleteUser(req, res, next)
    } catch (error) {
      next(error)
    }
  })
})

router.post('/user/seen/:mediaItemId', (req, res, next) => {
  authenticate(req, res, async () => {
    try {
      await markMediaStatus(req, res, next) // Használjuk az új nevet
    } catch (error) {
      next(error)
    }
  })
})

router.get('/user/seen', (req, res, next) => {
  authenticate(req, res, async () => {
    try {
      await getUserMediaProgress(req, res, next) // Használjuk az új nevet
    } catch (error) {
      next(error)
    }
  })
})

export default router

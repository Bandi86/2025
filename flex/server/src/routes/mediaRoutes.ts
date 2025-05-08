import { Router, Response, NextFunction, Request } from 'express'
import { getMovies, getSeries } from '../controllers/mediaController'
import { authenticate } from '../middleware/authMiddleware' // Importáljuk az authenticate middleware-t

const router = Router()

router.get('/filmek', (req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, async () => {
    // authenticate middleware használata
    try {
      await getMovies(req, res, next)
    } catch (error) {
      next(error)
    }
  })
})

router.get('/sorozatok', (req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, async () => {
    // authenticate middleware használata
    try {
      await getSeries(req, res, next)
    } catch (error) {
      next(error)
    }
  })
})

export default router

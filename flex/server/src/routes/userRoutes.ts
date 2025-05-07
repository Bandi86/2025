import { Router, Request, Response, NextFunction } from 'express'
import { getUserById, createUser, updateUser, deleteUser } from '../controllers/userController'
import { authenticate } from '../middleware/authMiddleware'
import { ApiError } from '../lib/auth/error'

const router = Router()

router.get('/user/:id', authenticate, getUserById) // Felhasználó keresése ID alapján
router.post('/user/', createUser) // Felhasználó létrehozása
router.put('/user/:id', authenticate, updateUser) // Felhasználó frissítése
router.delete('/user/:id', authenticate, deleteUser) // Felhasználó törlése

router.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message })
  } else {
    res.status(500).json({ message: 'Váratlan hiba történt' })
  }
})

router.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' })
})

export default router

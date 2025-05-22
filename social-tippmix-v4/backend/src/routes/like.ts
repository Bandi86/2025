import { Router } from 'express'
import asyncHandler from '../lib/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import { toggleLike, getLikesForPost, getLikesForComment } from '../controllers/like/likeController'

const router = Router()

// Egy post like-olása vagy like visszavonása (toggle)
router.post('/post/:postId', requireAuth, asyncHandler(toggleLike))
// Egy komment like-olása vagy like visszavonása (toggle)
router.post('/comment/:commentId', requireAuth, asyncHandler(toggleLike))

// Egy post összes like-jának lekérdezése
router.get('/post/:postId', asyncHandler(getLikesForPost))
// Egy komment összes like-jának lekérdezése
router.get('/comment/:commentId', asyncHandler(getLikesForComment))

export default router

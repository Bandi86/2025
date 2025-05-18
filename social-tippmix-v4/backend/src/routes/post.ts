import { Router } from 'express'
import { createPost } from '../controllers/post/createPost'
import { requireAuth } from '../middlewares/auth'
import asyncHandler from '../lib/asyncHandler'
import { getAllPosts } from '../controllers/post/getAllPosts'
import { getPostById } from '../controllers/post/getPostById'
import { updatePost } from '../controllers/post/updatePost'
import { deletePost } from '../controllers/post/deletePost'

const router = Router()

// Postok listázása (mindenki számára elérhető, rendezes szures stb.)
router.get('/', asyncHandler(getAllPosts))
router.get('/:id', asyncHandler(getPostById))

// Saját (aktuális user) postjai szűréssel/rendezéssel
router.get(
  '/my',
  requireAuth,
  asyncHandler(async (req, res) => {
    let userId: string | undefined
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      userId = (req.user as any).id
    } else if (req.session && req.session.userId) {
      userId = req.session.userId
    }
    if (!userId) return res.status(401).json({ error: 'Not authenticated' })
    // A getAllPosts logikáját újrahasznosítjuk, csak authorId-t fixen beállítjuk
    req.query.authorId = userId
    return getAllPosts(req, res)
  })
)

// Új post létrehozása (csak bejelentkezett user)
router.post('/', requireAuth, asyncHandler(createPost))

// Post modositasa (csak bejelentkezett user es a post authorja)
router.put('/:id', requireAuth, asyncHandler(updatePost))

// Post torlese (csak bejelentkezett user es a post authorja)
router.delete('/:id', requireAuth, asyncHandler(deletePost))

export default router

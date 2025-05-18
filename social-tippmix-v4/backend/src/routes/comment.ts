import { Router } from 'express'
import asyncHandler from '../lib/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import { createComment } from '../controllers/comment/createComment'
import { getComments } from '../controllers/comment/getComments'
import { getCommentById } from '../controllers/comment/getCommentById'
import { editComment } from '../controllers/comment/editComment'
import { deleteComment } from '../controllers/comment/deleteComment'

const router = Router()

// Kommentek listázása (pl. egy posthoz vagy userhez)
router.get('/', asyncHandler(getComments))
// Egy komment lekérdezése
router.get('/:id', asyncHandler(getCommentById))
// Új komment létrehozása (csak bejelentkezett user)
router.post('/', requireAuth, asyncHandler(createComment))
// Komment szerkesztése (csak szerző)
router.put('/:id', requireAuth, asyncHandler(editComment))
// Komment törlése (csak szerző)
router.delete('/:id', requireAuth, asyncHandler(deleteComment))

export default router

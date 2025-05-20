import { Router } from 'express'
import { getAllUsers } from '../controllers/user/getAllUsers'
import { getUserById } from '../controllers/user/getUserById'
import { register } from '../controllers/user/register'
import login from '../controllers/user/login'
import { logout } from '../controllers/user/logout'
import { me } from '../controllers/user/me'
import asyncHandler from '../lib/asyncHandler'
import { requireAuth } from '../middlewares/auth'

const router = Router()

router.get('/', requireAuth, asyncHandler(getAllUsers))
router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.post('/logout', requireAuth, asyncHandler(logout))
router.get('/me', requireAuth, asyncHandler(me))
router.get('/:id', requireAuth, asyncHandler(getUserById))

export default router

import { Router } from 'express'
import { register } from '../controllers/user/register'
import login from '../controllers/user/login'
import { logout } from '../controllers/user/logout'
import { me } from '../controllers/user/me'
import asyncHandler from '../lib/asyncHandler'

const router = Router()

router.post('/register', asyncHandler(register))
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', asyncHandler(me))

export default router

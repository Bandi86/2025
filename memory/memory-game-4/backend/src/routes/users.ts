import express, { RequestHandler } from 'express'
import getAllUsers from '../controller/users/getAllUser'
import createUser from '../controller/users/createUser'
import loginUser from '../controller/users/loginUser'
import updateUser from '../controller/users/updateUser'
import deleteUser from '../controller/users/deleteUser'

const router = express.Router()

router.get('/', getAllUsers as RequestHandler)
router.post('/', createUser as RequestHandler)
router.post('/login', loginUser as RequestHandler)
router.put('/:id', updateUser as RequestHandler)
router.delete('/:id', deleteUser as RequestHandler)

export default router

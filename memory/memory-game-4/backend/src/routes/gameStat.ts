
import getUserStats from '../controller/gameStats/getUserStats'
import getAllUserStats from '../controller/gameStats/getAllUserStats'
import express, { RequestHandler } from 'express'

const router = express.Router()

router.get('/', getAllUserStats as RequestHandler)
router.get('/:id', getUserStats as RequestHandler)

export default router
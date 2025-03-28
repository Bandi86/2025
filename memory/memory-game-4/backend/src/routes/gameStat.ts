
import getUserStats from '../controller/gameStats/getUserStats'
import express, { RequestHandler } from 'express'

const router = express.Router()

router.get('/:id', getUserStats as RequestHandler)

export default router
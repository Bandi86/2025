import { Router } from 'express'
import asyncHandler from '../lib/asyncHandler'
import { getAggregatedStats } from '../controllers/stat/getAggregatedStats'

const router = Router()

// Aggregált statisztikák (admin)
router.get('/aggregated', asyncHandler(getAggregatedStats))

export default router

import express, { Router } from 'express'
// Placeholder imports - these controller functions and middleware need to be created
import {
  startGame,
  saveGame,
  completeGame,
  resumeGame,
  getHallOfFame,
  getUserHistory
} from '../controller/gameStats/gameStatsController'
import { authMiddleware } from '..//middleware/authMiddleware' // Assuming you have auth middleware

const router: Router = express.Router()

// === Authenticated Routes ===
// These routes require the user to be logged in.
// Assumes authMiddleware verifies the user and adds user info (e.g., req.user.id) to the request.

// POST /api/gamestats/start - Start a new game session
router.post('/start', authMiddleware, startGame)

// PUT /api/gamestats/:id/save - Save the progress of an ongoing game
router.put('/:id/save', authMiddleware, saveGame)

// PUT /api/gamestats/:id/complete - Mark a game as completed
router.put('/:id/complete', authMiddleware, completeGame)

// GET /api/gamestats/resume - Get the last 'in-progress' game for the logged-in user
router.get('/resume', authMiddleware, resumeGame)

// GET /api/gamestats/user - Get the game history for the logged-in user
router.get('/user', authMiddleware, getUserHistory)

// === Public Routes ===

// GET /api/gamestats/halloffame - Get top scores (publicly viewable)
router.get('/halloffame', getHallOfFame)

export default router

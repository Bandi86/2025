import { Request, Response, NextFunction } from 'express'
import { Database } from 'sqlite'
import { getDb } from '../../database'

// Define allowed difficulties
const ALLOWED_DIFFICULTIES = ['4x4', '6x6']

// --- Helper Types ---
interface GameStat {
  id: number
  user_id: number
  difficulty: string
  moves: number
  elapsedTime: number
  boardState: string // JSON string
  status: 'in-progress' | 'completed' | 'abandoned'
  startTime: string // ISO 8601 format
  endTime: string | null // ISO 8601 format or null
  updated_at: string // ISO 8601 format
}

// --- Utility Functions (Placeholder) ---
// In a real app, this logic might be more complex or come from the frontend
const generateInitialBoardState = (difficulty: string): string => {
  // Example: For '4x4', generate a basic structure
  // This should be replaced with actual game logic later
  const sizeMap: { [key: string]: number } = { '4x4': 16, '6x6': 36 }
  const size = sizeMap[difficulty] || 16 // Default to 4x4
  const board = Array.from({ length: size }, (_, i) => ({
    id: i,
    value: `Card ${Math.floor(i / 2)}`, // Example value
    flipped: false,
    matched: false
  }))
  // Shuffle logic would go here in a real game
  return JSON.stringify(board)
}

// Extend Request type if using custom properties like req.user
interface AuthenticatedRequest extends Request {
  user?: { id: number } // Adjust based on your auth middleware structure
}

export const startGame = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id
  const { difficulty } = req.body

  // Basic Validation
  if (!userId) {
    res.status(401).json({ message: 'Authentication required.' }); return;
  }
  // Updated Difficulty Validation
  if (!difficulty || typeof difficulty !== 'string' || !ALLOWED_DIFFICULTIES.includes(difficulty)) {
    res.status(400).json({
      message: `Difficulty level is required and must be one of: ${ALLOWED_DIFFICULTIES.join(
        ', '
      )}.`
    }); return;
  }

  let db: Database | null = null
  try {
    db = await getDb()
    await db.run('BEGIN TRANSACTION;')

    // 1. Mark existing 'in-progress' games for this user as 'abandoned'
    const updateResult = await db.run(
      `UPDATE gameStats SET status = 'abandoned', updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND status = 'in-progress'`,
      [userId]
    )
    console.log(`Abandoned ${updateResult.changes ?? 0} previous games for user ${userId}`)

    // 2. Generate initial board state
    const initialBoardState = generateInitialBoardState(difficulty)

    // 3. Create new game record
    const insertResult = await db.run(
      `INSERT INTO gameStats (user_id, difficulty, boardState, status, elapsedTime, moves) 
       VALUES (?, ?, ?, 'in-progress', 0, 0)`,
      [userId, difficulty, initialBoardState]
    )

    if (!insertResult.lastID) {
      throw new Error('Failed to insert new game record.')
    }

    const newGameId = insertResult.lastID

    // 4. Commit transaction
    await db.run('COMMIT;')

    // 5. Retrieve and return the newly created game
    const newGame = await db.get<GameStat>('SELECT * FROM gameStats WHERE id = ?', [newGameId])

    if (!newGame) {
      throw new Error('Failed to retrieve the newly created game.')
    }

    res.status(201).json(newGame)
  } catch (error) {
    if (db) {
      await db.run('ROLLBACK;').catch((rollbackError) => {
        console.error('Error rolling back transaction:', rollbackError)
      })
    }
    console.error('Error starting game:', error)
    next(error) // Pass error to global error handler
  }
}

export const saveGame = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id
  const gameId = parseInt(req.params.id, 10) // Get gameId from route parameter
  const { moves, elapsedTime, boardState } = req.body

  // --- Validation ---
  if (!userId) {
    res.status(401).json({ message: 'Authentication required.' }); return;
  }
  if (isNaN(gameId)) {
    res.status(400).json({ message: 'Invalid game ID.' }); return;
  }
  if (
    typeof moves !== 'number' ||
    typeof elapsedTime !== 'number' ||
    typeof boardState !== 'string' // Should be a JSON string
  ) {
    res.status(400).json({
      message: 'Missing or invalid data: moves, elapsedTime, and boardState are required.'
    }); return;
  }
  // Basic validation for boardState JSON (more robust validation might be needed)
  try {
    JSON.parse(boardState)
  } catch (e) {
    res.status(400).json({ message: 'Invalid boardState format (must be valid JSON).' }); return;
  }

  let db: Database | null = null
  try {
    db = await getDb()

    // 1. Verify the game exists, belongs to the user, and is 'in-progress'
    const game = await db.get<GameStat>(`SELECT id, user_id, status FROM gameStats WHERE id = ?`, [
      gameId
    ])

    if (!game) {
      res.status(404).json({ message: 'Game not found.' }); return;
    }
    if (game.user_id !== userId) {
      res.status(403).json({ message: 'You are not authorized to save this game.' }); return;
    }
    if (game.status !== 'in-progress') {
      res.status(400).json({ message: `Game is already ${game.status}. Cannot save.` }); return;
    }

    // 2. Update the game record
    const updateResult = await db.run(
      `UPDATE gameStats 
       SET moves = ?, elapsedTime = ?, boardState = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ? AND status = 'in-progress'`,
      [moves, elapsedTime, boardState, gameId, userId]
    )

    if (updateResult.changes === 0) {
      // Should not happen if previous checks passed, but good safety measure
      throw new Error('Failed to update game record, or game status changed unexpectedly.')
    }

    // 3. Retrieve and return the updated game
    const updatedGame = await db.get<GameStat>('SELECT * FROM gameStats WHERE id = ?', [gameId])

    if (!updatedGame) {
      throw new Error('Failed to retrieve updated game data.')
    }

    res.status(200).json(updatedGame)
  } catch (error) {
    console.error('Error saving game:', error)
    next(error) // Pass error to global error handler
  }
}

export const completeGame = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id
  const gameId = parseInt(req.params.id, 10)
  const { moves, elapsedTime } = req.body // Only need final moves and time

  // --- Validation ---
  if (!userId) {
    res.status(401).json({ message: 'Authentication required.' }); return;
  }
  if (isNaN(gameId)) {
    res.status(400).json({ message: 'Invalid game ID.' }); return;
  }
  if (typeof moves !== 'number' || typeof elapsedTime !== 'number') {
    res.status(400).json({
      message: 'Missing or invalid data: final moves and elapsedTime are required.'
    }); return;
  }

  let db: Database | null = null
  try {
    db = await getDb()

    // 1. Verify the game exists, belongs to the user, and is 'in-progress'
    const game = await db.get<GameStat>(`SELECT id, user_id, status FROM gameStats WHERE id = ?`, [
      gameId
    ])

    if (!game) {
      res.status(404).json({ message: 'Game not found.' }); return;
    }
    if (game.user_id !== userId) {
      res.status(403).json({ message: 'You are not authorized to complete this game.' }); return;
    }
    if (game.status !== 'in-progress') {
      res.status(400).json({ message: `Game is already ${game.status}. Cannot complete.` }); return;
    }

    // 2. Update the game record to 'completed'
    const updateResult = await db.run(
      `UPDATE gameStats 
       SET status = 'completed', 
           moves = ?, 
           elapsedTime = ?, 
           endTime = CURRENT_TIMESTAMP, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ? AND status = 'in-progress'`,
      [moves, elapsedTime, gameId, userId]
    )

    if (updateResult.changes === 0) {
      throw new Error('Failed to complete game record, or game status changed unexpectedly.')
    }

    // 3. Retrieve and return the final game state
    const completedGame = await db.get<GameStat>('SELECT * FROM gameStats WHERE id = ?', [gameId])

    if (!completedGame) {
      throw new Error('Failed to retrieve completed game data.')
    }

    res.status(200).json(completedGame)
  } catch (error) {
    console.error('Error completing game:', error)
    next(error) // Pass error to global error handler
  }
}

export const resumeGame = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id

  // --- Validation ---
  if (!userId) {
    res.status(401).json({ message: 'Authentication required.' }); return;
  }

  let db: Database | null = null
  try {
    db = await getDb()

    // 1. Find the most recent 'in-progress' game for the user
    const gameToResume = await db.get<GameStat>(
      `SELECT * FROM gameStats 
       WHERE user_id = ? AND status = 'in-progress' 
       ORDER BY startTime DESC 
       LIMIT 1`,
      [userId]
    )

    // 2. Return the game or 404
    if (gameToResume) {
      res.status(200).json(gameToResume);
    } else {
      res.status(404).json({ message: 'No active game found to resume.' });
    }
  } catch (error) {
    console.error('Error resuming game:', error)
    next(error) // Pass error to global error handler
  }
}

export const getHallOfFame = async (req: Request, res: Response, next: NextFunction) => {
  // --- Query Parameters ---
  const limit = parseInt(req.query.limit as string, 10) || 10 // Default limit 10
  const difficulty = req.query.difficulty as string | undefined

  // Basic validation for limit
  if (isNaN(limit) || limit <= 0) {
    res.status(400).json({ message: 'Invalid limit parameter.' }); return;
  }

  let db: Database | null = null
  try {
    db = await getDb()

    // --- Build Query ---
    let sql = `
      SELECT 
        gs.id, gs.user_id, gs.difficulty, gs.moves, gs.elapsedTime, gs.endTime,
        u.name as username -- Get username from users table
      FROM gameStats gs
      JOIN users u ON gs.user_id = u.id
      WHERE gs.status = 'completed' 
    `
    const params: (string | number)[] = []

    if (difficulty) {
      sql += ` AND gs.difficulty = ?`
      params.push(difficulty)
    }

    sql += ` ORDER BY gs.moves ASC, gs.elapsedTime ASC LIMIT ?`
    params.push(limit)

    // --- Execute Query ---
    const hallOfFameEntries = await db.all(sql, params)

    res.status(200).json(hallOfFameEntries)
  } catch (error) {
    console.error('Error getting Hall of Fame:', error)
    next(error) // Pass error to global error handler
  }
}

export const getUserHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id

  // --- Validation ---
  if (!userId) {
    res.status(401).json({ message: 'Authentication required.' }); return;
  }

  // --- Query Parameters ---
  const limit = parseInt(req.query.limit as string, 10) || 20 // Default limit 20
  const offset = parseInt(req.query.offset as string, 10) || 0 // Default offset 0
  const status = req.query.status as string | undefined // Optional status filter

  // Basic validation for pagination
  if (isNaN(limit) || limit <= 0) {
    res.status(400).json({ message: 'Invalid limit parameter.' }); return;
  }
  if (isNaN(offset) || offset < 0) {
    res.status(400).json({ message: 'Invalid offset parameter.' }); return;
  }
  // Optional: Validate status against allowed values ('in-progress', 'completed', 'abandoned')
  const allowedStatuses = ['in-progress', 'completed', 'abandoned']
  if (status && !allowedStatuses.includes(status)) {
    res
      .status(400)
      .json({ message: `Invalid status filter. Allowed values: ${allowedStatuses.join(', ')}.` }); return;
  }

  let db: Database | null = null
  try {
    db = await getDb()

    // --- Build Query ---
    let sql = `SELECT * FROM gameStats WHERE user_id = ?`
    const params: (string | number)[] = [userId]

    if (status) {
      sql += ` AND status = ?`
      params.push(status)
    }

    sql += ` ORDER BY startTime DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    // --- Execute Query ---
    const userGames = await db.all<GameStat[]>(sql, params)

    // Optional: Get total count for pagination headers if needed
    let countSql = `SELECT COUNT(*) as total FROM gameStats WHERE user_id = ?`
    const countParams: (string | number)[] = [userId]
    if (status) {
      countSql += ` AND status = ?`

      countParams.push(status)
    }
    const { total } = await db.get(countSql, countParams)
    res.setHeader('X-Total-Count', total) // Example header

    res.status(200).json(userGames)
  } catch (error) {
    console.error('Error getting user game history:', error)
    next(error) // Pass error to global error handler
  }
}

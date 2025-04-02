import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getDb } from '../database'

// Extend Request type if using custom properties like req.user
interface AuthenticatedRequest extends Request {
  user?: { id: number /* add other user properties if needed */ }
}

interface JwtPayload {
  id: string
  role: string
  [key: string]: any
}

export function verifyToken(token?: string): JwtPayload | null {
  if (!token) return null

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET not configured')
    }
    return jwt.verify(token, secret) as JwtPayload
  } catch (err) {
    return null
  }
}

// Placeholder Authentication Middleware

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('Auth Middleware Triggered (Placeholder)')

  // In a real implementation, you would:
  // 1. Extract token (from header, cookie, etc.)
  // 2. Verify the token (e.g., using jwt.verify)
  // 3. If valid, find the user in the database
  // 4. Attach user info to the request object (e.g., req.user = { id: userId, ... })
  // 5. If invalid or no token, send a 401 Unauthorized response or call next(error)

  const token = req.headers.authorization?.split(' ')[1]
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Verify user still exists
  const db = await getDb()
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' })
  }

  const user = await db.get('SELECT id FROM users WHERE id = ?', [decoded.id])
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' })
  }

  req.user = decoded.Number()

  console.log('Simulated user attached:', req.user)
  next() // Proceed to the next middleware or route handler
}

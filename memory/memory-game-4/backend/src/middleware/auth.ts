import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getDb } from '../database'

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

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
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

  req.user = decoded
  next()
}

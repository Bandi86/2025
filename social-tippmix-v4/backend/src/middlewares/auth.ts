import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../lib/client'
import session from 'express-session'

declare module 'express-session' {
  interface SessionData {
    userId?: string
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret'

// Middleware: csak bejelentkezett felhasználó férhet hozzá
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // 1. Session alapú
  if (req.isAuthenticated && req.isAuthenticated()) return next()
  // 2. JWT az Authorization headerben vagy session_token cookie-ban
  const authHeader = req.headers.authorization
  let token: string | undefined
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  } else if (req.cookies && req.cookies.session_token) {
    token = req.cookies.session_token
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      req.user = decoded
      return next()
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }
  }
  res.status(401).json({ error: 'Not authenticated' })
}

// Middleware: csak adott szerepkörrel rendelkező felhasználó férhet hozzá
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let userId: string | undefined
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      userId = (req.user as any).id
    } else if (req.session && req.session.userId) {
      userId = req.session.userId
    }
    if (!userId) return res.status(401).json({ error: 'Not authenticated' })
    // Lekérjük a user-t az adatbázisból
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(401).json({ error: 'User not found' })
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}

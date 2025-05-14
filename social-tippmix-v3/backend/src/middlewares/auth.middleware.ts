import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

dotenv.config()

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const jwtSecret = process.env.JWT_SECRET
  const token = req.cookies['token']

  // Ellenőrizzük, hogy a token és a JWT titkos kulcs létezik-e
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }
  if (!jwtSecret) {
    res.status(500).json({ message: 'JWT secret is not configured' })
    return
  }
  try {
    const decoded = jwt.verify(token, jwtSecret)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' })
  }
}

const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    next()
  }
}
export { authenticate, authorize }

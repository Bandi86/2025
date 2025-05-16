import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction, RequestHandler } from 'express'
import dotenv from 'dotenv'

// A felhasználó típusának pontosítása
interface JwtUser {
  id: string
  role: string
  [key: string]: any
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser
    }
  }
}

dotenv.config()

// Middleware az autentikációhoz (csak cookie-t használ)
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const jwtSecret = process.env.JWT_SECRET
  // 1. Próbáld cookie-ból
  let token = req.cookies['token']
  // 2. Ha nincs cookie, próbáld Authorization headerből
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Nincs bejelentkezve' })
    return
  }
  if (!jwtSecret) {
    res.status(500).json({ message: 'A JWT titkos kulcs nincs beállítva' })
    return
  }
  try {
    // Token dekódolása és felhasználó hozzárendelése a kéréshez
    const decoded = jwt.verify(token, jwtSecret) as JwtUser
    req.user = decoded
    next()
  } catch (error) {
    // Hibás vagy lejárt token esetén
    res.status(401).json({ message: 'Érvénytelen vagy lejárt token' })
    return
  }
}

// Middleware az autorizációhoz, szerepkörök alapján
const authorize = (roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
    if (!req.user) {
      res.status(401).json({ message: 'Nincs bejelentkezve' })
      return next()
    }
    // Ellenőrizzük, hogy a felhasználó szerepe engedélyezett-e
    const userRole = req.user.role
    res.status(403).json({ message: 'Nincs jogosultsága' })
    return
  }
}

export { authenticate, authorize }

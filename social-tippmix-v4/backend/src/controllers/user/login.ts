import { Request, Response, NextFunction } from 'express'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import prisma from '../../lib/client'

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret'
const NODE_ENV = process.env.NODE_ENV || 'development'

export default async function login(req: Request, res: Response, next: NextFunction) {
  interface AuthInfo {
    message?: string
  }

  interface User {
    id: string // Changed to string to match JWT payload and Prisma schema typically
    username: string
    password: string
    role: string
  }

  passport.authenticate('local', (err: any, user: User | false, info: AuthInfo | undefined) => {
    if (err) return next(err)
    if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials' })
    req.logIn(user, async (err: any) => {
      if (err) return next(err)
      // isOnline és lastLogin frissítése
      await prisma.user.update({
        where: { id: user.id }, // Assuming user.id is string from passport strategy
        data: {
          isOnline: true,
          lastLogin: new Date()
        }
      })

      // JWT token generálás
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        {
          expiresIn: '1d'
        }
      )

      // Set JWT as an HTTPOnly cookie
      res.cookie('session_token', token, {
        httpOnly: true,
        secure: NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'lax', // Or 'strict' depending on your needs
        maxAge: 24 * 60 * 60 * 1000 // 1 day, should match token expiry
      })

      // Ne adjuk vissza a jelszót és a tokent a JSON válaszban
      const { password, ...userWithoutPassword } = user
      res.json({
        user: userWithoutPassword,
        sessionId: req.sessionID // This is the express-session ID, separate from JWT
        // token: token, // Token is now in cookie, not in response body
      })
    })
  })(req, res, next)
}

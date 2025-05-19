import { Request, Response, NextFunction } from 'express'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import prisma from '../../lib/client'

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret'

export default function login(req: Request, res: Response, next: NextFunction) {
  interface AuthInfo {
    message?: string
  }

  interface User {
    id: number
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
        where: { id: String(user.id) },
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
      // Ne adjuk vissza a jelszót a válaszban
      const { password, ...userWithoutPassword } = user
      res.json({
        user: userWithoutPassword,
        sessionId: req.sessionID,
        token
      })
    })
  })(req, res, next)
}

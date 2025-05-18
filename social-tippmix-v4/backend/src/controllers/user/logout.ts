import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'

export function logout(req: Request, res: Response, next: NextFunction) {
  req.logout(async function (err) {
    if (err) return next(err)
    // isOnline false-ra állítása, ha van user
    if (req.user && (req.user as any).id) {
      try {
        await prisma.user.update({
          where: { id: (req.user as any).id },
          data: { isOnline: false }
        })
      } catch (e) {
        // nem kritikus, csak logoljuk
        console.error('isOnline update error:', e)
      }
    }
    req.session?.destroy((err) => {
      if (err) return next(err)
      res.clearCookie('connect.sid')
      res.json({ message: 'Logged out' })
    })
  })
}

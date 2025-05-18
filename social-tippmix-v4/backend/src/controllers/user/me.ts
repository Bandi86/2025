import { Request, Response } from 'express'
import prisma from '../../lib/client'

export async function me(req: Request, res: Response) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const user = await prisma.user.findUnique({ where: { id: (req.user as any).id } })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json({ id: user.id, username: user.username })
}

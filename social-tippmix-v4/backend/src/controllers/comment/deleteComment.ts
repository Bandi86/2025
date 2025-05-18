import { Request, Response } from 'express'
import prisma from '../../lib/client'

export async function deleteComment(req: Request, res: Response) {
  const { id } = req.params
  let userId: string | undefined
  if (req.user && typeof req.user === 'object' && 'id' in req.user) {
    userId = (req.user as any).id
  } else if (req.session && req.session.userId) {
    userId = req.session.userId
  }
  if (!userId) return res.status(401).json({ error: 'Not authenticated' })
  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) return res.status(404).json({ error: 'Comment not found' })
  if (comment.authorId !== userId) return res.status(403).json({ error: 'Forbidden' })
  await prisma.comment.delete({ where: { id } })
  res.json({ message: 'Comment deleted' })
}

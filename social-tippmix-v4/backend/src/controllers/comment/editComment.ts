import { Request, Response } from 'express'
import prisma from '../../lib/client'

export async function editComment(req: Request, res: Response) {
  const { id } = req.params
  const { content } = req.body
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
  if (!content) return res.status(400).json({ error: 'content kötelező' })
  const updated = await prisma.comment.update({
    where: { id },
    data: { content },
    include: {
      author: { select: { id: true, username: true, avatar: true } },
      post: { select: { id: true, title: true } }
    }
  })
  res.json(updated)
}

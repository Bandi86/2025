import { Request, Response } from 'express'
import prisma from '../../lib/client'

export async function getCommentById(req: Request, res: Response) {
  const { id } = req.params
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, avatar: true } },
      post: { select: { id: true, title: true } }
    }
  })
  if (!comment) return res.status(404).json({ error: 'Comment not found' })
  res.json(comment)
}

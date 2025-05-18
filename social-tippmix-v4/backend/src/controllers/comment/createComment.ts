import { Request, Response } from 'express'
import prisma from '../../lib/client'

export async function createComment(req: Request, res: Response) {
  const { postId, content } = req.body
  let userId: string | undefined
  if (req.user && typeof req.user === 'object' && 'id' in req.user) {
    userId = (req.user as any).id
  } else if (req.session && req.session.userId) {
    userId = req.session.userId
  }
  if (!userId) return res.status(401).json({ error: 'Not authenticated' })
  if (!postId || !content) return res.status(400).json({ error: 'postId és content kötelező' })
  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      authorId: userId
    },
    include: {
      author: { select: { id: true, username: true, avatar: true } },
      post: { select: { id: true, title: true } }
    }
  })
  res.status(201).json(comment)
}

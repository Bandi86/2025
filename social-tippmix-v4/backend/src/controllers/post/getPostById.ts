import { Request, Response } from 'express'
import prisma from '../../lib/client'

export async function getPostById(req: Request, res: Response) {
  const { id } = req.params
  // id lehet post id vagy slug
  const post = await prisma.post.findFirst({
    where: {
      OR: [{ id }, { slug: id }]
    },
    include: {
      author: { select: { id: true, username: true, avatar: true } },
      tags: true,
      _count: { select: { likes: true, comments: true } }
    }
  })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json(post)
}

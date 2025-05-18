import { Request, Response } from 'express'
import prisma from '../../lib/client'

export async function getComments(req: Request, res: Response) {
  const { postId, authorId, page = '1', pageSize = '20' } = req.query
  const take = Math.max(1, Math.min(100, parseInt(pageSize as string, 10) || 20))
  const skip = (Math.max(1, parseInt(page as string, 10) || 1) - 1) * take
  const where: any = {}
  if (postId) where.postId = postId
  if (authorId) where.authorId = authorId
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        post: { select: { id: true, title: true } }
      }
    }),
    prisma.comment.count({ where })
  ])
  res.json({ total, page: Number(page), pageSize: take, comments })
}

import { Request, Response } from 'express'
import prisma from '../lib/client'

export async function globalSearch(req: Request, res: Response) {
  const { type, q, page = '1', pageSize = '10', ...filters } = req.query
  if (!type || !q || typeof type !== 'string' || typeof q !== 'string') {
    return res.status(400).json({ error: 'type és q paraméter kötelező' })
  }
  const take = Math.max(1, Math.min(100, parseInt(pageSize as string, 10) || 10))
  const skip = (Math.max(1, parseInt(page as string, 10) || 1) - 1) * take

  let results: any[] = []
  let total = 0

  if (type === 'user') {
    ;[results, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } }
          ],
          ...(filters.role ? { role: filters.role } : {})
        },
        skip,
        take,
        select: { id: true, username: true, email: true, name: true, avatar: true, role: true }
      }),
      prisma.user.count({
        where: {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } }
          ],
          ...(filters.role ? { role: filters.role } : {})
        }
      })
    ])
  } else if (type === 'post') {
    ;[results, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } }
          ],
          ...(filters.category ? { category: filters.category } : {})
        },
        skip,
        take,
        include: {
          author: { select: { id: true, username: true, avatar: true } },
          tags: true,
          _count: { select: { likes: true, comments: true } }
        }
      }),
      prisma.post.count({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } }
          ],
          ...(filters.category ? { category: filters.category } : {})
        }
      })
    ])
  } else if (type === 'comment') {
    ;[results, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          content: { contains: q, mode: 'insensitive' },
          ...(filters.authorId ? { authorId: filters.authorId } : {})
        },
        skip,
        take,
        include: {
          author: { select: { id: true, username: true, avatar: true } },
          post: { select: { id: true, title: true } }
        }
      }),
      prisma.comment.count({
        where: {
          content: { contains: q, mode: 'insensitive' },
          ...(filters.authorId ? { authorId: filters.authorId } : {})
        }
      })
    ])
  } else {
    return res
      .status(400)
      .json({ error: 'Ismeretlen keresési típus (type): user, post vagy comment lehet.' })
  }

  res.json({
    type,
    total,
    page: Number(page),
    pageSize: take,
    results
  })
}

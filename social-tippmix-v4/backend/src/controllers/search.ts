import { Request, Response } from 'express'
import prisma from '../lib/client'
import { PostCategory } from '@prisma/client'

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
            { email: { contains: q, mode: 'insensitive' } }
          ],
          ...(filters.role
            ? {
                role: Array.isArray(filters.role)
                  ? String(filters.role[0])
                  : typeof filters.role === 'object'
                  ? String(filters.role)
                  : String(filters.role)
              }
            : {})
        },
        skip,
        take,
        select: { id: true, username: true, email: true, avatar: true, role: true }
      }),
      prisma.user.count({
        where: {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } }
          ],
          ...(filters.role
            ? {
                role: Array.isArray(filters.role)
                  ? String(filters.role[0])
                  : typeof filters.role === 'object'
                  ? String(filters.role)
                  : String(filters.role)
              }
            : {})
        }
      })
    ])
  } else if (type === 'post') {
    let category: string | undefined
    if (Array.isArray(filters.category)) {
      category = String(filters.category[0])
    } else if (typeof filters.category === 'object') {
      category = String(filters.category)
    } else if (filters.category) {
      category = String(filters.category)
    }
    let categoryFilter = {}
    if (category !== undefined) {
      // Validate category against PostCategory enum
      if (!Object.values(PostCategory).includes(category as PostCategory)) {
        return res.status(400).json({ error: `Érvénytelen kategória: ${category}` })
      }
      categoryFilter = { category: { equals: category as PostCategory } }
    }
    ;[results, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } }
          ],
          ...categoryFilter
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
          ...categoryFilter
        }
      })
    ])
  } else if (type === 'comment') {
    const authorId = Array.isArray(filters.authorId)
      ? String(filters.authorId[0])
      : typeof filters.authorId === 'object'
      ? String(filters.authorId)
      : filters.authorId
    ;[results, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          content: { contains: q, mode: 'insensitive' },
          ...(authorId ? { authorId: authorId } : {})
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
          ...(authorId ? { authorId: authorId } : {})
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

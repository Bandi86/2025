import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'

export async function getAllPosts(req: Request, res: Response) {
  // Szűrési paraméterek
  const {
    category,
    authorId,
    tagId,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    pageSize = '10'
  } = req.query

  // Prisma where objektum
  const where: any = {}
  if (category) where.category = category
  if (authorId) where.authorId = authorId
  if (tagId) where.tags = { some: { id: tagId } }
  if (search && typeof search === 'string') {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Rendezés
  let orderBy: any = { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' }
  // Speciális: likes vagy comments száma szerint
  if (sortBy === 'likes') orderBy = { likes: { _count: sortOrder === 'asc' ? 'asc' : 'desc' } }
  if (sortBy === 'comments')
    orderBy = { comments: { _count: sortOrder === 'asc' ? 'asc' : 'desc' } }

  // Pagináció
  const take = Math.max(1, Math.min(100, parseInt(page as string, 10) || 10))
  const skip = (Math.max(1, parseInt(page as string, 10) || 1) - 1) * take

  // Lekérdezés
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        tags: true,
        _count: { select: { likes: true, comments: true } }
      }
    }),
    prisma.post.count({ where })
  ])

  res.json({
    total,
    page: Number(page),
    pageSize: take,
    posts
  })
}

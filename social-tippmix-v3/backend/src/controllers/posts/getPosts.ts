import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'

const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      authorId,
      category,
      adminOnly,
      slug,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      order = 'desc',
      myPosts,
      minComments,
      maxComments,
      minLikes,
      maxLikes,
      limit = 20,
      offset = 0
    } = req.query

    const where: any = {}
    if (title && typeof title === 'string') {
      where.title = { contains: title, mode: 'insensitive' }
    }
    if (authorId && typeof authorId === 'string') {
      where.authorId = authorId
    }
    if (category && typeof category === 'string') {
      where.category = category
    }
    if (slug && typeof slug === 'string') {
      where.slug = slug
    }
    if (adminOnly === 'true') {
      where.author = { role: 'ADMIN' }
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string)
      if (dateTo) where.createdAt.lte = new Date(dateTo as string)
    }
    if (myPosts === 'true' && req.user?.id) {
      where.authorId = req.user.id
    }
    // Prisma aggregate for comments/likes count
    const posts = await prisma.post.findMany({
      where,
      skip: Number(offset),
      take: Number(limit),
      orderBy: { [sortBy as string]: order === 'asc' ? 'asc' : 'desc' },
      include: {
        author: { select: { id: true, name: true, role: true } },
        _count: { select: { comments: true, likes: true } }
      }
    })
    // Filter by min/max comments/likes if needed
    const filtered = posts.filter((post) => {
      if (minComments && post._count.comments < Number(minComments)) return false
      if (maxComments && post._count.comments > Number(maxComments)) return false
      if (minLikes && post._count.likes < Number(minLikes)) return false
      if (maxLikes && post._count.likes > Number(maxLikes)) return false
      return true
    })
    res.status(200).json({ posts: filtered })
  } catch (error) {
    next(error)
  }
}

export default getPosts

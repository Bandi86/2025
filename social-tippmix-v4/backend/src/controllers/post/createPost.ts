import { NextFunction, Request, Response } from 'express'
import prisma from '../../lib/client'

export async function createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, content, slug, category, imageUrl, tags } = req.body
    // Kötelező mezők ellenőrzése
    if (!title || !content || !slug || !category) {
      res.status(400).json({ error: 'title, content, slug, category kötelező' })
    }
    // Slug egyediség ellenőrzése
    const existing = await prisma.post.findUnique({ where: { slug } })
    if (existing) {
      res.status(409).json({ error: 'Slug already exists' })
    }
    // Auth user ID meghatározása (JWT vagy session alapján)
    let authorId: string | undefined
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      authorId = (req.user as any).id
    } else if (req.session && req.session.userId) {
      authorId = req.session.userId
    }
    if (!authorId) {
      res.status(401).json({ error: 'Not authenticated' })
    }
    // Post létrehozása
    const post = await prisma.post.create({
      data: {
        title,
        content,
        slug,
        category,
        imageUrl,
        authorId,
        // Tag-ek hozzárendelése, ha vannak
        tags:
          tags && Array.isArray(tags)
            ? { connect: tags.map((tagId: string) => ({ id: tagId })) }
            : undefined
      },
      include: { author: true, tags: true }
    })
    res.status(201).json(post)
  } catch (err) {
    next(err)
  }
}

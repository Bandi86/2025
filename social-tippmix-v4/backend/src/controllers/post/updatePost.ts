import { Request, Response } from 'express'
import prisma from '../../lib/client'

export async function updatePost(req: Request, res: Response) {
  const { id } = req.params
  const { title, content, slug, category, imageUrl, tags } = req.body

  // Ellenőrizd, hogy a user a szerző-e (JWT/session alapján)
  let userId: string | undefined
  if (req.user && typeof req.user === 'object' && 'id' in req.user) {
    userId = (req.user as any).id
  } else if (req.session && req.session.userId) {
    userId = req.session.userId
  }
  if (!userId) return res.status(401).json({ error: 'Not authenticated' })

  // Lekérjük a postot
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  if (post.authorId !== userId) return res.status(403).json({ error: 'Forbidden' })

  // Slug egyediség ellenőrzése, ha változik
  if (slug && slug !== post.slug) {
    const existing = await prisma.post.findUnique({ where: { slug } })
    if (existing) return res.status(409).json({ error: 'Slug already exists' })
  }

  // Frissítés
  const updated = await prisma.post.update({
    where: { id },
    data: {
      title: title ?? post.title,
      content: content ?? post.content,
      slug: slug ?? post.slug,
      category: category ?? post.category,
      imageUrl: imageUrl ?? post.imageUrl,
      tags:
        tags && Array.isArray(tags)
          ? { set: tags.map((tagId: string) => ({ id: tagId })) }
          : undefined
    },
    include: { author: true, tags: true }
  })
  res.json(updated)
}

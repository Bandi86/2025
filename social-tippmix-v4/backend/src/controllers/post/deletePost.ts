import { Request, Response } from 'express'
import prisma from '../../lib/client'

export async function deletePost(req: Request, res: Response) {
  const { id } = req.params

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

  // Törlés
  await prisma.post.delete({ where: { id } })
  res.json({ message: 'Post deleted' })
}

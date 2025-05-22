import { Request, Response } from 'express'
import prisma from '../../lib/client'

// Toggle like for post or comment
export async function toggleLike(req: Request, res: Response) {
  // @ts-expect-error: Assume user object has 'id' property set by authentication middleware
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Not authenticated' })

  const { postId, commentId } = req.params
  if (!postId && !commentId) {
    return res.status(400).json({ error: 'postId vagy commentId szükséges' })
  }

  let where: any = { userId }
  if (postId) where.postId = postId
  if (commentId) where.commentId = commentId

  // Ne lehessen saját bejegyzést vagy kommentet like-olni
  if (postId) {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
    if (!post) return res.status(404).json({ error: 'A poszt nem található' })
    if (post.authorId === userId)
      return res.status(403).json({ error: 'Saját posztot nem lehet like-olni' })
  }
  if (commentId) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true }
    })
    if (!comment) return res.status(404).json({ error: 'A komment nem található' })
    if (comment.authorId === userId)
      return res.status(403).json({ error: 'Saját kommentet nem lehet like-olni' })
  }

  // Ellenőrizzük, hogy már létezik-e like
  const existing = await prisma.like.findFirst({ where })
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
    return res.json({ liked: false })
  } else {
    // Egy ember csak egyszer like-olhat (ez a where miatt biztosított)
    const created = await prisma.like.create({ data: where })
    return res.json({ liked: true, like: created })
  }
}

// Get all likes for a post
export async function getLikesForPost(req: Request, res: Response) {
  const { postId } = req.params
  if (!postId) return res.status(400).json({ error: 'postId szükséges' })
  const likes = await prisma.like.findMany({ where: { postId }, include: { user: true } })
  res.json(likes)
}

// Get all likes for a comment
export async function getLikesForComment(req: Request, res: Response) {
  const { commentId } = req.params
  if (!commentId) return res.status(400).json({ error: 'commentId szükséges' })
  const likes = await prisma.like.findMany({ where: { commentId }, include: { user: true } })
  res.json(likes)
}

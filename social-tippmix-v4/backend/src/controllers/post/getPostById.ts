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
      author: {
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          role: true
        }
      },
      tags: {
        select: {
          id: true,
          name: true
        }
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      },
      likes: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      },
      _count: { select: { likes: true, comments: true } }
    }
  })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  // Ensure imageUrl is always present (null if missing or undefined)
  if (typeof post.imageUrl === 'undefined' || post.imageUrl === undefined) post.imageUrl = null
  res.json(post)
}

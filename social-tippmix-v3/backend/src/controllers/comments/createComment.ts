import { Request, Response } from 'express'
import prisma from '../../lib/client'
import { ApiError } from '../../lib/error'
// AuthenticatedRequest import eltávolítva, mivel a req.user globálisan elérhető

export const createComment = async (req: Request, res: Response): Promise<void> => {
  const { content, postId } = req.body
  const userId = req.user?.id // Az authentikált felhasználó ID-ja

  if (!userId) {
    res.status(401).json(new ApiError(401, 'Authentikáció szükséges.'))
    return
  }

  if (!content || !postId) {
    res.status(400).json(new ApiError(400, 'A komment tartalma és a poszt azonosítója kötelező.'))
    return
  }

  try {
    // Ellenőrizzük, hogy a poszt létezik-e
    const postExists = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!postExists) {
      res.status(404).json(new ApiError(404, 'A megadott poszt nem található.'))
      return
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId // userId itt már biztosan string
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    res.status(201).json(newComment)
  } catch (error) {
    console.error('Hiba történt a komment létrehozása közben:', error)
    if (error instanceof ApiError) {
      res.status(error.status).json(error) // Javítva: error.statusCode -> error.status
    } else {
      res.status(500).json(new ApiError(500, 'Szerverhiba történt a komment létrehozása közben.'))
    }
  }
}

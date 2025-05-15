import { NextFunction, Request, Response } from 'express'
import { ApiError } from '../../lib/error'
import prisma from '../../lib/client'
import { validatePost } from '../../lib/auth/validation'

const editPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, content, authorId, category, imageUrl } = req.body
    const postId = req.params.id

    // 1. Validáció
    const { valid, errors } = validatePost({ post: { title, content, authorId } })
    if (!valid) {
      throw new ApiError(400, 'Hibás adatok')
    }

    // 2. Ellenőrizzük, hogy a poszt létezik-e
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      throw new ApiError(404, 'A poszt nem található')
    }

    // 3. Frissítés
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        category,
        imageUrl
      }
    })

    res.status(200).json({
      message: 'A poszt sikeresen frissítve lett',
      post: updatedPost
    })
  } catch (error) {
    next(error)
  }
}

export default editPost

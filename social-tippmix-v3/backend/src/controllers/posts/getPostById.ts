import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../../lib/error'
import prisma from '../../lib/client'

const getPostById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Csak autentikált felhasználó férhet hozzá
    if (!req.user || !req.user.id) {
      return next(new ApiError(401, 'Bejelentkezés szükséges'))
    }
    if (!req.params.id) {
      return next(new ApiError(400, 'ID megadása kötelező'))
    }
    // Ellenőrizzük, hogy a felhasználó létezik-e
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) {
      return next(new ApiError(404, 'A felhasználó nem található'))
    }
    const postId = req.params.id
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      return next(new ApiError(404, 'A poszt nem található'))
    }
    res.status(200).json({ post })
  } catch (error) {
    next(error)
  }
}

export default getPostById

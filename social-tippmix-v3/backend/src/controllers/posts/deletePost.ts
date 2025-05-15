import { NextFunction, Request, Response } from 'express'
import { ApiError } from '../../lib/error'
import prisma from '../../lib/client'

const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    // Ellenőrizzük, hogy a poszt létezik-e
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) {
      throw new ApiError(404, 'A poszt nem található')
    }
    // Ellenőrizzük, hogy a felhasználó jogosult-e törölni a posztot
    if (req.user?.role !== 'ADMIN' && req.user?.id !== post.authorId) {
      throw new ApiError(401, 'Nincs jogosultság a poszt törlésére')
    }
    // Töröljük a posztot
    await prisma.post.delete({
      where: { id }
    })
    res.status(204).send()
  } catch (error) {
    next(error)

  }
}

export default deletePost

import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../../lib/error'
import prisma from '../../lib/client'

 export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id
    // Ellenőrizzük, hogy a felhasználó létezik-e
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })
    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    // nincs jogosítva a felhasználó
    if (user.role !== 'ADMIN' && user.id !== req.user?.id) {
      throw new ApiError(401, 'nincs jogosultságod')
    }
    // Válasz küldése a felhasználó adataival
    res.status(200).json({ data: user })
  } catch (error) {
    next(error)
  }
}



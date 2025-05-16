// filepath: c:\Users\bandi\Documents\code\2025\social-tippmix-v3\backend\src\controllers\users\deleteUser.ts
import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'
import { ApiError } from '../../lib/error'

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id

    // Optional: Check if the user performing the delete is an admin or the user themselves
    // For example, if you have user roles and req.user is populated by auth middleware:
    // if (req.user?.role !== 'ADMIN' && req.user?.id !== userId) {
    //   throw new ApiError(403, 'Forbidden: You do not have permission to delete this user.');
    // }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new ApiError(404, `User with ID ${userId} not found`)
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    res.status(200).json({
      status: 'success',
      message: `User with ID ${userId} successfully deleted`
    })
  } catch (error) {
    next(error)
  }
}

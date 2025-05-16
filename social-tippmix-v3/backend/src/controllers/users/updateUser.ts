// filepath: c:\Users\bandi\Documents\code\2025\social-tippmix-v3\backend\src\controllers\users\updateUser.ts
import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'
import { ApiError } from '../../lib/error'
import bcrypt from 'bcrypt' // For password hashing if password can be updated

export const updateUser = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
  try {
    const userId = req.params.id // Assuming the user ID to update is in the route parameters
    const { name, email, password, role, isOnline } = req.body

    // Optional: Authorization check (e.g., admin or self-update)
    // if (req.user?.role !== 'ADMIN' && req.user?.id !== userId) {
    //   throw new ApiError(403, 'Forbidden: You do not have permission to update this user.');
    // }

    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!userToUpdate) {
      throw new ApiError(404, `User with ID ${userId} not found`)
    }

    const updateData: any = {}

    if (name) updateData.name = name
    if (email) {
      // Optional: Check if the new email is already taken by another user
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email }
      })
      if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
        throw new ApiError(400, 'Email already in use by another account.')
      }
      updateData.email = email
    }

    if (password) {
      // Hash the new password before saving
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password = hashedPassword
    }

    // Only allow certain fields to be updated, or add role-based checks for sensitive fields like 'role'
    if (role && req.user?.role === 'ADMIN') {
      // Example: Only admin can change role
      updateData.role = role
    }

    if (isOnline !== undefined) {
      // Potentially only allow admin to set this, or handle it via login/logout logic primarily
      if (req.user?.role === 'ADMIN') {
        updateData.isOnline = isOnline
      }
    }

    if (Object.keys(updateData).length === 0) {
       res.status(400).json({
         status: 'fail',
         message: 'No valid fields provided for update'
       })
       return
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // Remove password from the returned user object
    const { password: _, ...userWithoutPassword } = updatedUser

    res.status(200).json({
      status: 'success',
      data: {
        user: userWithoutPassword
      },
      message: `User with ID ${userId} successfully updated`
    })
  } catch (error) {
    next(error)
  }
}

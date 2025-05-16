import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../../lib/error'
import prisma from '../../lib/client'
import { Prisma } from '@prisma/client'

export const getAllUser = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const sortBy = (req.query.sortBy as string) || 'createdAt'
    const sortOrder = (req.query.sortOrder as Prisma.SortOrder) || 'asc'
    const search = req.query.search as string
    const role = req.query.role as string // Assuming role is a string like 'USER' or 'ADMIN'
    const isOnline = req.query.isOnline as string // Assuming isOnline is 'true' or 'false'

    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      // Assuming your User model has a 'role' field of type enum or string
      // Adjust this based on your actual User model definition for 'role'
      // For example, if role is an enum Role { USER, ADMIN }, you might need:
      // where.role = role as Role;
      where.role = role as any // Use 'as any' if role is a string and Prisma expects an enum
    }

    if (isOnline !== undefined) {
      where.isOnline = isOnline === 'true'
    }

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      where,
      orderBy: {
        [sortBy]: sortOrder
      }
    })

    const totalUsers = await prisma.user.count({ where })
    const totalPages = Math.ceil(totalUsers / limit)

    if (!users || users.length === 0) {
      // It's better to return an empty array if no users match the criteria
      // rather than throwing a 404, unless specifically required.
     res.status(200).json({
        status: 'success',
        results: 0,
        totalPages: 0,
        currentPage: page,
        data: {
          users: []
        },
        message: 'No users found matching your criteria'
      })
    }

    res.status(200).json({
      status: 'success',
      results: users.length,
      totalPages,
      currentPage: page,
      data: {
        users
      },
      message: 'Sikeres lekérdezés'
    })
  } catch (error) {
    next(error)
  }
}

import { Request, Response } from 'express'
import prisma from '../../lib/client'
import { ApiError } from '../../lib/error' // ApiError importálása

export const getCommentsByPostId = async (req: Request, res: Response): Promise<void> => {
  const { postId } = req.params
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query

  if (!postId) {
    res.status(400).json(new ApiError(400, 'A poszt azonosítója kötelező.'))
    return
  }

  const pageNum = parseInt(page as string, 10)
  const limitNum = parseInt(limit as string, 10)

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    res.status(400).json(new ApiError(400, 'Érvénytelen lapozási paraméterek.'))
    return
  }

  const validSortByFields = ['createdAt', 'updatedAt', 'content']
  const sortField = validSortByFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt'
  const sortOrder =
    (order as string) === 'asc' || (order as string) === 'desc' ? (order as string) : 'desc'

  try {
    const postExists = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!postExists) {
      res.status(404).json(new ApiError(404, 'A megadott poszt nem található.'))
      return
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
        // _count: {
        //   select: { likes: true }
        // }
      },
      orderBy: {
        [sortField]: sortOrder
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum
    })

    const totalComments = await prisma.comment.count({
      where: { postId }
    })

    res.status(200).json({
      data: comments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalComments / limitNum),
        totalItems: totalComments,
        itemsPerPage: limitNum
      }
    })
  } catch (error) {
    console.error('Hiba történt a kommentek lekérdezése közben:', error)
    if (error instanceof ApiError) {
      res.status(error.status).json(error) // Changed from error.statusCode to error.status
    } else {
      res.status(500).json(new ApiError(500, 'Szerverhiba történt a kommentek lekérdezése közben.'))
    }
  }
}

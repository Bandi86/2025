import { Request, Response } from 'express'
import prisma from '../../lib/client'
import { getPagination } from '../../lib/pagination'
import { getFilters } from '../../lib/filters'
import { getSorting } from '../../lib/sorting'
import { getSearch } from '../../lib/search'

export async function getAllUsers(req: Request, res: Response) {
  const { page = '1', pageSize = '10', ...filters } = req.query
  const pageStr = Array.isArray(page) ? page[0] : page
  const pageSizeStr = Array.isArray(pageSize) ? pageSize[0] : pageSize
  const take = Math.max(1, Math.min(100, parseInt(pageSizeStr as string, 10) || 10))
  const skip = (Math.max(1, parseInt(pageStr as string, 10) || 1) - 1) * take

  const pagination = getPagination({ page: String(pageStr), pageSize: String(pageSizeStr) })
  const search = getSearch({ ...req.query })
  const sorting = getSorting({ ...req.query })
  const filter = getFilters({ ...req.query })

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...filter,
        ...(search && {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      skip,
      take,
      orderBy: sorting
    }),
    prisma.user.count({
      where: {
        ...filter,
        ...(search && {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        })
      }
    })
  ])

  res.json({
    users,
    pagination: {
      ...pagination,
      total
    }
  })
}

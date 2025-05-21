import prisma from '../../lib/client'
import { Request, Response } from 'express'
import { ApiError } from '../../lib/error'
import { PostCategory } from '@prisma/client'

export default function getAllCategories(req: Request, res: Response): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Ha csak az enumokat kérjük le (pl. /api/categories?enumsOnly=true)
      if (req.query.enumsOnly === 'true') {
        res.status(200).json({ postCategories: Object.values(PostCategory) })
        return resolve()
      }
      // Itt NINCS külön postCategory tábla, csak az enum!
      // Ha később lesz Category tábla, azt külön kell kezelni.
      res.status(400).json({ error: 'Category tábla nem létezik, csak enum van.' })
      resolve()
    } catch (error) {
      reject(new ApiError(500, 'Internal Server Error'))
    }
  })
}

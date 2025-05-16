import { NextFunction, Request, Response } from 'express'
import { ApiError } from '../../lib/error'
import prisma from '../../lib/client'
import { validatePost } from '../../lib/auth/validation'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

// Create a new post
const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, content, authorId, category, imageUrl } = req.body
    // 1. Validáció
    const { valid, errors } = validatePost({ post: { title, content, authorId } })
    if (!valid) {
      throw new ApiError(400, 'Hibás adatok')
    }
    // 2. User ellenőrzés
    const author = await prisma.user.findUnique({ where: { id: authorId } })
    if (!author) {
      throw new ApiError(404, 'A felhasználó nem található')
    }
    if (!['ADMIN', 'USER'].includes(author.role)) {
      throw new ApiError(403, 'Nincs jogosultság poszt létrehozásához')
    }
    // 3. Slug generálás és egyediség ellenőrzés
    let baseSlug = slugify(title)
    let slug = baseSlug
    let i = 1
    while (await prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`
    }
    // 4. Opcionális kép kezelése
    const postData: any = {
      title,
      content,
      slug,
      authorId,
      category: category || 'HIR' // Default category if not provided
    }
    if (imageUrl) postData.imageUrl = imageUrl
    // 5. Létrehozás
    const post = await prisma.post.create({ data: postData })
    res.status(201).json({
      message: 'A poszt sikeresen létrejött',
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        category: post.category,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt,
        authorId: post.authorId
      }
    })
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.status).json(error) // Use ApiError properties
    } else if (error.code === 'P2002') {
      res.status(409).json(new ApiError(409, 'A slug már létezik')) // Wrap Prisma error in ApiError
    } else {
      // Pass other errors to the global error handler or create a generic ApiError
      next(error)
    }
  }
}

export default createPost

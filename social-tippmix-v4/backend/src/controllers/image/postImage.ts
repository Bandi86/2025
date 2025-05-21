import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import prisma from '../../lib/client'

// Express route handler signature: (req, res, next)
const uploadPostImage = async (req: Request, res: Response): Promise<void> => {
  // Multer middleware already saved the file
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }
  const { userId, postId } = req.body

  // --- SHARP: Resize and optimize image ---
  const originalPath = req.file.path
  // Keep extension, but always output jpeg/webp for best optimization
  const ext = path.extname(originalPath).toLowerCase()
  const isPng = ext === '.png'
  const outputExt = isPng ? '.png' : '.jpg'
  const outputPath = isPng
    ? originalPath // PNG maradjon PNG
    : originalPath.replace(/\.[^.]+$/, '.jpg') // minden másból jpg lesz

  // sharp feldolgozás (max 800x800, minőség 80%)
  await sharp(originalPath)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    [isPng ? 'png' : 'jpeg']({ quality: 80 })
    .toFile(outputPath)

  // Ha új fájl jött létre (nem PNG), töröljük az eredetit
  if (!isPng && outputPath !== originalPath) {
    await fs.unlink(originalPath)
  }

  // Build the public URL (assuming /uploads is statically served)
  const relativePath = path.relative(path.join(__dirname, '../../../userFiles'), outputPath)
  const imageUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`

  // Save the image URL to the post in the DB
  if (postId) {
    await prisma.post.update({
      where: { id: postId },
      data: { imageUrl: imageUrl }
    })
  }

  // Save the image URL to the user in the DB (avatar)
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: imageUrl }
    })
  }

  // Send the image URL back to the client
  res.status(200).json({ url: imageUrl })
}

export default uploadPostImage

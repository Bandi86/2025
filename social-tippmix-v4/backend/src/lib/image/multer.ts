import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'

// Helper to get upload path based on type
export function getUploadPath(type: 'avatar' | 'post', userId?: string, postId?: string) {
  if (type === 'avatar' && userId) {
    return path.join(__dirname, '../../userFiles/avatars', userId)
  }
  if (type === 'post' && userId && postId) {
    return path.join(__dirname, '../../userFiles/postImages', userId, postId)
  }
  // fallback
  return path.join(__dirname, '../../userFiles/other')
}

// Multer storage config
export const storage = multer.diskStorage({
  destination: function (req: Request, file, cb) {
    const { type, userId, postId } = req.body
    const uploadPath = getUploadPath(type, userId, postId)
    fs.mkdirSync(uploadPath, { recursive: true })
    cb(null, uploadPath)
  },
  filename: function (req: Request, file, cb) {
    const ext = path.extname(file.originalname)
    if (req.body.type === 'avatar') {
      cb(null, 'avatar' + ext)
    } else if (req.body.type === 'post') {
      cb(null, Date.now() + ext)
    } else {
      cb(null, file.originalname)
    }
  }
})

export const upload = multer({ storage })

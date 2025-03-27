import jwt from 'jsonwebtoken'
import { Response } from 'express'

interface UserData {
  id: string | number
  email: string
  name: string
}

export default function createToken(user: UserData, res: Response): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable not set')
  }

  // Generate JWT
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  // Set JWT cookie
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  return token
}


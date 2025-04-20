import jwt from 'jsonwebtoken'
import { NextApiRequest } from 'next'
import { parse } from 'cookie'

interface UserToken {
  userId: string
  email: string
}

export function verifyToken(token: string): UserToken | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as UserToken
  } catch (error) {
    return null
  }
}

export function getTokenFromRequest(req: NextApiRequest): string | null {
  const cookies = parse(req.headers.cookie || '')
  return cookies.auth_token || null
}

export async function getCurrentUser(req: NextApiRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return null

  return verifyToken(token)
}
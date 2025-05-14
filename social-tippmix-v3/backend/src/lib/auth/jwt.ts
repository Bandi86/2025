import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET as string
const JWT_EXPIRES_IN = '7d'

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.')
  // A fejlesztési környezetben egyértelműbbé tesszük a hibát, de élesben ez leállíthatja a szervert.
  // Fontold meg, hogy éles környezetben hogyan kezeled ezt (pl. process.exit(1) vagy egyedi hibakezelő).
  throw new Error('JWT_SECRET is not defined. Please set it in your .env file.')
}

export function signJwt(
  payload: object & { id?: string | number; email?: string; name?: string }
) {
  let name = payload.name
  if (!name) {
    if (payload.name) name = payload.name
    else if (payload.email) name = payload.email.split('@')[0]
    else name = 'anonymus'
  }
  return jwt.sign({ ...payload, name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

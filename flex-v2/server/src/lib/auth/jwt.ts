import * as jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv';

dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = '7d'

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.')
  // A fejlesztési környezetben egyértelműbbé tesszük a hibát, de élesben ez leállíthatja a szervert.
  // Fontold meg, hogy éles környezetben hogyan kezeled ezt (pl. process.exit(1) vagy egyedi hibakezelő).
  throw new Error('JWT_SECRET is not defined. Please set it in your .env file.')
}

export function signJwt(
  payload: object & { id?: string | number; email?: string; username?: string; name?: string }
) {
  let username = payload.username
  if (!username) {
    if (payload.name) username = payload.name
    else if (payload.email) username = payload.email.split('@')[0]
    else username = 'anonymus'
  }
  return jwt.sign({ ...payload, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

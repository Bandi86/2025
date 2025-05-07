import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = '7d'

export function signJwt(payload: object & { id?: string | number; email?: string; username?: string; name?: string }) {
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

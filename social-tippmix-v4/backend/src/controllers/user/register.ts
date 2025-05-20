import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import prisma from '../../lib/client'

function isStrongPassword(password: string): boolean {
  // Legalább 8 karakter, kisbetű, nagybetű, szám, speciális karakter
  return (
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    password.length >= 8
  )
}

export async function register(req: Request, res: Response) {
  const { username, password, email } = req.body
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, email and password required' })
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error:
        'A jelszónak legalább 8 karakteresnek kell lennie, tartalmaznia kell kis- és nagybetűt, számot és speciális karaktert.'
    })
  }
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' })
  }
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { username, email, password: hashed } })
  res.status(201).json({ id: user.id, username: user.username, email: user.email })
}

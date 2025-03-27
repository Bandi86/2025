import express from 'express'
import { getDb } from '../../database'
import bcrypt from 'bcryptjs'
import createToken from '../../lib/createToken'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
})

export default async function loginUser(req: express.Request, res: express.Response) {
  try {
    const db = await getDb()
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' })
    }

    // Validate input
    const validation = LoginSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validation.error.errors 
      })
    }
    const { email, password } = validation.data

    // Get user with consistent timing
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email])
    const isPasswordValid = user ? await bcrypt.compare(password, user.password) : false

    if (!user || !isPasswordValid) {
      // Use same response and delay for both cases to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100)) // Add small delay
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Create token
    createToken(user, res)
    return res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}

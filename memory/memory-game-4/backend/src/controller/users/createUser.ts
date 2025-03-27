import express from 'express'
import { getDb } from '../../database'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const CreateUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100)
})

export default async function createUser(req: express.Request, res: express.Response) {
  try {
    const db = await getDb()
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' })
    }

    // Validate input
    const validation = CreateUserSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      })
    }
    const { name, email, password } = validation.data

    // Check for existing user
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email])
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user in transaction
    await db.run('BEGIN TRANSACTION')
    try {
      const result = await db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, 'user']
      )
      await db.run('COMMIT')

      return res.status(201).json({
        id: result.lastID,
        name,
        email,
        message: 'User created successfully'
      })
    } catch (err) {
      await db.run('ROLLBACK')
      throw err
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

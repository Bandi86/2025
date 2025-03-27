import express from 'express'
import { getDb } from '../../database'
import { z } from 'zod'

const UpdateUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email()
})

export default async function updateUser(req: express.Request, res: express.Response) {
  try {
    const db = await getDb()
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' })
    }

    const { id } = req.params
    if (!id) {
      return res.status(400).json({ error: 'Missing user ID' })
    }

    // Validate input
    const validation = UpdateUserSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validation.error.errors 
      })
    }
    const { name, email } = validation.data

    // Check if user exists
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id])
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check for duplicate email
    if (email !== user.email) {
      const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email])
      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' })
      }
    }

    // Update in transaction
    await db.run('BEGIN TRANSACTION')
    try {
      const result = await db.run(
        'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, email, id]
      )
      await db.run('COMMIT')
      
      return res.status(200).json({ 
        message: 'User updated successfully',
        changes: result.changes
      })
    } catch (err) {
      await db.run('ROLLBACK')
      throw err
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}

import express from 'express'
import { getDb } from '../../database'
import { verifyToken } from '../../middleware/auth'

export default async function deleteUser(req: express.Request, res: express.Response) {
  try {
    const db = await getDb()
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' })
    }

    const { id } = req.params
    if (!id) {
      return res.status(400).json({ error: 'Missing user ID' })
    }

    // Verify requester is admin or deleting their own account
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'admin' && decoded.id !== id)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Check if user exists
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id])
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Delete in transaction
    await db.run('BEGIN TRANSACTION')
    try {
      // First delete related data (example: user sessions)
      await db.run('DELETE FROM sessions WHERE user_id = ?', [id])

      // Then delete user
      const result = await db.run('DELETE FROM users WHERE id = ?', [id])
      await db.run('COMMIT')

      return res.status(200).json({
        message: 'User deleted successfully',
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

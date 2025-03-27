import express from 'express'
import { getDb } from '../../database'

export default async function getAllUsers(req: express.Request, res: express.Response) {
  const db = await getDb()
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' })
  }
  const users = await db.all('SELECT * FROM users')
  res.json(users)
}

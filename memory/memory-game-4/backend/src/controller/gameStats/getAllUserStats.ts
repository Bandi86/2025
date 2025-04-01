import express from 'express'
import { getDb } from '../../database'

export default async function getAllUserStats(req: express.Request, res: express.Response) {
  const db = getDb()
}

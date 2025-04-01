import express from 'express'
import { getDb } from '../../database'

export default async function getUserStats(
  req: express.Request,
  res: express.Response
) {
  const {id} = req.params
  const db = getDb()

  
}



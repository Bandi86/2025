import { randomUUID } from 'crypto'
import * as sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { ApiError, NotFoundError } from '../lib/error'

// Adatbázis kapcsolat létrehozása (singleton)
let dbPromise: ReturnType<typeof open> | null = null
export async function getDatabase() {
  if (!dbPromise) {
    dbPromise = open({
      filename: '../../data/media.db',
      driver: sqlite3.Database
    })
  }
  return dbPromise
}

// User létrehozása
export async function createUser(data: { username: string, email: string, password: string }) {
  const db = await getDatabase()
  try {
    const result = await db.run(
      'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
      randomUUID(),
      data.username,
      data.email,
      data.password
    )
    return { id: result.lastID, ...data }
  } catch (err) {
    throw new ApiError(500, 'User creation failed')
  }
}

// User lekérdezése id alapján
export async function getUserById(id: number) {
  const db = await getDatabase()
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', id)
    if (!user) throw new NotFoundError('User not found')
    return user
  } catch (err) {
    throw new ApiError(500, 'User fetch failed')
  }
}

// User frissítése
export async function updateUser(id: number, data: Partial<{ username: string, email: string, password: string }>) {
  const db = await getDatabase()
  const fields = []
  const values = []
  for (const key in data) {
    fields.push(`${key} = ?`)
    values.push((data as any)[key])
  }
  if (fields.length === 0) throw new ApiError(400, 'No data to update')
  values.push(id)
  const result = await db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, ...values)
  if (result.changes === 0) throw new NotFoundError('User not found')
  return getUserById(id)
}

// User törlése
export async function deleteUser(id: number) {
  const db = await getDatabase()
  const result = await db.run('DELETE FROM users WHERE id = ?', id)
  if (result.changes === 0) throw new NotFoundError('User not found')
  return { deleted: true }
}

// User keresése email alapján
export async function getUserByEmail(email: string) {
  const db = await getDatabase()
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', email)
    if (!user) throw new NotFoundError('User not found')
    return user
  } catch (err) {
    throw new ApiError(500, 'User fetch failed')
  }
}

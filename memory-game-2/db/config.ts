import sqlite3 from 'sqlite3'
import { join } from 'path'
import { open, Database } from 'sqlite'
import { compare, hash } from 'bcrypt'
import { randomBytes } from 'crypto'

// Database file path
const dbPath = join(process.cwd(), 'memory-game.db')

// Create a promise-based SQLite database connection
const getDB = async (): Promise<Database> => {
  try {
    // Open database connection with promise-based API
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON')

    // Create users table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        reset_token TEXT DEFAULT NULL,
        reset_token_expires TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create sessions table for auth
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create game_stats table to track user progress
    await db.exec(`
      CREATE TABLE IF NOT EXISTS game_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        time_elapsed INTEGER NOT NULL DEFAULT 0,
        difficulty TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Add update trigger for 'updated_at' field
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;
    `)

    // Check if admin exists, if not create admin user
    const admin = await db.get('SELECT * FROM users WHERE email = ?', ['admin@admin.com'])

    if (!admin) {
      // Hash the admin password with bcrypt
      const hashedPassword = await hash('admin123', 10)

      // Insert admin with hashed password
      await db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [
        'admin',
        'admin@admin.com',
        hashedPassword,
        'admin'
      ])

      console.log('Admin user created successfully')
    }

    console.log('Database initialized successfully')
    return db
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

// Helper functions for authentication
export const authHelpers = {
  async createUser(username: string, email: string, password: string): Promise<number> {
    const db = await getDB()
    const hashedPassword = await hash(password, 10)

    const result = await db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
      username,
      email,
      hashedPassword
    ])

    return result.lastID!
  },

  async verifyUser(email: string, password: string) {
    const db = await getDB()
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email])

    if (!user) return null

    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) return null

    return {
      id: user.id,
      username: user.username,
      email: user.email
    }
  },

  async createSession(userId: number) {
    const db = await getDB()
    const token = randomBytes(32).toString('hex')

    // Session expires in 7 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await db.run('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)', [
      userId,
      token,
      expiresAt.toISOString()
    ])

    return token
  },

  async verifySession(token: string) {
    const db = await getDB()
    const session = await db.get(
      `SELECT s.*, u.username, u.email 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP`,
      [token]
    )

    if (!session) return null

    return {
      id: session.user_id,
      username: session.username,
      email: session.email
    }
  }
}

export default getDB

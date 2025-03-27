import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'
import 'dotenv/config' // Load .env variables
import createAdminUser from './lib/createAdmin'

// Ensure the data directory exists if DATABASE_PATH includes it
import fs from 'fs'
const dbPath = process.env.DATABASE_PATH || './data/memory-game.db' // Default path
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
  console.log(`Created database directory: ${dbDir}`)
}

let db: Database | null = null

export async function initializeDatabase(): Promise<Database> {
  if (db) {
    return db
  }

  try {
    // Use verbose mode for more detailed logs during development
    const sqlite3Verbose = sqlite3.verbose()

    console.log(`Attempting to open database at: ${path.resolve(dbPath)}`)

    const openedDb = await open({
      filename: dbPath,
      driver: sqlite3Verbose.Database
    })

    console.log('Database connection opened successfully.')

    // Correct way to execute the CREATE TABLE statement
    await openedDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`)

    console.log('Checked/Created "users" table.')

    db = openedDb
    createAdminUser()

    return db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    // Exit the process if the database connection fails on startup
    process.exit(1)
  }
}

// Optional: Function to get the database instance easily
export async function getDb(): Promise<Database> {
  if (!db) {
    return initializeDatabase()
  }
  return db
}

// Optional: Close DB connection gracefully
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close()
    db = null
    console.log('Database connection closed.')
  }
}

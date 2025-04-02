import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'
import 'dotenv/config' // Load .env variables
import createAdminUser from './lib/createAdmin'
import { nanoid } from 'nanoid'


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
    );
    `); // End of CREATE TABLE users

    console.log('Checked/Created "users" table.');

    // Create gameStats table separately
    await openedDb.exec(`
    CREATE TABLE IF NOT EXISTS gameStats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        difficulty TEXT NOT NULL,         -- e.g., '4x4', '6x6'
        moves INTEGER DEFAULT 0,          -- Number of moves made
        elapsedTime INTEGER DEFAULT 0,    -- Time played in seconds
        boardState TEXT NOT NULL,         -- JSON representation of the board
        status TEXT NOT NULL,             -- 'in-progress', 'completed', 'abandoned'
        startTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When the game started
        endTime TIMESTAMP NULL,           -- When the game ended (NULL if not finished)
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last time the record was updated
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- Added ON DELETE CASCADE
    );
    `);

    console.log('Checked/Created "gameStats" table.');

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

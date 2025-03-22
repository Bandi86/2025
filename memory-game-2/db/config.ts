// configuration file for nextjs sqlite 3 database
import sqlite3 from 'sqlite3'

const db = new sqlite3.Database(
  '/db/memory-game.db',
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  err => {
    if (err) {
      console.error('Error connecting to database:', err.message)
    } else {
      console.log('Connected to SQLite database.')
    }
  }
)

// Create the tables if it doesn't exist
db.run(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email)
  )
`,
  err => {
    if (err) {
      console.error('Error creating users table:', err.message)
    } else {
      console.log('Users table created successfully')
    }
  }
)

// create admin user after user table is ready
db.serialize(() => {
  const stmt = db.prepare(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
  )
  stmt.run('admin', 'admin@admin.com', 'admin123')
})

export default db

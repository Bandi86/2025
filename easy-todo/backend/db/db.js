import sqlite3 from 'sqlite3'

// Create a new database connection
const db = new sqlite3.Database('todos.db', err => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('Database connected successfully')
  }
})

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;', err => {
  if (err) {
    console.error('Error enabling foreign keys:', err.message)
  }
})

// Create todos table and initialize database
function initializeDatabase() {
  db.serialize(() => {
    db.run(
      `
            CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                completed BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
       );
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS user_todos (
                user_id INTEGER,
                todo_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, todo_id)
            );

            `,
      err => {
        if (err) {
          console.error('Error creating todos table:', err.message)
        } else {
          console.log('Todos table created or already exists')
          insertSampleData()
        }
      }
    )
  })
}

// Function to insert sample data
function insertSampleData() {
  db.get('SELECT COUNT(*) as count FROM todos', (err, row) => {
    if (err) {
      console.error('Error checking table count:', err.message)
      return
    }

    if (row.count === 0) {
      const sampleTodos = [
        ['Buy groceries', 'Milk, bread, eggs', 0],
        ['Finish project', 'Complete Node.js backend', 0],
      ]

      const stmt = db.prepare(
        'INSERT INTO todos (title, description, completed) VALUES (?, ?, ?)'
      )

      sampleTodos.forEach(todo => {
        stmt.run(todo, err => {
          if (err) {
            console.error('Error inserting sample todo:', err.message)
          }
        })
      })

      stmt.finalize(err => {
        if (err) {
          console.error('Error finalizing statement:', err.message)
        } else {
          console.log('Sample todos inserted successfully')
        }
      })
    }
  })
}

// Function to close the database connection
function closeDb() {
  return new Promise((resolve, reject) => {
    db.close(err => {
      if (err) {
        console.error('Error closing database:', err.message)
        reject(err)
      } else {
        console.log('Database connection closed')
        resolve()
      }
    })
  })
}

// Initialize the database when the module loads
initializeDatabase()

export default db
export { closeDb }

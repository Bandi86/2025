import sqlite3 from 'sqlite3'
import { join } from 'path'
import { Todo } from '../types/todo'


const dbPath = join(process.cwd(), 'todos.db')
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message)
  } else {
    console.log('Connected to SQLite database.')
  }
})

// Create the todos table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0
    )
  `)
})

// Utility functions
export const getTodos = (): Promise<Todo[]> => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM todos", (err, rows: Todo[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const addTodo = (title: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO todos (title) VALUES (?)", [title], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

export const toggleTodo = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE todos SET completed = NOT completed WHERE id = ?",
      [id],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

export const deleteTodo = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM todos WHERE id = ?", [id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export default db

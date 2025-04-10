import sqlite3 from 'sqlite3';
import path from 'path';

// Use verbose mode for more detailed logs during development
const sqlite = sqlite3.verbose();

// Define the path to the database file
const dbPath = path.resolve(process.cwd(), 'bookstore.db');

// Create or connect to the database
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log(`Connected to the SQLite database at ${dbPath}`);
    // Enable foreign key support
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) {
        console.error('Error enabling foreign keys:', pragmaErr.message);
      } else {
        console.log('Foreign key support enabled.');
        createTables();
      }
    });
  }
});

// Function to create tables if they don't exist
const createTables = () => {
  db.serialize(() => {
    // Authors Table
    db.run(`
      CREATE TABLE IF NOT EXISTS authors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        bio TEXT
      )
    `, (err) => {
      if (err) console.error('Error creating authors table:', err.message);
      else console.log('Authors table checked/created.');
    });

    // Books Table
    db.run(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author_id INTEGER,
        isbn TEXT UNIQUE,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        FOREIGN KEY (author_id) REFERENCES authors (id) ON DELETE SET NULL
      )
    `, (err) => {
      if (err) console.error('Error creating books table:', err.message);
      else console.log('Books table checked/created.');
    });

    // Customers Table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        address TEXT
      )
    `, (err) => {
      if (err) console.error('Error creating customers table:', err.message);
      else console.log('Customers table checked/created.');
    });

    // Orders Table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_amount REAL NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating orders table:', err.message);
      else console.log('Orders table checked/created.');
    });

    // Order Items Table (Junction table for Orders and Books)
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL, -- Price at the time of order
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE RESTRICT -- Prevent deleting a book if it's in an order
      )
    `, (err) => {
      if (err) console.error('Error creating order_items table:', err.message);
      else console.log('Order items table checked/created.');
    });
  });
};

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

export default db;

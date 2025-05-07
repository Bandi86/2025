import * as sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import * as path from 'path'
import * as fs from 'fs'

sqlite3.verbose()

const dbPath = path.join(__dirname, '../../data/media.db')

export async function initDatabase() {
  // create db directory if needed
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT UNIQUE NOT NULL,
      extension TEXT,
      size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      modified_at DATETIME,
      type TEXT CHECK(type IN ('film', 'sorozat')),
      cover_image_path TEXT
    );
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS omdb_metadata (
      media_item_id TEXT PRIMARY KEY,
      title TEXT,
      year TEXT,
      genre TEXT,
      director TEXT,
      actors TEXT,
      plot TEXT,
      imdb_rating TEXT,
      poster_url TEXT,
      api_response TEXT,
      FOREIGN KEY (media_item_id) REFERENCES media_items(id) ON DELETE CASCADE
    );
  `)

  console.log('Database initialized')
  return db
}

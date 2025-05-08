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
      cover_image_path TEXT,
      scanned_by_user_id TEXT, -- Új oszlop
      FOREIGN KEY (scanned_by_user_id) REFERENCES users(id) ON DELETE SET NULL -- Opcionális: ha a usert törlik, ez NULL lesz
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

  await db.exec("DROP TABLE IF EXISTS user_seen_media;") // Régi tábla törlése, ha létezik
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_media_status (
      user_id TEXT NOT NULL,
      media_item_id TEXT NOT NULL,
      current_time_seconds INTEGER DEFAULT 0,
      total_duration_seconds INTEGER DEFAULT NULL,
      is_completed BOOLEAN DEFAULT FALSE,
      last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, media_item_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (media_item_id) REFERENCES media_items(id) ON DELETE CASCADE
    );
  `)

  console.log('Database initialized')
  return db
}

export async function closeDatabase(db: sqlite3.Database) {
  db.close()
  console.log('Database closed')
}
export async function getDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })
  return db
}

import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as path from 'path';
import * as fs from 'fs';

sqlite3.verbose();

const dbPath = path.join(__dirname, '../../data/media.db');

export async function initDatabase() {
  // create db
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, '');
  }
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS media_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT UNIQUE NOT NULL,
      extension TEXT,
      size INTEGER,
      modifiedAt TEXT,
      metadata TEXT
    );
  `);
  console.log('Database initialized');
  return db;

}

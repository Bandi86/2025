import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as path from 'path';
import * as fs from 'fs';

sqlite3.verbose();

const dbPath = path.join(__dirname, '../../data/media.db');

export async function initDatabase() {
  // create db directory if needed
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT UNIQUE NOT NULL,
      extension TEXT,
      size INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      modifiedAt DATETIME,
      metadata TEXT,
      type TEXT
    );
  `);

  console.log('Database initialized');
  return db;
}

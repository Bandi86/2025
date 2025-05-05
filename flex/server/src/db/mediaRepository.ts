import { MediaFile } from '../scanner/mediaScanner';
import { open } from 'sqlite';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';


const dbPath = path.join(__dirname, '../../data/media.db');

export async function saveMediaItems(items: MediaFile[]) {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  const insertStmt = await db.prepare(`
    INSERT OR IGNORE INTO media_items (name, path, extension, size, modifiedAt, metadata, type)
    VALUES (?, ?, ?, ?, ?, NULL, ?)
  `);

  for (const item of items) {
    await insertStmt.run(
      item.name,
      item.path,
      item.extension,
      item.size ?? null,
      item.modifiedAt?.toISOString() ?? null,
      item.type
    );
  }

  await insertStmt.finalize();
  await db.close();
}

export async function getAllMediaItems() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  const rows = await db.all(`
      SELECT id, name, path, extension, size, modifiedAt, metadata, type
      FROM media_items
      ORDER BY name ASC
    `);

  await db.close();

  // Csak a létező fájlokat adjuk vissza
  return rows
    .filter((row) => fs.existsSync(row.path))
    .map((row) => ({
      ...row,
      modifiedAt: row.modifiedAt ? new Date(row.modifiedAt) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
}

// Új: OMDb metaadat cache mentése/frissítése
export async function updateMediaMetadata(id: string, metadata: any) {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.run('UPDATE media_items SET metadata = ? WHERE id = ?', JSON.stringify(metadata), id);
  await db.close();
}

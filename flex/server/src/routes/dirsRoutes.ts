import { Router } from 'express';
import { open } from 'sqlite';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();
const dbPath = path.join(__dirname, '../../data/media.db');

router.get('/dirs', async (_req, res) => {
  console.log('GET /api/dirs request received'); // Új log
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const allItems = await db.all('SELECT path FROM media_items');
    console.log(`GET /api/dirs: Found ${allItems.length} items in media_items before filtering.`);

    const existingFilePaths = allItems.filter((item: { path: string }) => {
      const exists = fs.existsSync(item.path);
      return exists;
    });

    const dirs = Array.from(new Set(existingFilePaths.map((row: { path: string }) => path.dirname(row.path))));
    console.log(`GET /api/dirs: Returning ${dirs.length} unique directories:`, dirs);

    await db.close();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ dirs });
  } catch (err) {
    console.error("Hiba a /dirs GET lekérdezésénél:", err);
    res.status(500).json({ error: 'Nem sikerült lekérni a mappákat.' });
  }
});

router.delete('/dirs', async (_req, res) => {
  console.log('DELETE /api/dirs request received'); // Új log
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const result = await db.run('DELETE FROM media_items');
    console.log(`DELETE /api/dirs: Database operation result: changes - ${result.changes}, lastID - ${result.lastID}`);
    await db.close();

    // A result.changes undefined lehet, ha a tábla már üres volt, vagy hiba történt, ami nem dobott kivételt.
    // Az SQLite-ban a DELETE parancs akkor is sikeres, ha nincs mit törölni.
    if (result.changes === undefined) {
        console.warn('DELETE /api/dirs: result.changes is undefined. This might indicate an issue if rows were expected to be deleted, or the table was already empty.');
    }
    res.json({ message: `Adatbázisból törölve: ${result.changes !== undefined ? result.changes : '0 vagy ismeretlen számú'} elem.` });
  } catch (err) {
    console.error("Hiba a /dirs DELETE műveletnél:", err);
    res.status(500).json({ error: 'Nem sikerült törölni a mappákat az adatbázisból.' });
  }
});

export default router;

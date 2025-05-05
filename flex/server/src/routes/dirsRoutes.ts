import { Router } from 'express';
import { open } from 'sqlite';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';

const router = Router();
const dbPath = path.join(__dirname, '../../data/media.db');

router.get('/dirs', async (_req, res) => {
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const rows = await db.all('SELECT path FROM media_items');
    await db.close();
    // Node.js path.dirname-mel szedjük ki az egyedi mappákat
    const dirs = Array.from(new Set(rows.map((row: any) => path.dirname(row.path))));
    res.json({ dirs });
  } catch (err) {
    res.status(500).json({ error: 'Nem sikerült lekérni a mappákat.' });
  }
});

router.delete('/dirs', async (_req, res) => {
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.run('DELETE FROM media_items');
    await db.close();
    res.status(200).json({ message: 'Minden mappa törölve lett.' });
  } catch (err) {
    res.status(500).json({ error: 'Nem sikerült törölni a mappákat.' });
  }
});

export default router;

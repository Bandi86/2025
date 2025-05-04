import { Router, Request, Response, NextFunction } from 'express';
import { scanMediaDirectories } from '../scanner/mediaScanner';
import { getAllMediaItems, saveMediaItems } from '../db/mediaRepository';

const router = Router();

router.post('/scan', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { paths } = req.body;

  console.log(paths, 'utvonal kérés');

  if (!Array.isArray(paths) || paths.length === 0) {
    return res
      .status(400)
      .json({ error: 'Kérlek adj meg legalább egy elérési utat a "paths" mezőben.' });
  }

  try {
    const results = await scanMediaDirectories(paths);
    await saveMediaItems(results);
    return res.json({ files: results });
  } catch (error) {
    console.error('Hiba a szkennelés során:', error);
    return res.status(500).json({ error: 'Nem sikerült a mappák beolvasása.' });
  }
});

router.get('/movies', async (_req, res) => {
  try {
    const items = await getAllMediaItems();
    res.json({ items });
  } catch (err) {
    console.error('Hiba a média lekérdezésénél:', err);
    res.status(500).json({ error: 'Nem sikerült lekérni a médiafájlokat.' });
  }
});

export default router;

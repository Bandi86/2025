import { Request, Response, NextFunction } from 'express';
import { getAllMediaItems } from '../db/mediaRepository';

export async function getMovies(req: Request, res: Response, next: NextFunction) {
  try {
    const movies = (await getAllMediaItems()).filter((item) => item.type === 'film');
    res.json({ movies });
  } catch (err) {
    console.error('Hiba a média lekérdezésénél:', err);
    res.status(500).json({ error: 'Nem sikerült lekérni a médiafájlokat.' });
  }
}

export async function getSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const series = (await getAllMediaItems()).filter((item) => item.type === 'sorozat');
    res.json({ series });
  } catch (err) {
    console.error('Hiba a média lekérdezésénél:', err);
    res.status(500).json({ error: 'Nem sikerült lekérni a médiafájlokat.' });
  }
}

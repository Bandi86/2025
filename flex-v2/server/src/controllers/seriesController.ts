import { Request, Response } from 'express';
import { getSeriesFromDb, getSeriesByIdFromDb } from '../repositories/seriesRepository';

/**
 * Sorozatok lekérdezése szűrési, rendezési és lapozási lehetőségekkel
 */
export const getSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Nincs bejelentkezve' });
      return;
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { q: search, genre, year, sortBy, sortOrder } = req.query;
    const { series, total } = await getSeriesFromDb({
      userId,
      page,
      limit,
      search: search as string,
      genre: genre as string,
      year: year as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string,
    });
    const totalPages = Math.ceil(total / limit);
    res.json({
      series,
      total,
      pages: totalPages,
      page,
      limit,
    });
  } catch (error: unknown) {
    console.error('Error fetching series:', error);
    res.status(500).json({ error: 'Hiba a sorozatok lekérdezésekor' });
  }
};

/**
 * Egy sorozat részletes adatainak lekérdezése ID alapján
 */
export const getSeriesById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Nincs bejelentkezve' });
      return;
    }
    const series = await getSeriesByIdFromDb(id, userId);
    if (!series) {
      res.status(404).json({ error: 'Sorozat nem található' });
      return;
    }
    res.json(series);
  } catch (error: unknown) {
    console.error('Error fetching series by id:', error);
    res.status(500).json({ error: 'Hiba a sorozat lekérdezésekor' });
  }
};

/**
 * Sorozatok keresése (egyszerűsített endpoint, átirányít a getSeries funkcióhoz)
 */
export const searchSeries = (req: Request, res: Response): Promise<void> => {
  return getSeries(req, res);
};

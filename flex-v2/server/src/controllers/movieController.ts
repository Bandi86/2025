import { Request, Response } from 'express';
import { getMoviesFromDb, getMovieByIdFromDb } from '../repositories/movieRepository';

/**
 * Filmek lekérdezése szűrési, rendezési és lapozási lehetőségekkel
 */
export const getMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
    if (!userId) {
      res.status(401).json({ error: 'Nincs bejelentkezve' });
      return;
    }

    // Lapozási paraméterek
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Szűrési és rendezési paraméterek
    const {
      q: search,
      genre,
      year,
      yearFrom,
      yearTo,
      actors,
      director,
      sortBy,
      sortOrder,
    } = req.query;

    const { movies, total } = await getMoviesFromDb({
      userId,
      page,
      limit,
      search: search as string,
      genre: genre as string,
      year: year as string,
      yearFrom: yearFrom as string,
      yearTo: yearTo as string,
      actors: actors as string,
      director: director as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string,
    });

    // Lapozási információk
    const totalPages = Math.ceil(total / limit);

    res.json({
      movies,
      total,
      pages: totalPages,
      page,
      limit,
    });
  } catch (error: unknown) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Hiba a filmek lekérdezésekor' });
  }
};

/**
 * Egy film részletes adatainak lekérdezése ID alapján
 */
export const getMovieById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
    if (!userId) {
      res.status(401).json({ error: 'Nincs bejelentkezve' });
      return;
    }

    const movie = await getMovieByIdFromDb(id, userId);

    if (!movie) {
      res.status(404).json({ error: 'Film nem található' });
      return;
    }

    res.json(movie);
  } catch (error: unknown) {
    console.error('Error fetching movie by id:', error);
    res.status(500).json({ error: 'Hiba a film lekérdezésekor' });
  }
};

/**
 * Filmek keresése (egyszerűsített endpoint, átirányít a getMovies funkcióhoz)
 */
export const searchMovies = (req: Request, res: Response): Promise<void> => {
  // Egyszerűen használjuk a getMovies funkciót, mivel az már támogatja a keresést
  return getMovies(req, res);
};

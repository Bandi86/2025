import { Request, Response, NextFunction } from 'express';
import { getAllMediaItems } from '../db/mediaRepository';
import generateTitleFromPath  from '../helpers/generateTitleFromPath'

// Minden film
export async function getMovies(req: Request, res: Response, next: NextFunction) {
  try {
    const allItems = await getAllMediaItems();
    const movies = allItems.filter((item) => item.type === 'film');

    const moviesWithProcessedOmdb = movies.map((movie) => {
      const displayTitle = movie.omdb?.title || generateTitleFromPath(movie.path);
      return {
        ...movie, // id, name, path, extension, size, modifiedAt, type, coverImagePath
        title: displayTitle,
        omdb: movie.omdb // Az omdb objektum már tartalmazza a szükséges mezőket (year, genre, stb.)
          ? {
              year: movie.omdb.year,
              genre: movie.omdb.genre,
              director: movie.omdb.director,
              actors: movie.omdb.actors,
              plot: movie.omdb.plot,
              imdbRating: movie.omdb.imdbRating,
              poster: movie.omdb.posterUrl, // Itt a posterUrl-t használjuk
            }
          : null,
      };
    });
    res.json({ movies: moviesWithProcessedOmdb });
  } catch (err) {
    console.error('Hiba a filmek lekérdezésénél:', err);
    res.status(500).json({ error: 'Nem sikerült lekérni a filmeket.' });
  }
}

// All Series
export async function getSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const allItems = await getAllMediaItems();
    const series = allItems.filter((item) => item.type === 'sorozat');

    const seriesWithProcessedOmdb = series.map((serie) => {
      const displayTitle = serie.omdb?.title || generateTitleFromPath(serie.path);
      return {
        ...serie,
        title: displayTitle,
        omdb: serie.omdb
        ? {
            year: serie.omdb.year,
            genre: serie.omdb.genre,
            director: serie.omdb.director,
            actors: serie.omdb.actors,
            plot: serie.omdb.plot,
            imdbRating: serie.omdb.imdbRating,
            poster: serie.omdb.posterUrl,
          }
        : null,
      };
    });
    res.json({ series: seriesWithProcessedOmdb });
  } catch (err) {
    console.error('Hiba a sorozatok lekérdezésénél:', err);
    res.status(500).json({ error: 'Nem sikerült lekérni a sorozatokat.' });
  }
}

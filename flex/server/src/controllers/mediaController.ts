import { Request, Response, NextFunction } from 'express'
import { getAllMediaItems } from '../db/mediaRepository'
import generateTitleFromPath from '../helpers/generateTitleFromPath'
import fetch from 'node-fetch'
import * as dotenv from 'dotenv'
dotenv.config()

// ALL MOVIE
export async function getMovies(req: Request, res: Response, next: NextFunction) {
  try {
    const movies = (await getAllMediaItems()).filter((item) => item.type === 'film')
    // Mostantól csak a saját adatbázisban tárolt OMDb metaadatokat adjuk vissza
    const moviesWithOmdb = movies.map((movie) => {
      const omdb = movie.metadata || null
      const title = generateTitleFromPath(movie.path)
      return {
        ...movie,
        title,
        omdb: omdb
          ? {
              year: omdb.Year,
              genre: omdb.Genre,
              director: omdb.Director,
              actors: omdb.Actors,
              plot: omdb.Plot,
              imdbRating: omdb.imdbRating,
              poster: omdb.Poster !== 'N/A' ? omdb.Poster : null
            }
          : null
      }
    })
    res.json({ movies: moviesWithOmdb })
  } catch (err) {
    console.error('Hiba a média lekérdezésénél:', err)
    res.status(500).json({ error: 'Nem sikerült lekérni a médiafájlokat.' })
  }
}

export async function getSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const series = (await getAllMediaItems()).filter((item) => item.type === 'sorozat')
    res.json({ series })
  } catch (err) {
    console.error('Hiba a média lekérdezésénél:', err)
    res.status(500).json({ error: 'Nem sikerült lekérni a médiafájlokat.' })
  }
}

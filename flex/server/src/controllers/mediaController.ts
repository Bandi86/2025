import { Request, Response, NextFunction } from 'express'
import { getAllMediaItems } from '../db/mediaRepository'
import generateTitleFromPath from '../helpers/generateTitleFromPath'

// Minden film
export async function getMovies(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id // Felhasználó ID kinyerése a tokenből
    console.log(`[mediaController.getMovies] Attempting to fetch movies for userId: ${userId}`)

    if (!userId) {
      console.warn(
        '[mediaController.getMovies] No userId found in request. User might not be authenticated.'
      )
      return res.status(401).json({ error: 'Hitelesítés szükséges.' })
    }

    const allItems = await getAllMediaItems()
    console.log(
      `[mediaController.getMovies] Total items fetched by getAllMediaItems: ${allItems.length}`
    )
    if (allItems.length > 0) {
      console.log(
        `[mediaController.getMovies] Sample item from getAllMediaItems (first one if exists): type='${allItems[0].type}', scannedByUserId='${allItems[0].scannedByUserId}'`
      )
    }

    // Szűrés típus és felhasználó által szkennelt elemekre
    const movies = allItems.filter(
      (item) => item.type === 'film' && item.scannedByUserId === userId
    )
    console.log(
      `[mediaController.getMovies] Movies count after filtering for type 'film' and userId \`${userId}\`: ${movies.length}`
    )

    if (movies.length === 0 && allItems.length > 0) {
      console.log('[mediaController.getMovies] Filtering details:')
      const filmItems = allItems.filter((item) => item.type === 'film')
      console.log(`  - Items with type 'film': ${filmItems.length}`)
      const userItems = allItems.filter((item) => item.scannedByUserId === userId)
      console.log(`  - Items with matching userId '${userId}': ${userItems.length}`)
      allItems.slice(0, 5).forEach((item, index) => {
        console.log(
          `  - Sample allItem ${index}: type=${item.type}, scannedByUserId=${item.scannedByUserId}, path=${item.path}`
        )
      })
    }

    const moviesWithProcessedOmdb = movies.map((movie) => {
      const displayTitle = movie.omdb?.title || generateTitleFromPath(movie.path)
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
              poster: movie.omdb.posterUrl // Itt a posterUrl-t használjuk
            }
          : null
      }
    })
    res.json({ movies: moviesWithProcessedOmdb })
    
  } catch (err) {
    console.error('Hiba a filmek lekérdezésénél:', err)
    res.status(500).json({ error: 'Nem sikerült lekérni a filmeket.' })
  }
}

// All Series
export async function getSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id // Felhasználó ID kinyerése a tokenből
    if (!userId) {
      // Ennek nem szabadna megtörténnie, ha az útvonal védett
      return res.status(401).json({ error: 'Hitelesítés szükséges.' })
    }

    const allItems = await getAllMediaItems()
    // Szűrés típus és felhasználó által szkennelt elemekre
    const series = allItems.filter(
      (item) => item.type === 'sorozat' && item.scannedByUserId === userId
    )

    const seriesWithProcessedOmdb = series.map((serie) => {
      const displayTitle = serie.omdb?.title || generateTitleFromPath(serie.path)
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
              poster: serie.omdb.posterUrl
            }
          : null
      }
    })
    res.json({ series: seriesWithProcessedOmdb })
  } catch (err) {
    console.error('Hiba a sorozatok lekérdezésénél:', err)
    res.status(500).json({ error: 'Nem sikerült lekérni a sorozatokat.' })
  }
}

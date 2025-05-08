import { MediaFile } from '../scanner/mediaScanner'
import { open } from 'sqlite'
import * as sqlite3 from 'sqlite3'
import * as path from 'path'
import * as fs from 'fs'
import { initDatabase } from './database' // Importáljuk az initDatabase-t

const dbPath = path.join(__dirname, '../../data/media.db')

// Helper function to ensure database is initialized
export async function getDb() {
  // Check if db file exists, if not, initDatabase will create it.
  if (!fs.existsSync(dbPath)) {
    console.log('Database file not found, initializing...')
    await initDatabase() // Ensure the database and tables are created
  }
  return open({ filename: dbPath, driver: sqlite3.Database })
}

export async function saveMediaItems(items: MediaFile[], userId?: string) {
  // userId is now optional
  const db = await getDb()

  // Az id mező most már a MediaFile része, és a randomUUID() generálja
  // A cover_image_path alapértelmezett értéke null vagy üres string lehet
  const insertStmt = await db.prepare(`
    INSERT OR IGNORE INTO media_items (id, name, path, extension, size, modified_at, type, cover_image_path, scanned_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const item of items) {
    await insertStmt.run(
      item.id, // Most már az item objektumból jön
      item.name,
      item.path,
      item.extension,
      item.size ?? null,
      item.modifiedAt?.toISOString() ?? null,
      item.type,
      item.cover_image_path ?? null, // Új mező
      userId ?? null // scanned_by_user_id
    )
  }

  await insertStmt.finalize()
  await db.close()
}

export async function getAllMediaItems() {
  const db = await getDb()

  // LEFT JOIN-t használunk, hogy minden media_item-et visszakapjunk, akkor is, ha nincs hozzájuk OMDb adat
  const rows = await db.all(`
    SELECT
      mi.id,
      mi.name,
      mi.path,
      mi.extension,
      mi.size,
      mi.modified_at AS modifiedAt,
      mi.type,
      mi.cover_image_path AS coverImagePath,
      mi.scanned_by_user_id AS scannedByUserId, -- Ensure this is selected
      om.title AS omdbTitle,
      om.year AS omdbYear,
      om.genre AS omdbGenre,
      om.director AS omdbDirector,
      om.actors AS omdbActors,
      om.plot AS omdbPlot,
      om.imdb_rating AS omdbImdbRating,
      om.poster_url AS omdbPosterUrl,
      om.api_response AS omdbApiResponse
    FROM media_items mi
    LEFT JOIN omdb_metadata om ON mi.id = om.media_item_id
    ORDER BY mi.name ASC
  `)

  await db.close()

  return rows
    .filter((row) => fs.existsSync(row.path)) // Csak a létező fájlokat adjuk vissza
    .map((row) => ({
      id: row.id,
      name: row.name,
      path: row.path,
      extension: row.extension,
      size: row.size,
      modifiedAt: row.modifiedAt ? new Date(row.modifiedAt) : null,
      type: row.type,
      coverImagePath: row.coverImagePath,
      scannedByUserId: row.scannedByUserId, // Add scannedByUserId to the mapped object
      // Az OMDb adatok beágyazása, ha léteznek
      omdb: row.omdbTitle // Ha van omdbTitle, akkor feltételezzük, hogy vannak OMDb adatok
        ? {
            title: row.omdbTitle,
            year: row.omdbYear,
            genre: row.omdbGenre,
            director: row.omdbDirector,
            actors: row.omdbActors,
            plot: row.omdbPlot,
            imdbRating: row.omdbImdbRating,
            posterUrl: row.omdbPosterUrl,
            apiResponse: row.omdbApiResponse ? JSON.parse(row.omdbApiResponse) : null
          }
        : null
    }))
}

// Régi updateMediaMetadata helyett új függvény az omdb_metadata táblához
export async function saveOrUpdateOmdbMetadata(mediaItemId: string, metadata: any) {
  const db = await getDb()
  // Az "metadata" objektumot feltételezzük, hogy az OMDb API válaszának struktúráját követi
  // (pl. metadata.Title, metadata.Year, stb.)
  // Az api_response mezőben a teljes, nyers JSON választ tároljuk stringként.

  const {
    Title,
    Year,
    Genre,
    Director,
    Actors,
    Plot,
    imdbRating,
    Poster // Az OMDb API "Poster" mezőjét használjuk
  } = metadata

  await db.run(
    `
    INSERT INTO omdb_metadata (media_item_id, title, year, genre, director, actors, plot, imdb_rating, poster_url, api_response)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(media_item_id) DO UPDATE SET
      title = excluded.title,
      year = excluded.year,
      genre = excluded.genre,
      director = excluded.director,
      actors = excluded.actors,
      plot = excluded.plot,
      imdb_rating = excluded.imdb_rating,
      poster_url = excluded.poster_url,
      api_response = excluded.api_response;
  `,
    mediaItemId,
    Title ?? null,
    Year ?? null,
    Genre ?? null,
    Director ?? null,
    Actors ?? null,
    Plot ?? null,
    imdbRating ?? null,
    Poster && Poster !== 'N/A' ? Poster : null, // A poster_url-t itt kezeljük
    JSON.stringify(metadata) // A teljes API választ stringként tároljuk
  )

  await db.close()
}

// Az egyedi azonosító alapján lekérdezi a médiaelemet
// és visszaadja a részletes információkat, beleértve az OMDb adatokat is.
export async function getMediaItemById(id: string) {
  const db = await getDb()
  const row = await db.get(
    `
    SELECT
      mi.id,
      mi.name,
      mi.path,
      mi.extension,
      mi.size,
      mi.modified_at AS modifiedAt,
      mi.type,
      mi.cover_image_path AS coverImagePath,
      mi.scanned_by_user_id AS scannedByUserId, -- Added scanned_by_user_id
      om.title AS omdbTitle,
      om.year AS omdbYear,
      om.genre AS omdbGenre,
      om.director AS omdbDirector,
      om.actors AS omdbActors,
      om.plot AS omdbPlot,
      om.imdb_rating AS omdbImdbRating,
      om.poster_url AS omdbPosterUrl,
      om.api_response AS omdbApiResponse
    FROM media_items mi
    LEFT JOIN omdb_metadata om ON mi.id = om.media_item_id
    WHERE mi.id = ?
  `,
    id
  )
  await db.close()

  if (!row || !fs.existsSync(row.path)) {
    return null
  }

  return {
    id: row.id,
    name: row.name,
    path: row.path,
    extension: row.extension,
    size: row.size,
    modifiedAt: row.modifiedAt ? new Date(row.modifiedAt) : null,
    type: row.type,
    coverImagePath: row.coverImagePath,
    scannedByUserId: row.scannedByUserId, // Added scannedByUserId
    omdb: row.omdbTitle
      ? {
          title: row.omdbTitle,
          year: row.omdbYear,
          genre: row.omdbGenre,
          director: row.omdbDirector,
          actors: row.omdbActors,
          plot: row.omdbPlot,
          imdbRating: row.omdbImdbRating,
          posterUrl: row.omdbPosterUrl,
          apiResponse: row.omdbApiResponse ? JSON.parse(row.omdbApiResponse) : null
        }
      : null
  }
}

// Functions for user_media_status table

export async function upsertUserMediaStatus(
  userId: string,
  mediaItemId: string,
  currentTimeSeconds: number,
  totalDurationSeconds: number | null,
  isCompleted: boolean
) {
  const db = await getDb()
  await db.run(
    `
    INSERT INTO user_media_status (user_id, media_item_id, current_time_seconds, total_duration_seconds, is_completed, last_updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, media_item_id) DO UPDATE SET
      current_time_seconds = excluded.current_time_seconds,
      total_duration_seconds = excluded.total_duration_seconds,
      is_completed = excluded.is_completed,
      last_updated_at = CURRENT_TIMESTAMP;
  `,
    userId,
    mediaItemId,
    currentTimeSeconds,
    totalDurationSeconds,
    isCompleted
  )
  await db.close()
}

export async function getUserMediaStatus(userId: string, mediaItemId: string) {
  const db = await getDb()
  const row = await db.get(
    `
    SELECT
      user_id AS userId,
      media_item_id AS mediaItemId,
      current_time_seconds AS currentTimeSeconds,
      total_duration_seconds AS totalDurationSeconds,
      is_completed AS isCompleted,
      last_updated_at AS lastUpdatedAt
    FROM user_media_status
    WHERE user_id = ? AND media_item_id = ?
  `,
    userId,
    mediaItemId
  )
  await db.close()
  return row
}

export async function getAllUserMediaStatusesWithDetails(userId: string) {
  const db = await getDb()
  // Join media_items with user_media_status and then with omdb_metadata
  const rows = await db.all(
    `
    SELECT
      mi.id,
      mi.name,
      mi.path,
      mi.extension,
      mi.size,
      mi.modified_at AS modifiedAt,
      mi.type,
      mi.cover_image_path AS coverImagePath,
      mi.scanned_by_user_id AS scannedByUserId,
      ums.current_time_seconds AS currentTimeSeconds,
      ums.total_duration_seconds AS totalDurationSeconds,
      ums.is_completed AS isCompleted,
      ums.last_updated_at AS lastUpdatedAt,
      om.title AS omdbTitle,
      om.year AS omdbYear,
      om.genre AS omdbGenre,
      om.director AS omdbDirector,
      om.actors AS omdbActors,
      om.plot AS omdbPlot,
      om.imdb_rating AS omdbImdbRating,
      om.poster_url AS omdbPosterUrl,
      om.api_response AS omdbApiResponse
    FROM media_items mi
    JOIN user_media_status ums ON mi.id = ums.media_item_id
    LEFT JOIN omdb_metadata om ON mi.id = om.media_item_id
    WHERE ums.user_id = ? AND EXISTS (SELECT 1 FROM users WHERE id = ums.user_id) -- Ensure user exists
    ORDER BY ums.last_updated_at DESC
  `,
    userId
  )
  await db.close()

  return rows
    .filter((row) => fs.existsSync(row.path)) // Filter out non-existent files
    .map((row) => ({
      // Media item details
      id: row.id,
      name: row.name,
      path: row.path,
      extension: row.extension,
      size: row.size,
      modifiedAt: row.modifiedAt ? new Date(row.modifiedAt) : null,
      type: row.type,
      coverImagePath: row.coverImagePath,
      scannedByUserId: row.scannedByUserId,
      // User media status
      userMediaStatus: {
        currentTimeSeconds: row.currentTimeSeconds,
        totalDurationSeconds: row.totalDurationSeconds,
        isCompleted: !!row.isCompleted, // Ensure boolean
        lastUpdatedAt: row.lastUpdatedAt ? new Date(row.lastUpdatedAt) : null
      },
      // OMDb details
      omdb: row.omdbTitle
        ? {
            title: row.omdbTitle,
            year: row.omdbYear,
            genre: row.omdbGenre,
            director: row.omdbDirector,
            actors: row.omdbActors,
            plot: row.omdbPlot,
            imdbRating: row.omdbImdbRating,
            posterUrl: row.omdbPosterUrl,
            apiResponse: row.omdbApiResponse ? JSON.parse(row.omdbApiResponse) : null
          }
        : null
    }))
}

// filepath: c:\Users\bandi\Documents\code\2025\flex-v2\server\src\repositories\mediaRepository.ts
import { Database } from 'sqlite'
import { MediaItem, OmdbMetadata } from '../types/MediaItem' // Corrected path
import { getDatabase } from '../db/database'
import { v4 as uuidv4 } from 'uuid' // For generating IDs

// Helper function to get a database instance
async function db(): Promise<Database> {
  return getDatabase()
}

export async function upsertMediaItem(
  mediaItemData: Partial<Omit<MediaItem, 'id' | 'created_at' | 'modified_at'>> & {
    path: string
    scanned_by_user_id: string
  }
): Promise<string> {
  const dbInstance = await db()
  const now = new Date().toISOString()

  const existing = await dbInstance.get(
    'SELECT id FROM media_items WHERE path = ?',
    mediaItemData.path
  )

  if (existing) {
    // Update existing media item
    const { name, extension, size, type, cover_image_path, scanned_by_user_id } = mediaItemData
    await dbInstance.run(
      `UPDATE media_items
       SET name = ?, extension = ?, size = ?, type = ?, cover_image_path = ?, scanned_by_user_id = ?, modified_at = ?
       WHERE id = ?`,
      name,
      extension,
      size,
      type,
      cover_image_path,
      scanned_by_user_id,
      now,
      existing.id
    )
    return existing.id
  } else {
    // Insert new media item
    const newId = uuidv4()
    const { name, path, extension, size, type, cover_image_path, scanned_by_user_id } =
      mediaItemData
    await dbInstance.run(
      `INSERT INTO media_items (id, name, path, extension, size, type, cover_image_path, scanned_by_user_id, created_at, modified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId,
      name,
      path,
      extension,
      size,
      type,
      cover_image_path,
      scanned_by_user_id,
      now,
      now
    )
    return newId
  }
}

export async function upsertOmdbMetadata(
  mediaItemId: string,
  omdbData: Partial<OmdbMetadata>
): Promise<void> {
  const dbInstance = await db()
  // Ensure all fields are present, defaulting to null if not provided in omdbData
  const {
    title = null,
    year = null,
    genre = null,
    director = null,
    actors = null,
    plot = null,
    imdb_rating = null,
    poster_url = null,
    api_response = null // api_response should be the full JSON string if available
  } = omdbData

  await dbInstance.run(
    `INSERT INTO omdb_metadata (media_item_id, title, year, genre, director, actors, plot, imdb_rating, poster_url, api_response)
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
       api_response = excluded.api_response;`,
    mediaItemId,
    title,
    year,
    genre,
    director,
    actors,
    plot,
    imdb_rating,
    poster_url,
    api_response
      ? typeof api_response === 'string'
        ? api_response
        : JSON.stringify(api_response)
      : null
  )
}

export async function getMediaItemByPath(path: string): Promise<MediaItem | null> {
  const dbInstance = await db()
  // Ensure you select all fields defined in the MediaItem type
  const row = await dbInstance.get<MediaItem>(
    `SELECT id, name, path, extension, size, created_at, modified_at, type, cover_image_path, scanned_by_user_id
     FROM media_items WHERE path = ?`,
    path
  )
  return row || null
}

export async function getOmdbMetadataByMediaItemId(
  mediaItemId: string
): Promise<OmdbMetadata | null> {
  const dbInstance = await db()
  const row = await dbInstance.get<OmdbMetadata>(
    `SELECT media_item_id, title, year, genre, director, actors, plot, imdb_rating, poster_url, api_response
     FROM omdb_metadata WHERE media_item_id = ?`,
    mediaItemId
  )

  if (row && row.api_response && typeof row.api_response === 'string') {
    try {
      // Assuming api_response stores the full JSON and needs to be parsed
      // If other fields are directly mapped, this parsing might be for a specific use case
      // or if the api_response field itself is what you want to return as an object.
      // For now, let's assume the individual fields are already correct from the DB.
      // If api_response is meant to be the structured object:
      // return { ...row, api_response: JSON.parse(row.api_response) };
    } catch (e) {
      console.error('Failed to parse api_response from omdb_metadata', e)
      // Return row as is, or handle error appropriately
    }
  }
  return row || null
}

export async function getFullMediaItemDetails(
  mediaPath: string
): Promise<(MediaItem & { omdb?: OmdbMetadata }) | null> {
  const mediaItem = await getMediaItemByPath(mediaPath)
  if (!mediaItem) {
    return null
  }
  const omdbMetadata = await getOmdbMetadataByMediaItemId(mediaItem.id)
  return {
    ...mediaItem,
    ...(omdbMetadata && { omdb: omdbMetadata })
  }
}

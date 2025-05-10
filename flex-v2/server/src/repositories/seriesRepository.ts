import { getDatabase } from '../db/database';

export interface SeriesQueryOptions {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  year?: string;
  sortBy?: string;
  sortOrder?: string;
}

export async function getSeriesFromDb(options: SeriesQueryOptions) {
  const db = await getDatabase();
  const {
    userId,
    page = 1,
    limit = 20,
    search,
    genre,
    year,
    sortBy = 'title',
    sortOrder = 'asc',
  } = options;
  const offset = (page - 1) * limit;

  let baseQuery = `SELECT m.*, o.title, o.year, o.genre, o.plot, o.imdb_rating, o.poster_url
    FROM media_items m
    LEFT JOIN omdb_metadata o ON m.id = o.media_item_id
    WHERE m.type = 'sorozat' AND m.scanned_by_user_id = ?`;
  const params: any[] = [userId];

  if (search) {
    baseQuery += ` AND (m.name LIKE ? OR o.title LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (genre) {
    const genres = genre.split(',');
    baseQuery += ' AND (' + genres.map(() => 'o.genre LIKE ?').join(' OR ') + ')';
    genres.forEach((g) => params.push(`%${g.trim()}%`));
  }
  if (year) {
    baseQuery += ' AND o.year = ?';
    params.push(year);
  }

  // Count query
  const countQuery = `SELECT COUNT(*) as count FROM (${baseQuery})`;
  const countResult = await db.all(countQuery, params);
  const total = countResult[0]?.count || 0;

  // Order by
  let orderColumn = 'o.title';
  if (sortBy === 'year') orderColumn = 'o.year';
  else if (sortBy === 'rating') orderColumn = 'o.imdb_rating';
  else if (sortBy === 'added') orderColumn = 'm.created_at';
  baseQuery += ` ORDER BY ${orderColumn} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
  baseQuery += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const series = await db.all(baseQuery, params);
  return { series, total };
}

export async function getSeriesByIdFromDb(id: string, userId: string) {
  const db = await getDatabase();
  const query = `SELECT m.*, o.title, o.year, o.genre, o.plot, o.imdb_rating, o.poster_url
    FROM media_items m
    LEFT JOIN omdb_metadata o ON m.id = o.media_item_id
    WHERE m.id = ? AND m.type = 'sorozat' AND m.scanned_by_user_id = ? LIMIT 1`;
  const params = [id, userId];
  const result = await db.all(query, params);
  if (!result[0]) return null;

  // Epizódok lekérdezése
  const episodesQuery = "SELECT * FROM media_items WHERE parent_id = ? ORDER BY name ASC";
  const episodes = await db.all(episodesQuery, [id]);
  return { ...result[0], episodes };
}

import { getDatabase } from '../db/database';

export interface MovieQueryOptions {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  year?: string;
  yearFrom?: string;
  yearTo?: string;
  actors?: string;
  director?: string;
  sortBy?: string;
  sortOrder?: string;
}

export async function getMoviesFromDb(options: MovieQueryOptions) {
  const db = await getDatabase();
  const {
    userId,
    page = 1,
    limit = 20,
    search,
    genre,
    year,
    yearFrom,
    yearTo,
    actors,
    director,
    sortBy = 'title',
    sortOrder = 'asc',
  } = options;
  const offset = (page - 1) * limit;

  let baseQuery = `SELECT m.*, o.title, o.year, o.genre, o.director, o.actors, o.plot, o.imdb_rating, o.poster_url
    FROM media_items m
    LEFT JOIN omdb_metadata o ON m.id = o.media_item_id
    WHERE m.type = 'film' AND m.scanned_by_user_id = ?`;
  const params: any[] = [userId];

  if (search) {
    baseQuery += ` AND (m.name LIKE ? OR o.title LIKE ? OR o.actors LIKE ? OR o.director LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (genre) {
    const genres = genre.split(',');
    baseQuery += ' AND (' + genres.map(() => 'o.genre LIKE ?').join(' OR ') + ')';
    genres.forEach((g) => params.push(`%${g.trim()}%`));
  }
  if (year) {
    baseQuery += ' AND o.year = ?';
    params.push(year);
  } else if (yearFrom && yearTo) {
    baseQuery += ' AND o.year BETWEEN ? AND ?';
    params.push(yearFrom, yearTo);
  }
  if (actors) {
    const actorList = actors.split(',');
    baseQuery += ' AND (' + actorList.map(() => 'o.actors LIKE ?').join(' OR ') + ')';
    actorList.forEach((a) => params.push(`%${a.trim()}%`));
  }
  if (director) {
    baseQuery += ' AND o.director LIKE ?';
    params.push(`%${director}%`);
  }

  // Count query
  const countQuery = `SELECT COUNT(*) as count FROM (${baseQuery})`;
  const countResult = await db.get<{ count: number }>(countQuery, ...params);
  const total = countResult?.[0]?.count || 0;

  // Order by
  let orderColumn = 'o.title';
  if (sortBy === 'year') orderColumn = 'o.year';
  else if (sortBy === 'rating') orderColumn = 'o.imdb_rating';
  else if (sortBy === 'added') orderColumn = 'm.created_at';
  baseQuery += ` ORDER BY ${orderColumn} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
  baseQuery += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const movies = await db.all(baseQuery, ...params);
  return { movies, total };
}

export async function getMovieByIdFromDb(id: string, userId: string) {
  const db = await getDatabase();
  const query = `SELECT m.*, o.title, o.year, o.genre, o.director, o.actors, o.plot, o.imdb_rating, o.poster_url
    FROM media_items m
    LEFT JOIN omdb_metadata o ON m.id = o.media_item_id
    WHERE m.id = ? AND m.type = 'film' AND m.scanned_by_user_id = ? LIMIT 1`;
  const params = [id, userId];
  const result = await db.get(query, ...params);
  return result[0] || null;
}

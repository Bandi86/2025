/**
 * API kérések egységes kezelésére szolgáló modul
 * Mind kliens, mind szerver oldali környezetben használható
 */

import { API_ROUTES } from './apiRoutes';

// Alapértelmezett API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Típusdefiníciók
type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  token?: string;
  cache?: RequestCache;
};

/**
 * Egységes API lekérdező függvény
 * Mind kliens oldali, mind SSR környezetben használható
 */
export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  // Teljes URL összeállítása
  const url = `${API_BASE_URL}${endpoint}`;

  // Alapértelmezett és egyedi headerek összefűzése
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Token beállítása, ha van
  if (options.token) {
    headers.Cookie = `token=${options.token}`;
  }

  // Fetch opciók összeállítása
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
    credentials: 'include',
    cache: options.cache || 'no-store',
  };

  // Body hozzáadása nem-GET kérésekhez
  if (options.body && options.method !== 'GET') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // HTTP hibák kezelése
    if (!response.ok) {
      // 404-es hiba speciális kezelése
      if (response.status === 404) {
        return { notFound: true } as unknown as T;
      }

      // Egyéb hibák
      const errorData = await response.json().catch(() => ({ message: 'Ismeretlen hiba történt' }));
      throw new Error(errorData.message || `HTTP hiba: ${response.status}`);
    }

    // Sikeres válasz feldolgozása
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API kérés hiba: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Szerver oldali API lekérdező függvény
 * Csak Next.js szerver komponensekben használható
 */
export async function serverApiFetch<T = any>(
  endpoint: string,
  token: string | undefined,
  options: Omit<FetchOptions, 'token'> = {}
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    token,
    cache: 'no-store', // Szerver oldali kéréseknél mindig friss adatokat kérünk
  });
}

/**
 * Konkrét API művelet függvények, amelyek az API_ROUTES konstansokat használják
 */

// Felhasználó lekérdezése
export async function fetchCurrentUser(token?: string) {
  return apiFetch(API_ROUTES.USER.ME, { token });
}

// Bejelentkezés
export async function loginUser(credentials: { username: string; password: string }) {
  return apiFetch(API_ROUTES.USER.LOGIN, {
    method: 'POST',
    body: credentials,
  });
}

// Kijelentkezés
export async function logoutUser() {
  return apiFetch(API_ROUTES.USER.LOGOUT, { method: 'POST' });
}

// Szkennelt könyvtárak lekérdezése
export async function fetchScannedDirectories(token?: string) {
  return apiFetch(API_ROUTES.MEDIA.DIRS, { token });
}

// Filmek lekérdezése összes, vagy id-ra szűrve ha összes filmet kérünk akkorr pagination szerüen
// quarry kéréssel ha ha van

export async function fetchMovies(token?: string, id?: string, quarry?: string) {
  let endpoint = API_ROUTES.MEDIA.MOVIES;
  if (id) {
    endpoint = `${API_ROUTES.MEDIA.MOVIES}/${id}`;
  }
  if (quarry) {
    endpoint = `${API_ROUTES.MEDIA.MOVIES}?q=${quarry}`;
  }
  return apiFetch(endpoint, { token });
}

// Film lekérdezés kibővített paraméterekkel
export type MovieFilterOptions = {
  page?: number; // Lapozás: hanyadik oldal
  limit?: number; // Lapozás: oldalankénti elemszám
  search?: string; // Szabad szöveges keresés
  genre?: string | string[]; // Műfaj szerinti szűrés
  year?: number | [number, number]; // Év vagy évek intervalluma
  sortBy?: 'title' | 'year' | 'rating' | 'added'; // Rendezés mező
  sortOrder?: 'asc' | 'desc'; // Rendezés iránya
  actors?: string[]; // Színészek szerinti szűrés
  director?: string; // Rendező szerinti szűrés
  rating?: number; // Értékelés szerinti szűrés
  watched?: boolean; // Megnézett filmek szűrése
  unwatched?: boolean; // Meg nem nézett filmek szűrése
  favorite?: boolean; // Kedvenc filmek szűrése
  watchedDate?: string; // Megnézés dátuma szerinti szűrés
  unwatchedDate?: string; // Meg nem nézett filmek dátuma szerinti szűrés
  favoriteDate?: string; // Kedvenc filmek dátuma szerinti szűrés
  addedDate?: string; // Hozzáadás dátuma szerinti szűrés
  updatedDate?: string; // Frissítés dátuma szerinti szűrés
  deletedDate?: string; // Törlés dátuma szerinti szűrés
  deleted?: boolean; // Törölt filmek szűrése
  notDeleted?: boolean; // Nem törölt filmek szűrése
};

/**
 * Kibővített film lekérdező függvény, ami támogatja a szűrést, rendezést és lapozást
 *
 * @param options - Szűrési, rendezési és lapozási beállítások
 * @param token - Opcionális authentikációs token
 * @returns Promise a lekérdezés eredményével (filmek + metaadatok)
 */
export async function fetchMoviesAdvanced(options: MovieFilterOptions = {}, token?: string) {
  // Alap query paraméterek összeállítása
  const queryParams: Record<string, string> = {};

  // Lapozás
  if (options.page !== undefined) queryParams.page = options.page.toString();
  if (options.limit !== undefined) queryParams.limit = options.limit.toString();

  // Keresés
  if (options.search) queryParams.q = options.search;

  // Műfaj szűrés
  if (options.genre) {
    if (Array.isArray(options.genre)) {
      queryParams.genre = options.genre.join(',');
    } else {
      queryParams.genre = options.genre;
    }
  }

  // Év szűrés
  if (options.year !== undefined) {
    if (Array.isArray(options.year)) {
      queryParams.yearFrom = options.year[0].toString();
      queryParams.yearTo = options.year[1].toString();
    } else {
      queryParams.year = options.year.toString();
    }
  }

  // Színészek szűrés
  if (options.actors && options.actors.length > 0) {
    queryParams.actors = options.actors.join(',');
  }

  // Rendező szűrés
  if (options.director) {
    queryParams.director = options.director;
  }

  // Rendezés
  if (options.sortBy) {
    queryParams.sortBy = options.sortBy;
    if (options.sortOrder) {
      queryParams.sortOrder = options.sortOrder;
    }
  }

  // Query string összeállítása
  const queryString = Object.keys(queryParams)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join('&');

  // Végpont összeállítása
  const endpoint = `${API_ROUTES.MEDIA.MOVIES}${queryString ? `?${queryString}` : ''}`;

  // API hívás végrehajtása
  return apiFetch(endpoint, { token });
}

/**
 * Film részletes adatainak lekérdezése ID alapján
 *
 * @param id - A film egyedi azonosítója
 * @param token - Opcionális authentikációs token
 * @returns Promise a film részletes adataival
 */
export async function fetchMovieDetails(id: string, token?: string) {
  const endpoint = `${API_ROUTES.MEDIA.MOVIES}/${id}`;
  return apiFetch(endpoint, { token });
}

// Egyszerű HTTP wrapper függvények
export function get<T = any>(endpoint: string, options: Omit<FetchOptions, 'method'> = {}) {
  return apiFetch<T>(endpoint, { ...options, method: 'GET' });
}

export function post<T = any>(
  endpoint: string,
  body?: any,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
) {
  return apiFetch<T>(endpoint, { ...options, method: 'POST', body });
}

export function put<T = any>(
  endpoint: string,
  body?: any,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
) {
  return apiFetch<T>(endpoint, { ...options, method: 'PUT', body });
}

export function deleteRequest<T = any>(
  endpoint: string,
  options: Omit<FetchOptions, 'method'> = {}
) {
  return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
}

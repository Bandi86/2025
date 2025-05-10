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

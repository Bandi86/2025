import { cookies } from 'next/headers';
import { User } from '@/app/UserContext';
import { API_ROUTES } from './apiRoutes';
import { serverApiFetch } from './apiFetcher';

/**
 * Szerveroldalon ellenőrzi a felhasználói bejelentkezést a süti alapján
 * Server Component-ekben használható
 */
export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get('token')?.value;

    if (!token) {
      return null;
    }

    const data = await serverApiFetch<{ user: User | null }>(API_ROUTES.USER.ME, token);

    return data.user;
  } catch (error) {
    console.error('Hiba a szerveroldali felhasználó lekérése során:', error);
    return null;
  }
}

/**
 * Szerver oldalon lekéri a szkennelt könyvtárak számát
 * Server Component-ekben használható
 */
export async function getScannedDirsCount(): Promise<number> {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get('token')?.value;

    if (!token) {
      return 0;
    }

    const data = await serverApiFetch<{ dirs?: any[] }>(API_ROUTES.MEDIA.DIRS, token);

    // Ha 404-es hiba van (nincs még könyvtár), az apiFetch { notFound: true } objektumot ad vissza
    if ('notFound' in data) {
      return 0;
    }

    return data.dirs?.length || 0;
  } catch (error) {
    console.error('Hiba a szerveroldali szkennelt könyvtárak lekérése során:', error);
    return 0;
  }
}

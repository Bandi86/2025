/**
 * API kérések a szkennelt könyvtárak kezeléséhez
 */
import { get, post, deleteRequest } from './apiFetcher';
import { ScanStatus } from '@/types/ScanStatus';

// Szkennelt könyvtárak típusa
export interface Directory {
  id: string;
  path: string;
  name: string;
  created_at: string;
  files_count?: number;
  last_scan_date?: string;
  scanStatus?: ScanStatus;
}

/**
 * Fájlrendszer böngészése
 */
export async function fetchFilesystem(path?: string) {
  try {
    const queryParams = path ? `?path=${encodeURIComponent(path)}` : '';
    const response = await get(`/dirs/browse${queryParams}`);
    return response;
  } catch (error) {
    console.error('Hiba a fájlrendszer lekérdezésekor:', error);
    throw error;
  }
}

/**
 * Könyvtár hozzáadása
 */
export async function addDirectory(path: string) {
  try {
    const response = await post('/dirs', { path });
    return response.dir;
  } catch (error) {
    console.error('Hiba a könyvtár hozzáadásakor:', error);
    throw error;
  }
}

/**
 * Könyvtárak listázása
 */
export async function listDirectories() {
  try {
    const response = await get('/dirs');
    return response.dirs || [];
  } catch (error) {
    console.error('Hiba a könyvtárak listázásakor:', error);
    throw error;
  }
}

/**
 * Könyvtár törlése
 */
export async function removeDirectory(id: string) {
  try {
    const response = await deleteRequest(`/dirs/${id}`);
    return response;
  } catch (error) {
    console.error('Hiba a könyvtár törlésekor:', error);
    throw error;
  }
}

/**
 * Szkennelés indítása
 */
export async function startScan(paths: string[]) {
  try {
    // Javított API útvonal: /scans
    const response = await post('/scans', { paths });
    return response;
  } catch (error) {
    console.error('Hiba a szkennelés indításakor:', error);
    throw error;
  }
}

/**
 * Szkennelési státusz lekérdezése
 */
export async function getScanStatus() {
  try {
    // Javított API útvonal: /scans/status
    const response = await get('/scans/status');
    return response; // Közvetlenül a backend válaszát adjuk vissza
  } catch (error) {
    console.error('Hiba a szkennelési státusz lekérdezésekor:', error);
    throw error;
  }
}

/**
 * Szkennelés megszakítása
 */
export async function cancelScan() {
  try {
    const response = await post('/scans/cancel', {});
    return response;
  } catch (error) {
    console.error('Hiba a szkennelés megszakításakor:', error);
    throw error;
  }
}

import * as fs from 'fs/promises';
import * as path from 'path';
import { extractImdbIdFromNfo } from './imdbidFromNfo';
import { getOmdbData } from './getOmdbData';
import {
  upsertMediaItem,
  upsertOmdbMetadata,
  getMediaItemByPath,
} from '../../repositories/mediaRepository';

import { MediaItem, OmdbMetadata } from '../../types/MediaItem';

const SUPPORTED_VIDEO_EXTENSIONS = ['.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv'];
const NFO_EXTENSION = '.nfo';

// Szkennelés státusz type
export interface ScanStatus {
  isScanning: boolean;
  progress: number;
  scannedFiles: number;
  totalFiles: number;
  currentDirectory?: string;
  currentFile?: string;
  startTime?: string;
  estimatedEndTime?: string;
  cancelRequested?: boolean;
  error?: string;
}

// Szkennelési állapotok felhasználónként tárolása
export const scanStatuses = new Map<string, ScanStatus>();

export interface ScanResult {
  filePath: string;
  status:
    | 'added'
    | 'updated'
    | 'exists'
    | 'error'
    | 'nfo_missing'
    | 'omdb_not_found'
    | 'skipped_unsupported'
    | 'cancelled';
  message?: string;
  mediaItemId?: string;
}

// Szkennelés megszakítási kérése
export function cancelScan(userId: string): boolean {
  const status = scanStatuses.get(userId);
  if (status && status.isScanning) {
    scanStatuses.set(userId, { ...status, cancelRequested: true });
    return true;
  }
  return false;
}

// Fájlok megszámlálása egy könyvtárban és alkönyvtáraiban
async function countFiles(directoryPath: string, extensions: string[]): Promise<number> {
  let count = 0;
  try {
    const dirents = await fs.readdir(directoryPath, { withFileTypes: true });
    for (const dirent of dirents) {
      const fullPath = path.join(directoryPath, dirent.name);
      if (dirent.isDirectory()) {
        count += await countFiles(fullPath, extensions);
      } else if (dirent.isFile()) {
        const ext = path.extname(dirent.name).toLowerCase();
        if (extensions.includes(ext)) {
          count++;
        }
      }
    }
  } catch (error) {
    console.error(`Error counting files in ${directoryPath}:`, error);
  }
  return count;
}

async function processMediaFile(filePath: string, userId: string): Promise<ScanResult> {
  // Ellenőrizzük a megszakítási kérést
  const status = scanStatuses.get(userId);
  if (status?.cancelRequested) {
    return { filePath, status: 'cancelled', message: 'Szkennelés megszakítva.' };
  }

  // Frissítjük a státuszt az aktuális fájllal
  if (status) {
    scanStatuses.set(userId, {
      ...status,
      currentFile: filePath,
      scannedFiles: status.scannedFiles + 1,
      progress:
        status.totalFiles > 0
          ? Math.min(98, Math.floor((status.scannedFiles / status.totalFiles) * 100))
          : 0,
    });
  }

  try {
    const dirname = path.dirname(filePath);
    const basename = path.basename(filePath);
    const ext = path.extname(basename).toLowerCase();
    const nameWithoutExt = path.basename(basename, path.extname(basename));

    const existingMediaItem = await getMediaItemByPath(filePath);

    const stats = await fs.stat(filePath);

    let imdbId: string | null = null;
    const nfoFilePath = path.join(dirname, nameWithoutExt + NFO_EXTENSION);
    let nfoFound = false;

    try {
      const nfoContent = await fs.readFile(nfoFilePath, 'utf-8');
      imdbId = extractImdbIdFromNfo(nfoContent);
      nfoFound = true;
      console.log(`NFO found for ${basename}, IMDb ID: ${imdbId}`);
    } catch (nfoError) {
      console.log(`NFO file not found or error reading for ${basename}.`);
    }

    let omdbApiResponse: any = null;
    if (imdbId) {
      omdbApiResponse = await getOmdbData(imdbId, 'imdbId');
    }
    if (!omdbApiResponse) {
      const cleanedTitle = nameWithoutExt.replace(/[._]/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`Attempting OMDb search by title: ${cleanedTitle}`);
      omdbApiResponse = await getOmdbData(cleanedTitle, 'title');
    }

    if (!omdbApiResponse || omdbApiResponse.Response === 'False') {
      return {
        filePath,
        status: 'omdb_not_found',
        message: `OMDb data not found for ${nameWithoutExt}. NFO found: ${nfoFound}, IMDb ID from NFO: ${imdbId || 'N/A'}`,
      };
    }

    const mediaItemData: Partial<Omit<MediaItem, 'id' | 'created_at' | 'modified_at'>> & {
      path: string;
      scanned_by_user_id: string;
    } = {
      name: omdbApiResponse.Title || nameWithoutExt,
      path: filePath,
      extension: ext,
      size: stats.size,
      type: omdbApiResponse.Type === 'series' ? 'sorozat' : 'film',
      cover_image_path:
        omdbApiResponse.Poster && omdbApiResponse.Poster !== 'N/A' ? omdbApiResponse.Poster : null,
      scanned_by_user_id: userId,
    };

    const mediaItemId = await upsertMediaItem(mediaItemData);
    const currentStatus: ScanResult['status'] = existingMediaItem ? 'updated' : 'added';

    if (mediaItemId && omdbApiResponse) {
      const omdbMetadataPayload: Partial<OmdbMetadata> = {
        title: omdbApiResponse.Title,
        year: omdbApiResponse.Year,
        genre: omdbApiResponse.Genre,
        director: omdbApiResponse.Director,
        actors: omdbApiResponse.Actors,
        plot: omdbApiResponse.Plot,
        imdb_rating: omdbApiResponse.imdbRating,
        poster_url:
          omdbApiResponse.Poster && omdbApiResponse.Poster !== 'N/A'
            ? omdbApiResponse.Poster
            : null,
        api_response: JSON.stringify(omdbApiResponse),
      };
      await upsertOmdbMetadata(mediaItemId, omdbMetadataPayload);
    }

    return { filePath, status: currentStatus, mediaItemId };
  } catch (error: any) {
    console.error(`Error processing file ${filePath}:`, error);
    return { filePath, status: 'error', message: error.message };
  }
}

async function scanDirectory(directoryPath: string, userId: string): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  // Ellenőrizzük a megszakítási kérést
  const status = scanStatuses.get(userId);
  if (status?.cancelRequested) {
    return [{ filePath: directoryPath, status: 'cancelled', message: 'Szkennelés megszakítva.' }];
  }

  // Frissítjük a státuszt az aktuális könyvtárral
  if (status) {
    scanStatuses.set(userId, { ...status, currentDirectory: directoryPath });
  }

  try {
    const dirents = await fs.readdir(directoryPath, { withFileTypes: true });
    for (const dirent of dirents) {
      // Ellenőrizzük újra a megszakítási kérést minden fájl/könyvtár előtt
      if (scanStatuses.get(userId)?.cancelRequested) {
        break;
      }

      const fullPath = path.join(directoryPath, dirent.name);
      if (dirent.isDirectory()) {
        results.push(...(await scanDirectory(fullPath, userId)));
      } else if (dirent.isFile()) {
        const ext = path.extname(dirent.name).toLowerCase();
        if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
          results.push(await processMediaFile(fullPath, userId));
        } else {
          // Optionally log skipped files:
          // console.log(`Skipping unsupported file type: ${fullPath}`);
          // results.push({ filePath: fullPath, status: 'skipped_unsupported', message: 'File type not supported.' });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directoryPath}:`, error);
    results.push({
      filePath: directoryPath,
      status: 'error',
      message: `Failed to scan directory: ${(error as Error).message}`,
    });
  }
  return results;
}

export async function scanPaths(pathsToScan: string[], userId: string): Promise<ScanResult[]> {
  let allResults: ScanResult[] = [];

  // Számoljuk meg előre a fájlokat a progress bar pontosabb becslése érdekében
  let totalFiles = 0;
  for (const p of pathsToScan) {
    try {
      const stats = await fs.stat(p);
      if (stats.isDirectory()) {
        totalFiles += await countFiles(p, SUPPORTED_VIDEO_EXTENSIONS);
      } else if (
        stats.isFile() &&
        SUPPORTED_VIDEO_EXTENSIONS.includes(path.extname(p).toLowerCase())
      ) {
        totalFiles += 1;
      }
    } catch (error) {
      console.error(`Error counting files in ${p}:`, error);
    }
  }

  // Kezdeti szkennelési állapot beállítása
  scanStatuses.set(userId, {
    isScanning: true,
    progress: 0,
    scannedFiles: 0,
    totalFiles,
    currentDirectory: '',
    startTime: new Date().toISOString(),
    cancelRequested: false,
  });

  for (const p of pathsToScan) {
    // Ellenőrizzük a megszakítási kérést
    if (scanStatuses.get(userId)?.cancelRequested) {
      allResults.push({
        filePath: p,
        status: 'cancelled',
        message: 'Szkennelés megszakítva a felhasználó által.',
      });
      break;
    }

    try {
      const stats = await fs.stat(p);
      if (stats.isDirectory()) {
        console.log(`Scanning directory: ${p}`);
        allResults.push(...(await scanDirectory(p, userId)));
      } else if (stats.isFile()) {
        const ext = path.extname(p).toLowerCase();
        if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
          console.log(`Scanning file: ${p}`);
          allResults.push(await processMediaFile(p, userId));
        } else {
          allResults.push({
            filePath: p,
            status: 'skipped_unsupported',
            message: 'File type not supported.',
          });
        }
      } else {
        allResults.push({
          filePath: p,
          status: 'error',
          message: 'Path is not a supported file or directory.',
        });
      }
    } catch (error) {
      console.error(`Error accessing path ${p}:`, error);
      allResults.push({
        filePath: p,
        status: 'error',
        message: `Error accessing path: ${(error as Error).message}`,
      });
    }
  }

  // Szkennelés végének jelzése
  const finalStatus = scanStatuses.get(userId);
  if (finalStatus) {
    const wasCancelled = finalStatus.cancelRequested;
    scanStatuses.set(userId, {
      ...finalStatus,
      isScanning: false,
      progress: wasCancelled ? finalStatus.progress : 100,
      estimatedEndTime: new Date().toISOString(),
      error: wasCancelled ? 'Szkennelés megszakítva a felhasználó által.' : undefined,
    });
  }

  console.log(`Scan completed. Total items processed: ${allResults.length}`);
  return allResults;
}

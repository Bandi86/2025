import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

// Konfigurációs beállítások külön kezelése
export const MediaConfig = {
  supportedExtensions: ['.mp4', '.mkv', '.avi'],
  nfoExtension: '.nfo',
  batchSize: 10,
  cacheDuration: 1000 * 60 * 10, // 10 perc
  newDirectoryThreshold: 1000 * 60 * 60 * 24, // 24 óra
};

export type MediaFile = {
  id: string;
  path: string;
  name: string;
  extension: string;
  size?: number;
  modifiedAt?: Date;
  isNewDirectory?: boolean;
  type: 'film' | 'sorozat';
  nfoContent?: string;
  linkedNfoPath?: string; // Az NFO fájl elérési útja, ha van
  linkedMediaPath?: string; // A médiafájl elérési útja, ha ez egy NFO rekord
};

// Gyorsítótár implementáció
class FilesystemCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  store(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  retrieve<T>(key: string): T | null {
    const hit = this.cache.get(key);
    if (!hit) return null;

    // Ellenőrizzük, hogy a gyorsítótár érvényes-e még
    if (Date.now() - hit.timestamp > MediaConfig.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return hit.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clean(): void {
    const currentTime = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (currentTime - value.timestamp > MediaConfig.cacheDuration) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new FilesystemCache();

// Könyvtár típusának okosabb meghatározása
async function determineDirectoryType(directoryPath: string): Promise<'film' | 'sorozat'> {
  const lower = path.basename(directoryPath).toLowerCase();

  // Alapértelmezett érték
  let type: 'film' | 'sorozat' = 'film';

  // Könyvtárnév alapján
  if (lower.includes('sorozat')) type = 'sorozat';
  if (lower.includes('film')) type = 'film';

  // Könyvtárszerkezet alapján további ellenőrzés
  try {
    // Évad és epizód mintázat keresése
    if (existsSync(directoryPath)) {
      // Aszinkron módon olvassuk be a könyvtár tartalmát
      const files = await fs.readdir(directoryPath);

      // Évad-szerű könyvtárak keresése (S01, Season 1, stb.)
      const seasonPattern = /[Ss]\d+|[Éé]vad\s*\d+|[Ss]eason\s*\d+/;

      // Aszinkron ellenőrzés minden fájlra
      const directoryChecks = await Promise.all(
        files.map(async (file) => {
          const fullPath = path.join(directoryPath, file);
          try {
            const stats = await fs.stat(fullPath);
            return {
              matchesPattern: seasonPattern.test(file),
              isDirectory: stats.isDirectory(),
            };
          } catch (error) {
            return { matchesPattern: false, isDirectory: false };
          }
        })
      );

      const hasSeasonDirectory = directoryChecks.some(
        (check) => check.matchesPattern && check.isDirectory
      );

      if (hasSeasonDirectory) type = 'sorozat';

      // Epizód mintázatok keresése a fájlnevekben (S01E02, E01, stb.)
      const episodePattern = /[Ss]\d+[Ee]\d+|[Ee]\d+|[Ee]pizód\s*\d+/;
      const hasEpisodeFile = files.some((file) => episodePattern.test(file));

      if (hasEpisodeFile) type = 'sorozat';
    }
  } catch (error) {
    console.error(`❌ Hiba a könyvtár típus meghatározásánál: ${directoryPath}`, error);
  }

  return type;
}

// Médiakönyvtárak beolvasása
export async function scanMediaDirectories(
  paths: string[]
): Promise<{ files: MediaFile[]; errors: string[] }> {
  const results = await Promise.all(
    paths.map(async (directoryPath) => {
      // Gyorsítótár ellenőrzése
      const cacheKey = `directory_${directoryPath}`;
      const cachedResult = cache.retrieve<{ files: MediaFile[]; error: string | null }>(cacheKey);

      if (cachedResult) {
        console.log(`📂 Gyorsítótárból betöltve: ${directoryPath}`);
        return cachedResult;
      }

      const type = await determineDirectoryType(directoryPath);

      try {
        const filesFromDirectory = await walkDirectory(directoryPath, type);
        console.log(`✅ Sikeres beolvasás: ${directoryPath}`);

        // Médiafájlok és NFO fájlok összekapcsolása
        const linkedFiles = linkNfoAndMediaFiles(filesFromDirectory);

        // Eredmény tárolása a gyorsítótárban
        cache.store(cacheKey, { files: linkedFiles, error: null });

        return { files: linkedFiles, error: null };
      } catch (error: any) {
        console.error(`❌ Hiba a könyvtár bejárása közben: ${directoryPath}`, error);
        return {
          files: [],
          error: `Nem található vagy nem elérhető mappa: ${directoryPath}. Hiba: ${
            error.message || 'Ismeretlen hiba'
          }`,
        };
      }
    })
  );

  const allFiles = results.flatMap((r) => r.files);
  const errors = results.flatMap((r) => (r.error ? [r.error] : []));

  return { files: allFiles, errors };
}

// NFO és médiafájlok összekapcsolása
function linkNfoAndMediaFiles(files: MediaFile[]): MediaFile[] {
  const mediaFiles = files.filter((f) => MediaConfig.supportedExtensions.includes(f.extension));
  const nfoFiles = files.filter((f) => f.extension === MediaConfig.nfoExtension);

  // Minden NFO fájlhoz keressük a megfelelő médiafájlt
  nfoFiles.forEach((nfoFile) => {
    const nfoBasename = path.basename(nfoFile.name, nfoFile.extension);

    // Pontosabb egyeztetési algoritmus
    // 1. Pontos név egyezés
    // 2. Egyik tartalmazza a másikat
    // 3. Fuzzy egyeztetés
    let matchedMedia = mediaFiles.find((mediaFile) => {
      const mediaBasename = path.basename(mediaFile.name, mediaFile.extension);

      // Pontosan egyezik
      if (mediaBasename === nfoBasename) return true;

      // Egyik tartalmazza a másikat
      if (mediaBasename.includes(nfoBasename) || nfoBasename.includes(mediaBasename)) return true;

      // További kritériumok mint például Levenshtein távolság is implementálhatók

      return false;
    });

    if (matchedMedia) {
      // Kapcsoljuk össze őket
      nfoFile.linkedMediaPath = matchedMedia.path;
      matchedMedia.linkedNfoPath = nfoFile.path;
      matchedMedia.nfoContent = nfoFile.nfoContent;

      console.log(`🔗 NFO fájl összekapcsolva: ${nfoFile.name} -> ${matchedMedia.name}`);
    } else {
      console.warn(`⚠️ Nem találtam médiafájlt az NFO-hoz: ${nfoFile.name}`);
    }
  });

  // Csak a médiafájlokat adjuk vissza, az NFO-k információi már benne vannak
  return mediaFiles;
}

// Könyvtár bejárása és fájlok összegyűjtése
async function walkDirectory(directory: string, type: 'film' | 'sorozat'): Promise<MediaFile[]> {
  let results: MediaFile[] = [];

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    // Kötegelt fájl feldolgozás párhuzamossággal, de limitált mennyiséggel egyszerre
    const batchSize = MediaConfig.batchSize;

    // Az összes bejegyzést csoportokra bontjuk a hatékonyabb feldolgozás érdekében
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const batchPromises = batch.map(async (entry) => {
        const fullPath = path.join(directory, entry.name);

        // Gyorsítótár ellenőrzése az aktuális fájlhoz/könyvtárhoz
        const cacheKey = `file_${fullPath}`;
        const cachedResult = cache.retrieve<MediaFile[]>(cacheKey);

        if (cachedResult) {
          return cachedResult;
        }

        try {
          if (entry.isDirectory()) {
            // Kihagyjuk a "sample" könyvtárakat
            if (entry.name.toLowerCase() === 'sample') {
              console.log(`⏭️ Sample könyvtár kihagyva: ${fullPath}`);
              return [];
            }

            const stats = await fs.stat(fullPath).catch((error) => {
              console.error(`❌ Nem sikerült olvasni a könyvtár adatait: ${fullPath}`, error);
              return null;
            });

            if (!stats) return [];

            // Ha a könyvtár neve alapján más típust kellene használni
            const subdirectoryType = await determineDirectoryType(fullPath);

            const isNewDirectory = Date.now() - stats.mtimeMs < MediaConfig.newDirectoryThreshold;
            const nestedFiles = await walkDirectory(fullPath, subdirectoryType);

            const result = nestedFiles.map((file) => ({ ...file, isNewDirectory }));
            cache.store(cacheKey, result);
            return result;
          } else {
            const extension = path.extname(entry.name).toLowerCase();

            // NFO fájlok feldolgozása
            if (extension === MediaConfig.nfoExtension) {
              try {
                const nfoContent = await fs.readFile(fullPath, 'utf-8');
                console.log(`📄 NFO fájl olvasva: ${entry.name}`);

                const result = [
                  {
                    id: randomUUID(),
                    path: fullPath,
                    name: entry.name,
                    extension,
                    type,
                    nfoContent,
                  },
                ];

                cache.store(cacheKey, result);
                return result;
              } catch (error) {
                console.warn(`⚠️ Nem sikerült beolvasni NFO fájlt: ${fullPath}`, error);
                return [];
              }
            }
            // Médiafájlok feldolgozása
            else if (MediaConfig.supportedExtensions.includes(extension)) {
              try {
                const stats = await fs.stat(fullPath);

                const result = [
                  {
                    id: randomUUID(),
                    path: fullPath,
                    name: entry.name,
                    extension,
                    size: stats.size,
                    modifiedAt: stats.mtime,
                    type,
                  },
                ];

                cache.store(cacheKey, result);
                return result;
              } catch (error) {
                console.warn(`⚠️ Nem sikerült beolvasni fájlt: ${fullPath}`, error);
                return [];
              }
            }

            return [];
          }
        } catch (error) {
          console.error(`❌ Váratlan hiba a fájl/könyvtár feldolgozása során: ${fullPath}`, error);
          return [];
        }
      });

      // Minden batch-et feldolgozunk párhuzamosan
      const batchResults = await Promise.all(batchPromises);

      // Egyesítjük az eredményeket
      results = results.concat(batchResults.flat());
    }
  } catch (error) {
    console.error(`❌ Hiba a könyvtár bejárása közben: ${directory}`, error);
    throw error; // Dobjuk tovább a hibát, hogy a hívó kezelje
  }

  return results;
}

// Gyorsítótár tisztítása
export function clearCache(): void {
  cache.clean();
  console.log('🧹 Médiafájl gyorsítótár tisztítva');
}

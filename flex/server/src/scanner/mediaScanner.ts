import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

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
};

const supportedExtensions = ['.mp4', '.mkv', '.avi'];

export async function scanMediaDirectories(
  paths: string[]
): Promise<{ files: MediaFile[]; errors: string[] }> {
  const results = await Promise.all(
    paths.map(async (dirPath) => {
      let type: 'film' | 'sorozat' = 'film';
      const lower = path.basename(dirPath).toLowerCase();
      if (lower.includes('sorozat')) type = 'sorozat';
      if (lower.includes('film')) type = 'film';

      try {
        const filesFromDir = await walkDirectory(dirPath, type);
        console.log(`✅ Sikeres scan: ${dirPath}`);
        return { files: filesFromDir, error: null };
      } catch (err: any) {
        console.error(`❌ Hiba a könyvtár bejárása közben: ${dirPath}`, err);
        return {
          files: [],
          error: `Nem található vagy nem elérhető mappa: ${dirPath}`,
        };
      }
    })
  );

  const allFiles = results.flatMap((r) => r.files);
  const errors = results.flatMap((r) => (r.error ? [r.error] : []));

  return { files: allFiles, errors };
}

async function walkDirectory(dir: string, type: 'film' | 'sorozat'): Promise<MediaFile[]> {
  let results: MediaFile[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const stat = await fs.stat(fullPath);
        const isNew = Date.now() - stat.mtimeMs < 1000 * 60 * 60 * 24; // módosítva 24 órán belül
        const nested = await walkDirectory(fullPath, type);
        results.push(...nested.map((file) => ({ ...file, isNewDirectory: isNew })));
      } else {
        const ext = path.extname(entry.name).toLowerCase();

        if (ext === '.nfo') {
          // Leolvassuk a kapcsolódó médiafájl mappájából az NFO-tartalmat
          try {
            const nfoContent = await fs.readFile(fullPath, 'utf-8');
            console.log(`📄 NFO fájl olvasva: ${entry.name}`);
            // Megjegyzés: Jelenleg csak beolvassuk, a médiafájlhoz kapcsolás komplex lenne itt.
            results.push({
              id: randomUUID(),
              path: fullPath,
              name: entry.name,
              extension: ext,
              type,
              nfoContent,
            });
          } catch (err) {
            console.warn(`⚠️ Nem sikerült beolvasni NFO fájlt: ${fullPath}`, err);
          }
        } else if (supportedExtensions.includes(ext)) {
          try {
            const stat = await fs.stat(fullPath);
            results.push({
              id: randomUUID(),
              path: fullPath,
              name: entry.name,
              extension: ext,
              size: stat.size,
              modifiedAt: stat.mtime,
              type,
            });
          } catch (err) {
            console.warn(`⚠️ Nem sikerült beolvasni fájlt: ${fullPath}`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error(`❌ Hiba a könyvtár bejárása közben: ${dir}`, err);
  }

  return results;
}

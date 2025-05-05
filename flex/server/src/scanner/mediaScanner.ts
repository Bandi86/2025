import * as fs from 'fs/promises';
import * as path from 'path';

export type MediaFile = {
  path: string;
  name: string;
  extension: string;
  size?: number;
  modifiedAt?: Date;
  isNewDirectory?: boolean;
  type: 'film' | 'sorozat';
};

const supportedExtensions = ['.mp4', '.mkv', '.avi'];

export async function scanMediaDirectories(
  paths: string[]
): Promise<{ files: MediaFile[]; errors: string[] }> {
  const allFiles: MediaFile[] = [];
  const errors: string[] = [];

  for (const dirPath of paths) {
    // Determine type from directory name
    let type: 'film' | 'sorozat' = 'film';
    const lower = path.basename(dirPath).toLowerCase();
    if (lower.includes('sorozat')) type = 'sorozat';
    if (lower.includes('film')) type = 'film';
    try {
      const filesFromDir = await walkDirectory(dirPath, type);
      allFiles.push(...filesFromDir);
      console.log('sikeres scan');
    } catch (err: any) {
      errors.push(`Nem található vagy nem elérhető mappa: ${dirPath}`);
      console.error(`Hiba a könyvtár bejárása közben: ${dirPath}`, err);
    }
  }

  return { files: allFiles, errors };
}

async function walkDirectory(dir: string, type: 'film' | 'sorozat'): Promise<MediaFile[]> {
  let results: MediaFile[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const nested = await walkDirectory(fullPath, type);
        results.push(...nested);
      } else if (
        entry.isFile() &&
        supportedExtensions.includes(path.extname(entry.name).toLowerCase())
      ) {
        const stat = await fs.stat(fullPath);
        results.push({
          path: fullPath,
          name: entry.name,
          extension: path.extname(entry.name).toLowerCase(),
          size: stat.size,
          modifiedAt: stat.mtime,
          type,
        });
      }
    }
  } catch (err) {
    console.error(`Hiba a könyvtár bejárása közben: ${dir}`, err);
  }

  return results;
}

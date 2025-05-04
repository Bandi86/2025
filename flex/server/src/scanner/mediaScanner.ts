import * as fs from 'fs/promises';
import * as path from 'path';

export type MediaFile = {
  path: string;
  name: string;
  extension: string;
  size?: number;
  modifiedAt?: Date;
};

const supportedExtensions = ['.mp4', '.mkv', '.avi'];

export async function scanMediaDirectories(paths: string[]): Promise<MediaFile[]> {
  const allFiles: MediaFile[] = [];

  for (const dirPath of paths) {
    const filesFromDir = await walkDirectory(dirPath);
    allFiles.push(...filesFromDir);
    console.log('sikeres scan')
  }

  return allFiles;
}

async function walkDirectory(dir: string): Promise<MediaFile[]> {
  let results: MediaFile[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const nested = await walkDirectory(fullPath);
        results.push(...nested);
      } else if (entry.isFile() && supportedExtensions.includes(path.extname(entry.name).toLowerCase())) {
        const stat = await fs.stat(fullPath);
        results.push({
          path: fullPath,
          name: entry.name,
          extension: path.extname(entry.name).toLowerCase(),
          size: stat.size,
          modifiedAt: stat.mtime,
        });
      }
    }
  } catch (err) {
    console.error(`Hiba a könyvtár bejárása közben: ${dir}`, err);
  }

  return results;
}
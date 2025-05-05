import chokidar, { FSWatcher } from 'chokidar';
import { saveMediaItems } from '../db/mediaRepository';
import { MediaFile } from '../scanner/mediaScanner';
import * as path from 'path';
import * as fs from 'fs/promises';
import { open } from 'sqlite';
import * as sqlite3 from 'sqlite3';

const dbPath = path.join(__dirname, '../../data/media.db');
const watchers: Record<string, FSWatcher> = {};

async function getIndexedDirs(): Promise<string[]> {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  const rows = await db.all('SELECT path FROM media_items');
  await db.close();
  // Egyedi mappák
  return Array.from(new Set(rows.map((row: any) => path.dirname(row.path))));
}

async function createMediaFile(filePath: string, type: 'film' | 'sorozat'): Promise<MediaFile> {
  const stat = await fs.stat(filePath);
  return {
    path: filePath,
    name: path.basename(filePath),
    extension: path.extname(filePath).toLowerCase(),
    size: stat.size,
    modifiedAt: stat.mtime,
    type,
  };
}

export function addWatch(dir: string) {
  if (watchers[dir]) return; // Már figyeli
  let type: 'film' | 'sorozat' = dir.toLowerCase().includes('sorozat') ? 'sorozat' : 'film';
  const watcher = chokidar.watch(dir, { ignoreInitial: true });
  watcher.on('add', async (filePath) => {
    if (['.avi', '.mp4', '.mkv'].includes(path.extname(filePath).toLowerCase())) {
      const mediaFile = await createMediaFile(filePath, type);
      await saveMediaItems([mediaFile]);
      console.log('Új médiafájl indexelve:', filePath);
    }
  });
  watchers[dir] = watcher;
}

export async function startWatchers() {
  const dirs = await getIndexedDirs();
  dirs.forEach(addWatch);
}

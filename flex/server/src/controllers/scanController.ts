import { RequestHandler } from 'express';
import { MediaFile, scanMediaDirectories } from '../scanner/mediaScanner';
import { saveMediaItems, updateMediaMetadata } from '../db/mediaRepository';
import { addWatch } from '../watcher/mediaWatcher';
import generateTitleFromPath from '../helpers/generateTitleFromPath';
import * as dotenv from 'dotenv';
dotenv.config();

async function getOmdbData(title: string): Promise<any> {
  try {
    const apiKey = process.env.OMDB_API_KEY?.trim();
    if (!apiKey) return null;
    const url = `http://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { Response: string; [key: string]: any };
    if (data.Response === 'False') return null;
    return data;
  } catch {
    return null;
  }
}

// SCAN the path
export const scanHandler: RequestHandler<any, any, { paths: string[] }> = async (req, res) => {
  const { paths } = req.body;

  if (!Array.isArray(paths) || paths.length === 0) {
    res.status(400).json({ error: 'Kérlek adj meg legalább egy elérési utat a "paths" mezőben.' });
    return;
  }

  try {
    const { files, errors } = await scanMediaDirectories(paths);

    // Filter out files containing the word 'sample'
    const filteredFiles: MediaFile[] = files.filter((file) => !file.path.includes('sample'));

    await saveMediaItems(filteredFiles);

    // OMDb metaadatok cache-elése minden új filmhez
    for (const file of filteredFiles) {
      if (file.type === 'film') {
        const title = generateTitleFromPath(file.path);
        const omdb = await getOmdbData(title);
        if (omdb) {
          if ('id' in file) {
            if (typeof file.id === 'string') {
              await updateMediaMetadata(file.id, omdb);
            } else {
              console.warn(`File ${file.name} has an invalid 'id' type.`);
            }
          } else {
            console.warn(`File ${file} does not have an 'id' property.`);
          }
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ error: errors.join(' | '), files: filteredFiles });
      return;
    }
    res.json({ files: filteredFiles });

    // Add watch for new directories
    filteredFiles.forEach((file) => {
      if (file.isNewDirectory) {
        addWatch(file.path);
      }
    });
  } catch (error) {
    console.error('Hiba a szkennelés során:', error);
    res.status(500).json({ error: 'Nem sikerült a mappák beolvasása.' });
  }
};

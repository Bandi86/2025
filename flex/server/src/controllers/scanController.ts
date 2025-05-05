import { RequestHandler } from 'express';
import { scanMediaDirectories } from '../scanner/mediaScanner';
import { saveMediaItems } from '../db/mediaRepository';
import { addWatch } from '../watcher/mediaWatcher';

export const scanHandler: RequestHandler<any, any, { paths: string[] }> = async (req, res) => {
  const { paths } = req.body;

  if (!Array.isArray(paths) || paths.length === 0) {
    res.status(400).json({ error: 'Kérlek adj meg legalább egy elérési utat a "paths" mezőben.' });
    return;
  }

  try {
    const { files, errors } = await scanMediaDirectories(paths);
    await saveMediaItems(files);
    if (errors.length > 0) {
      res.status(400).json({ error: errors.join(' | '), files });
      return;
    }
    res.json({ files });

    // Add watch for new directories
    files.forEach(file => {
      if (file.isNewDirectory) {
        addWatch(file.path);
      }
    });
  } catch (error) {
    console.error('Hiba a szkennelés során:', error);
    res.status(500).json({ error: 'Nem sikerült a mappák beolvasása.' });
  }
};

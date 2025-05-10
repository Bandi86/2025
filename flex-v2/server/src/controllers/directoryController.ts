import { Request, Response } from 'express';
import { getAll, add, remove } from '../repositories/directoryRepository';
import fs from 'fs';
import path from 'path';
import { ValidationError } from '../lib/error';

// Könyvtárak listázása
export async function listDirectories(req: Request, res: Response) {
  const dirs = await getAll();
  res.json({ dirs });
}

// Könyvtár hozzáadása
export async function addDirectory(req: Request, res: Response) {
  const { path: dirPath } = req.body;
  if (!dirPath) {
    throw new ValidationError('A könyvtár útvonala kötelező');
  }
  const dir = await add(dirPath);
  res.json({ dir });
}

// Könyvtár törlése
export async function deleteDirectory(req: Request, res: Response) {
  const { id } = req.params;
  await remove(id);
  res.json({ success: true });
}

// Fájlrendszer böngészése
export async function browseFilesystem(req: Request, res: Response) {
  try {
    const requestedPath = (req.query.path as string) || '/';
    if (!fs.existsSync(requestedPath) && requestedPath !== '/') {
      throw new ValidationError(`A megadott útvonal nem létezik: ${requestedPath}`);
    }
    let directories: string[] = [];
    let files: string[] = [];
    if (requestedPath === '/') {
      const commonDirs = ['/home', '/usr', '/var', '/etc', '/opt', '/media', '/mnt'];
      directories = commonDirs.filter((dir) => fs.existsSync(dir));
    } else {
      const items = fs.readdirSync(requestedPath, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.')) continue;
        const fullPath = path.join(requestedPath, item.name);
        try {
          if (item.isDirectory()) {
            directories.push(item.name);
          } else if (item.isFile()) {
            files.push(item.name);
          }
        } catch (err) {
          console.error(`Hiba a(z) ${fullPath} olvasása közben:`, err);
        }
      }
      directories.sort();
      files.sort();
    }
    res.json({ directories, files });
  } catch (error) {
    console.error('Hiba a fájlrendszer böngészése közben:', error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Hiba történt a fájlrendszer böngészése közben');
  }
}

import { Router } from 'express';
import {
  listDirectories,
  addDirectory,
  deleteDirectory,
  browseFilesystem,
} from '../controllers/directoryController';

const router = Router();

// Könyvtárak listázása
router.get('/', listDirectories);

// Könyvtár hozzáadása
router.post('/', addDirectory);

// Könyvtár törlése
router.delete('/:id', deleteDirectory);

// Fájlrendszer böngészése
router.get('/browse', browseFilesystem);

export default router;

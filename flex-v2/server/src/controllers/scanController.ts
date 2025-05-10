import { Request, Response, NextFunction } from 'express';
import { scanPaths, ScanResult, scanStatuses, cancelScan, ScanStatus } from '../lib/scan/scanPath';
import { updateFilesCountByPath } from '../repositories/directoryRepository';

// Define a custom request type that includes the user property
interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string; email?: string; [key: string]: any };
}

// Szkennelés indítása (POST /scans)
export const startScan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { paths } = req.body as { paths: string[] };
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (!Array.isArray(paths) || paths.length === 0) {
    res.status(400).json({ error: 'Kérlek adj meg legalább egy elérési utat a "paths" mezőben.' });
    return;
  }

  // Ellenőrizzük, hogy fut-e már szkennelés
  const currentStatus = scanStatuses.get(userId);
  if (currentStatus && currentStatus.isScanning) {
    res.status(409).json({
      error: 'Már fut egy szkennelési folyamat. Kérlek várj, amíg befejeződik vagy szakítsd meg.',
      currentStatus,
    });
    return;
  }

  try {
    console.log(`User ${userId} initiated scan for paths:`, paths);

    // A szkennelési folyamat elindítása aszinkron módon, hogy a választ azonnal visszaadhassuk
    res.status(200).json({
      message: 'Szkennelés elindítva.',
      paths,
    });

    // Szkennelés végrehajtása (a scanPaths most már automatikusan frissíti a státuszt)
    const results: ScanResult[] = await scanPaths(paths, userId);

    // Fájlok számának frissítése minden path-ra
    for (const path of paths) {
      // A valid státuszértékek a ScanResult interface-ből: 'added', 'updated', 'exists'
      const count = results.filter(
        (r) =>
          r.filePath.startsWith(path) &&
          (r.status === 'added' || r.status === 'updated' || r.status === 'exists')
      ).length;
      await updateFilesCountByPath(path, count);
    }

    console.log('Scan complete. Results:', results);
  } catch (error: any) {
    console.error('Error during scan process in controller:', error);

    // Hiba esetén a szkennelési státusz frissítése
    const status = scanStatuses.get(userId);
    if (status) {
      scanStatuses.set(userId, {
        ...status,
        isScanning: false,
        error: `Hiba történt a szkennelés során: ${error.message}`,
      });
    }
  }
};

// Szkennelés állapotának lekérdezése (GET /scans/status)
export const getScanStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required.' });
  }

  // Lekérjük az aktuális státuszt a scanStatuses Map-ből
  const status = userId ? scanStatuses.get(userId) || {
    isScanning: false,
    progress: 0,
    scannedFiles: 0,
    totalFiles: 0,
  } : undefined;

  res.json(status);
};

// Szkennelés megszakítása (POST /scans/cancel)
export const cancelScanRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required.' });
  }

  if (!userId) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const cancelled = cancelScan(userId);

  if (cancelled) {
    res.json({
      message: 'Szkennelés megszakítási kérés elküldve. A folyamat hamarosan leáll.',
      status: scanStatuses.get(userId),
    });
  } else {
    res.status(404).json({
      error: 'Nincs aktív szkennelési folyamat, amelyet meg lehetne szakítani.',
    });
  }
};

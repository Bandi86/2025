import express from 'express';
import { authenticate } from '../middlewares/auth';
import { startScan, getScanStatus, cancelScanRequest } from '../controllers/scanController';

const router = express.Router();

// Útvonal loggolása DEBUG módban
router.use((req, res, next) => {
  console.log(
    `[scanRoutes.ts] Kérés érkezett a következő útvonalra: ${req.method} ${req.originalUrl} (routeren belüli útvonal: ${req.url})`
  );
  next();
});

// Szkennelés indítása (POST /)
router.post('/', authenticate, startScan);

// Szkennelés állapot lekérdezése (GET /status)
router.get('/status', authenticate, getScanStatus);

// Szkennelés megszakítása (POST /cancel)
router.post('/cancel', authenticate, cancelScanRequest);

export default router;

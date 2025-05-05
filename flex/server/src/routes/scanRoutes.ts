import { Router } from 'express';
import { scanHandler } from '../controllers/scanController';

const router = Router();

router.post('/scan', scanHandler);

export default router;

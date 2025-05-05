import { Router } from 'express';
import { getMovies, getSeries } from '../controllers/mediaController';

const router = Router();

router.get('/filmek', getMovies);
router.get('/sorozatok', getSeries);

export default router;

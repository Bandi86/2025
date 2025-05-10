import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getSeries, getSeriesById, searchSeries } from '../controllers/seriesController';

const router = Router();

// Minden sorozatos végpont authentikációt igényel
router.use(authenticate);

// GET /api/media/series - Az összes sorozat lekérdezése, szűrési, rendezési és lapozási lehetőségekkel
router.get('/series', getSeries);

// GET /api/media/series/search - Sorozatok keresése (fontos: ez legyen a :id paraméter ELŐTT!)
router.get('/series/search', searchSeries);

// GET /api/media/series/:id - Egy konkrét sorozat lekérdezése ID alapján
router.get('/series/:id', getSeriesById);

export default router;

import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getMovies, getMovieById, searchMovies } from '../controllers/movieController';

const router = Router();

// Minden filmes végpont authentikációt igényel
router.use(authenticate);

// GET /api/media/movies - Az összes film lekérdezése, szűrési, rendezési és lapozási lehetőségekkel
router.get('/movies', getMovies);

// GET /api/media/movies/search - Filmek keresése (fontos: ez legyen a :id paraméter ELŐTT!)
router.get('/movies/search', searchMovies);

// GET /api/media/movies/:id - Egy konkrét film lekérdezése ID alapján
router.get('/movies/:id', getMovieById);

export default router;

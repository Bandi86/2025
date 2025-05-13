import express from 'express';
import { createNewUser } from '../controllers/createNewUser';
import { loginUser } from '../controllers/loginUser';

const router = express.Router();

// Útvonal loggolása DEBUG módban
router.use((req, res, next) => {
  console.log(
    `[userRoutes.ts] Kérés érkezett a következő útvonalra: ${req.method} ${req.originalUrl} (routeren belüli útvonal: ${req.url})`
  );
  next();
});

// Új felhasználó regisztrálása
router.post('/register', async (req, res, next) => {
  try {
    await createNewUser(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Bejelentkezés
router.post('/login', loginUser);

// Kijelentkezés
router.get('/', async (req, res, next) => {
  try {
    // Kijelentkezés logikája itt
    // Például töröljük a sütit vagy a session-t
    res.clearCookie('token'); // Sütik törlése
    res.status(200).json({ message: 'Kijelentkezve' });
  } catch (error) {
    next(error);
  }
});

// Authentikált útvonalak


export default router;

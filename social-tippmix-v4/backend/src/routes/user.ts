import { Router } from 'express';
import { getAllUsers } from '../controllers/user/getAllUsers';
import { getUserById } from '../controllers/user/getUserById';
import { register } from '../controllers/user/register';
import login from '../controllers/user/login';
import { logout } from '../controllers/user/logout';
import { me } from '../controllers/user/me';
import asyncHandler from '../lib/asyncHandler';
import { requireAuth } from '../middlewares/auth';
import { validateSchema } from '../middlewares/validation';
import {
  loginUserSchema,
  registerUserSchema,
  updateUserSchema,
  adminUserQuerySchema,
  idParamSchema,
} from '../lib/validation';

const router = Router();

// Felhasználók listázása (admin)
router.get(
  '/',
  requireAuth,
  validateSchema(adminUserQuerySchema, 'query'),
  asyncHandler(getAllUsers)
);

// Regisztráció
router.post('/register', validateSchema(registerUserSchema), asyncHandler(register));

// Bejelentkezés
router.post('/login', validateSchema(loginUserSchema), asyncHandler(login));

// Kijelentkezés
router.post('/logout', requireAuth, asyncHandler(logout));

// Saját adatok lekérése
router.get('/me', requireAuth, asyncHandler(me));

// Felhasználó adatainak lekérése ID alapján
router.get('/:id', requireAuth, validateSchema(idParamSchema, 'params'), asyncHandler(getUserById));

export default router;

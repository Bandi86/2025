import { validateInputs } from '../lib/auth/validation';
import { validateUsername, validateEmail, validatePassword } from '../lib/auth/validation';
import { hashPassword, comparePassword } from '../lib/auth/bcrypt';
import { ApiError, NotFoundError, UnauthorizedError, ValidationError } from '../lib/error';
import { Request, Response, NextFunction } from 'express';
import {
  createUser,
  getUserByEmail,
  getUserByUsernameOrEmail,
} from '../repositories/userRepository';
import { signJwt } from '../lib/auth/jwt';

// Create a new user
export const createNewUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;
    console.log('Regisztrációs kérés:', { username, email });

    // Validate inputs
    const { valid, errors } = validateInputs(
      { username, email, password },
      {
        username: validateUsername,
        email: validateEmail,
        password: validatePassword,
      }
    );

    if (!valid) {
      return res.status(400).json({ errors });
    }

    // Ellenőrizzük, hogy a felhasználónév vagy email már foglalt-e
    try {
      await getUserByEmail(email);
      // Ha nem dob hibát, akkor már létezik ez az email
      return res.status(400).json({ error: 'Email already in use' });
    } catch (err) {
      // NotFoundError esetén jó, mert nem létezik még ilyen email
      if (!(err instanceof NotFoundError)) {
        throw err;
      }
    }

    // hash the password
    const hashedPassword = await hashPassword(password);

    // save data to the database
    const user = await createUser({ username, email, password: hashedPassword });

    // JWT token generálás
    const token = signJwt({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    // Token beállítása cookie-ban
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 nap
    });

    // give a response without the password
    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
      success: true,
    });

    console.log(`Felhasználó sikeresen regisztrálva: ${username} (${email})`);
  } catch (error) {
    console.error('Regisztrációs hiba:', error);
    next(error);
  }
};

// Login user
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Rugalmasan kezeljük a bemeneti mezőneveket
    const { username, usernameOrEmail, email, password } = req.body;

    // Meghatározzuk, melyik mezőt használjuk azonosításra
    const identifier = usernameOrEmail || username || email;

    console.log('Bejelentkezési kérés:', { identifier });

    if (!identifier || !password) {
      throw new ValidationError('Username/email and password are required');
    }

    // Felhasználó keresése username vagy email alapján
    let user;
    try {
      user = await getUserByUsernameOrEmail(identifier);
    } catch (err) {
      // A jelszó és felhasználónév/email hibákat ugyanúgy kezeljük biztonsági okokból
      throw new UnauthorizedError('Invalid credentials');
    }

    // Jelszó ellenőrzése
    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // JWT token generálás
    const token = signJwt({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    // Token beállítása cookie-ban
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 nap
    });

    // Válasz küldése a frontend-nek
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
      success: true,
    });

    console.log(`Felhasználó sikeresen bejelentkezett: ${user.username}`);
  } catch (error) {
    console.error('Bejelentkezési hiba:', error);
    next(error);
  }
};

// Logout user
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Token törlése a cookie-ból
    res.clearCookie('token');

    // Válasz küldése
    res.status(200).json({ message: 'Logout successful', success: true });

    // Ha van user a request-ben (mert volt token auth middleware), akkor logoljuk
    if (req.user) {
      console.log(`Felhasználó kijelentkezett: ${req.user.username}`);
    }
  } catch (error) {
    console.error('Kijelentkezési hiba:', error);
    next(error);
  }
};

// GET ME - Az aktuális felhasználó lekérdezése
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Az authenticate middleware már beállította a req.user-t
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Csak a szükséges adatokat küldjük vissza, jelszó nélkül
    res.status(200).json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
      },
      success: true,
    });
  } catch (error) {
    console.error('GetMe hiba:', error);
    next(error);
  }
};

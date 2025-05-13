import { Request, Response, NextFunction } from 'express';
import {
  validateInputs,
  validateUsername,
  validateEmail,
  validatePassword,
} from '../lib/auth/validation';
import { ApiError } from '../lib/error';
import prisma from '../lib/configdb';
import { comparePassword} from '../lib/auth/bcrypt';
import { signJwt } from '../lib/auth/jwt';

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    // Ellenőrizzük a bemeneti adatokat
    const { valid, errors } = validateInputs(
      { username, password },
      {
        username: validateUsername,
        password: validatePassword,
      }
    );
    if (!valid) {
      throw new ApiError(400, 'Invalid input');
    }
    // Ellenőrizzük, hogy a felhasználó létezik-e
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });
    if (!user) {
      throw new ApiError(401, 'Invalid username or password');
    }
    // Ellenőrizzük a jelszót
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid username or password');
    }
    // Jelszó ellenőrzése sikeres
    // Itt lehetne kezelni a bejelentkezést, például JWT token generálásával
    // Vagy session kezelésével, stb.
    const token = signJwt({ id: user.id, username: user.username })
    // Sütik beállítása (opcionális)
    res.cookie('token', token, {
      httpOnly: true, // Csak HTTP kérésekhez érhető el
      secure: process.env.NODE_ENV === 'production', // Csak HTTPS-en érhető el
      maxAge: 24 * 60 * 60 * 1000, // 1 nap
    });
    console.log('Felhasználó bejelentkezett:', user, token);
    // Sikeres bejelentkezés esetén válasz küldése
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    // Hiba kezelése
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};


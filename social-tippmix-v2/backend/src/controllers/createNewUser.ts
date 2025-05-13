import { NextFunction, Response, Request } from 'express';
import { ApiError } from '../lib/error';
import {
  validateInputs,
  validateUsername,
  validateEmail,
  validatePassword,
} from '../lib/auth/validation';
import prisma from '../lib/configdb';
import { hashPassword } from '../lib/auth/bcrypt';

export const createNewUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;
    const { valid, errors } = validateInputs(
      { username, email, password },
      {
        username: validateUsername,
        email: validateEmail,
        password: validatePassword,
      }
    );
    if (!valid) {
      throw new ApiError(400, 'Invalid input');
    }
    // Ellenőrizzük, hogy a felhasználónév már létezik-e
    const existingUser = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });
    if (existingUser) {
      throw new ApiError(400, 'Username already exists');
    }
    // Ellenőrizzük, hogy az email cím már létezik-e
    const existingEmail = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (existingEmail) {
      throw new ApiError(400, 'Email already exists');
    }
    // Új felhasználó létrehozása
    // Jelszó titkosítása
    const hashedPassword = await hashPassword(password);
    // Új felhasználó létrehozása a titkosított jelszóval
    const newUser = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword, // Jelszó titkosítása itt történik
        // További mezők, ha szükséges
        
      },
    });
    console.log('Új felhasználó létrehozva:', newUser);
    // Válasz küldése
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

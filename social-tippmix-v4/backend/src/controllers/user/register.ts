import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../lib/client';
import { ErrorFactory, ValidationError, ConflictError } from '../../lib/error';
import { RegisterUserInput, registerUserSchema } from '../../lib/validation';
import { logAuth, logInfo } from '../../lib/logger';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    // Zod validáció
    const validatedData = registerUserSchema.safeParse(req.body);
    if (!validatedData.success) {
      throw ValidationError.fromZod(validatedData.error, 'Registration validation failed');
    }

    const { username, password, email } = validatedData.data as RegisterUserInput;

    // Ellenőrizzük, hogy létezik-e a felhasználónév
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw ErrorFactory.usernameAlreadyExists(username);
    }

    // Ellenőrizzük, hogy létezik-e az email cím
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw ErrorFactory.emailAlreadyExists(email);
    }

    // Jelszó titkosítása
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Felhasználó létrehozása
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    // Sikeres regisztráció naplózása
    logAuth('user_registered', user.id, { username, email });
    logInfo(`New user registered: ${username}`);

    // Sikeres válasz
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

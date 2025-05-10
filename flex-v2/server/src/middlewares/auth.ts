import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../lib/auth/jwt';
import { UnauthorizedError } from '../lib/error';
import { getUserById } from '../repositories/userRepository';

// Kiterjesztjük a Request típust, hogy tartalmazzon user mezőt
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email?: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Authentikációs middleware
 * Ellenőrzi a JWT tokent (cookie-ból vagy Authorization headerből)
 * Sikeres ellenőrzés esetén beállítja a req.user objektumot
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Token kinyerése a cookie-ból vagy a header-ből
    let token = req.cookies?.token;

    // Ha nincs cookie, akkor nézzük a Bearer tokent
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Ha nincs token, akkor nincs authentikáció
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    // Token ellenőrzése
    const decoded = verifyJwt(token);
    if (!decoded || typeof decoded !== 'object') {
      throw new UnauthorizedError('Invalid token');
    }

    // Felhasználó lekérdezése az adatbázisból
    const userId = decoded.id;
    if (!userId) {
      throw new UnauthorizedError('Invalid token payload');
    }

    const user = await getUserById(userId.toString());

    // Beállítjuk a req.user-t
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Opcionális authentikáció
 * Ha van érvényes token, beállítja a req.user-t
 * Ha nincs vagy érvénytelen, akkor is továbblép
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Ha nincs token, akkor továbblépünk
    if (!token) {
      return next();
    }

    // Token ellenőrzése
    const decoded = verifyJwt(token);
    if (!decoded || typeof decoded !== 'object') {
      return next();
    }

    // Felhasználó lekérdezése az adatbázisból
    const userId = decoded.id;
    if (!userId) {
      return next();
    }

    try {
      const user = await getUserById(userId.toString());

      // Beállítjuk a req.user-t
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };
    } catch (error) {
      // Ha nem találjuk a felhasználót, akkor is továbblépünk
    }

    next();
  } catch (error) {
    // Hiba esetén is továbblépünk
    next();
  }
};

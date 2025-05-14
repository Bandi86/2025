import { Request, Response, NextFunction } from 'express'
import {
  validateInputs,
  validateUsername,
  validateEmail,
  validatePassword
} from '../lib/auth/validation'
import { ApiError } from '../lib/error'
import prisma from '../lib/client'
import { comparePassword } from '../lib/auth/bcrypt'
import { signJwt } from '../lib/auth/jwt'

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, password } = req.body
    // Ellenőrizzük a bemeneti adatokat
    const { valid, errors } = validateInputs(
      { name, password },
      {
        name: validateUsername,
        password: validatePassword
      }
    )
    if (!valid) {
      throw new ApiError(400, 'Invalid input')
    }
    // Ellenőrizzük, hogy a felhasználó létezik-e
    const existingUser = await prisma.user.findFirst({
      where: {
        name: name
      }
    })
    if (!existingUser) {
      throw new ApiError(401, 'Invalid name or password')
    }
    // Ellenőrizzük a jelszót
    const isPasswordValid = await comparePassword(password, existingUser.password)
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid name or password')
    }
    // Jelszó ellenőrzése sikeres
    const user = existingUser
    // Itt lehetne kezelni a bejelentkezést, például JWT token generálásával
    // Vagy session kezelésével, stb.
    const token = signJwt({ id: user.id, name: user.name || undefined })
    // Sütik beállítása (opcionális)
    res.cookie('token', token, {
      httpOnly: true, // Csak HTTP kérésekhez érhető el
      secure: process.env.NODE_ENV === 'production', // Csak HTTPS-en érhető el
      maxAge: 24 * 60 * 60 * 1000, // 1 nap
      sameSite: 'strict' // Csak ugyanazon a domainen érhető el
    })
    // is online beallitasa
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        isOnline: true,
        lastLogin: new Date()
      }
    })
    console.log('Felhasználó bejelentkezett:', user, token)
    // Sikeres bejelentkezés esetén válasz küldése
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin
      }
    })
  } catch (error) {
    // Hiba kezelése
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
}

import { validateInputs } from '../lib/auth/validation'
import { validateUsername, validateEmail, validatePassword } from '../lib/auth/validation'
import { comparePassword, hashPassword } from '../lib/auth/bcrypt'
import { ApiError, UnauthorizedError } from '../lib/error'
import { Request, Response, NextFunction } from 'express'
import { createUser, getUserByEmail } from '../repositories/userRepository'
import { signJwt } from '@/lib/auth/jwt'

// Create a new user
export const createNewUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body
    console.log('createNewUser', req.body)

    // Validate inputs
    const { valid, errors } = validateInputs(
      { username, email, password },
      {
        username: validateUsername,
        email: validateEmail,
        password: validatePassword
      }
    )

    if (!valid) {
      return res.status(400).json({ errors })
    }

    // hash the password
    const hashedPassword = await hashPassword(password)

    // save data to the database
    const user = await createUser({ username, email, password: hashedPassword })

    // give a response without the password
    res.status(201).json({ user: { id: user.id, username: user.username, email: user.email } })
    console.log(user, 'sikeresen regisztrált')
  } catch (error) {
    next(error)
  }
}

// Login user
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }
    // Feltételezzük, hogy van getUserByEmail a repository-ban
    const user = await getUserByEmail(email)
    if (!user) {
      throw new UnauthorizedError('Invalid email or password')
    }
    const valid = await comparePassword(password, user.password)
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password')
    }
    const token = signJwt(user)
    // Ha httpOnly cookie-t használsz, itt beállíthatod a cookie-t
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })
    res.status(200).json({ user: { id: user.id, username: user.username, email: user.email } })
    console.log(user, 'sikeresen bejelentkezett')
  } catch (error) {
    next(error)
  }
}

// Logout user
// Itt csak a cookie törlését kell elvégezni, ha httpOnly cookie-t használsz
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Ha httpOnly cookie-t használsz:
    res.clearCookie('token')
    // Ha frontend oldali token van, csak 200-at küldünk vissza
    res.status(200).json({ message: 'Logout successful' })
    // backend oldali log
    console.log(req.user, 'sikeresen kijelentkezett')
  } catch (error) {
    next(error)
  }
}

// GET ME
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Az authenticate middleware már biztosítja, hogy req.user létezik és tartalmazza a felhasználói adatokat
    // Ha a token érvénytelen vagy hiányzik, az authenticate middleware már 401-es hibát küldött volna.
    if (!req.user) {
      res.clearCookie('token') // vagy a cookie neve, pl. 'authToken'
      throw new UnauthorizedError('Hitelesítés szükséges a felhasználói adatok lekéréséhez.')
    }
    // Csak a szükséges adatokat küldjük vissza, jelszó nélkül
    const { id, username, email } = req.user
    res.status(200).json({ user: { id, username, email } })
    return
  } catch (error) {
    next(error) // Továbbküldjük a hibát a központi hibakezelőnek
  }
}

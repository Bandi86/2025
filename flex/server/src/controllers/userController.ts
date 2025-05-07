import { Request, Response, NextFunction } from 'express'
import * as bcrypt from 'bcrypt'
import { signJwt, verifyJwt } from '../lib/auth/jwt'
import { getDb } from '../db/mediaRepository'
import { validateRegisterInput, validateLoginInput } from '../lib/auth/validateUser'
import { ApiError, NotFoundError, ValidationError, UnauthorizedError } from '../lib/auth/error'
import { log } from 'console'

// Felhasználó keresése ID alapján
export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id
    const db = await getDb()
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) {
      throw new NotFoundError('Felhasználó nem található')
    }
    const { password, ...userWithoutPassword } = user
    res.status(200).json(userWithoutPassword)
  } catch (error) {
    next(error)
  }
}

// User letrehozasa
export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password } = req.body
    const validation = validateRegisterInput({ username, email, password })
    if (!validation.valid) {
      // Részletes validációs hibaüzenet
      throw new ValidationError(validation.message)
    }
    const db = await getDb()
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username])
    if (existingUser) {
      throw new ValidationError('A felhasználónév már foglalt')
    }
    const existingEmail = await db.get('SELECT * FROM users WHERE email = ?', [email])
    if (existingEmail) {
      throw new ValidationError('Az email cím már foglalt')
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    await db.run('INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)', [
      crypto.randomUUID(),
      username,
      email,
      hashedPassword
    ])
    res.status(201).json({ message: 'Felhasználó létrehozva', user: { username, email } })
  } catch (error: any) {
    // Hibák részletes visszaadása
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message })
    } else {
      res.status(500).json({ error: error.message || 'Ismeretlen szerverhiba' })
    }
  }
}

// Felhasználó bejelentkezése
export async function loginUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      throw new ValidationError('Hiányzó kötelező mezők')
    }
    const db = await getDb()
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username])
    if (!user) {
      throw new UnauthorizedError('Hibás felhasználónév vagy jelszó')
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedError('Hibás felhasználónév vagy jelszó')
    }
    const token = signJwt({ id: user.id, username: user.username })
    res.status(200).json({ message: 'Sikeres bejelentkezés', token })
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message })
    } else {
      res.status(500).json({ error: error.message || 'Ismeretlen szerverhiba' })
    }
  }
}

// Felhasználó frissítése
export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id
    const { username, password } = req.body
    if (!username && !password) {
      throw new ValidationError('Legalább egy mezőt meg kell adni frissítéshez')
    }
    const db = await getDb()
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) {
      throw new NotFoundError('Felhasználó nem található')
    }
    let updateFields = []
    let updateValues = []
    if (username) {
      updateFields.push('username = ?')
      updateValues.push(username)
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updateFields.push('password = ?')
      updateValues.push(hashedPassword)
    }
    updateValues.push(userId)
    await db.run(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues)
    res.status(200).json({ message: 'Felhasználó frissítve' })
  } catch (error) {
    next(error)
  }
}

// Felhasználó törlése
export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id
    const db = await getDb()
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) {
      throw new NotFoundError('Felhasználó nem található')
    }
    await db.run('DELETE FROM users WHERE id = ?', [userId])
    res.status(200).json({ message: 'Felhasználó törölve' })
  } catch (error) {
    next(error)
  }
}

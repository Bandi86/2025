import { Request, Response, NextFunction } from 'express'
import * as bcrypt from 'bcrypt'
import { signJwt, verifyJwt } from '../lib/auth/jwt'
import { getDb } from '../db/mediaRepository'
import { validateRegisterInput, validateLoginInput } from '../lib/auth/validateUser'
import { ApiError, NotFoundError, ValidationError, UnauthorizedError } from '../lib/auth/error'

// Felhasználó keresése ID alapján
export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.id
    const db = await getDb()
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) {
      throw new NotFoundError('Felhasználó nem található')
    }
    const { password, ...userWithoutPassword } = user
    res.status(200).json(userWithoutPassword)
    return
  } catch (error) {
    next(error)
  }
}

// User letrehozasa
export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password } = req.body
    const validation = validateRegisterInput({ username, email, password })
    if (!validation.valid) {
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
    return
  } catch (error: any) {
    next(error) // Továbbküldjük a hibát a központi hibakezelőnek
  }
}

// Felhasználó bejelentkezése
export async function loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    // Token beállítása HTTPOnly cookie-ként
    res.cookie('authToken', token, {
      httpOnly: true, // Csak HTTP-n keresztül érhető el, JavaScript nem fér hozzá
      secure: process.env.NODE_ENV === 'production', // HTTPS-en keresztül csak production környezetben
      sameSite: 'lax', // CSRF támadások elleni védelem (lehet 'strict' is)
      maxAge: 24 * 60 * 60 * 1000 // Lejárati idő (pl. 1 nap)
      // path: '/', // Opcionális: a cookie érvényességi útvonala
    })

    // A válaszban már nem küldjük vissza a tokent, de a usert igen (jelszó nélkül)
    const { password: _, ...userWithoutPassword } = user
    res.status(200).json({ message: 'Sikeres bejelentkezés', user: userWithoutPassword })
    return
  } catch (error: any) {
    next(error) // Továbbküldjük a hibát a központi hibakezelőnek
  }
}

// Felhasználó frissítése
export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    return
  } catch (error) {
    next(error)
  }
}

// Felhasználó törlése
export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.id
    const db = await getDb()
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) {
      throw new NotFoundError('Felhasználó nem található')
    }
    await db.run('DELETE FROM users WHERE id = ?', [userId])
    res.status(200).json({ message: 'Felhasználó törölve' })
    return
  } catch (error) {
    next(error)
  }
}

// Felhasználó kijelentkeztetése
export async function logoutUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
      // path: '/', // Győződj meg róla, hogy ugyanazokkal a beállításokkal törlöd, mint amivel létrehoztad
    })
    res.status(200).json({ message: 'Sikeres kijelentkezés' })
    return
  } catch (error) {
    next(error)
  }
}

// Média megjelölése megtekintettként helyett állapot frissítése
export async function markMediaStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { mediaItemId } = req.params
    const { currentTimeSeconds, totalDurationSeconds, isCompleted } = req.body
    const userId = req.user?.id // Felhasználó ID kinyerése a tokenből

    if (!userId) {
      throw new UnauthorizedError('Hitelesítés szükséges')
    }
    if (typeof currentTimeSeconds !== 'number' || typeof isCompleted !== 'boolean') {
      throw new ValidationError(
        'Hiányzó vagy érvénytelen paraméterek: currentTimeSeconds (szám), isCompleted (boolean)'
      )
    }

    const db = await getDb()
    // Ellenőrizzük, hogy a felhasználó és a média létezik-e
    const userExists = await db.get('SELECT id FROM users WHERE id = ?', [userId])
    if (!userExists) {
      throw new NotFoundError('Felhasználó nem található')
    }
    const mediaItem = await db.get('SELECT id FROM media_items WHERE id = ?', [mediaItemId])
    if (!mediaItem) {
      throw new NotFoundError('Média elem nem található')
    }

    // upsertUserMediaStatus használata az állapot mentésére/frissítésére
    await upsertUserMediaStatus(
      userId,
      mediaItemId,
      currentTimeSeconds,
      totalDurationSeconds ?? null, // totalDurationSeconds lehet null
      isCompleted
    )

    res.status(200).json({ message: 'Média állapot frissítve' })
    return
  } catch (error) {
    next(error)
  }
}

// Felhasználó által megtekintett/folyamatban lévő médiák lekérdezése
export async function getUserMediaProgress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id // Felhasználó ID kinyerése a tokenből

    if (!userId) {
      throw new UnauthorizedError('Hitelesítés szükséges')
    }

    const db = await getDb()
    const userExists = await db.get('SELECT id FROM users WHERE id = ?', [userId])
    if (!userExists) {
      // Bár a token érvényes lehet, a user ID nem létezik az adatbázisban
      throw new NotFoundError('Felhasználó nem található az adatbázisban.')
    }

    // getAllUserMediaStatusesWithDetails használata a részletes adatok lekérdezéséhez
    const mediaWithStatus = await getAllUserMediaStatusesWithDetails(userId)

    res.status(200).json(mediaWithStatus)
    return
  } catch (error) {
    next(error)
  }
}

// Új controller funkció a /user/me végponthoz
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Az authenticate middleware már biztosítja, hogy req.user létezik és tartalmazza a felhasználói adatokat
    // Ha a token érvénytelen vagy hiányzik, az authenticate middleware már 401-es hibát küldött volna.
    if (!req.user) {
      // Ennek elvileg nem kellene megtörténnie, ha az authenticate middleware megfelelően működik
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
async function upsertUserMediaStatus(
  userId: string,
  mediaItemId: string,
  currentTimeSeconds: number,
  totalDurationSeconds: number | null,
  isCompleted: boolean
): Promise<void> {
  const db = await getDb()

  // Ellenőrizzük, hogy van-e már meglévő állapot a felhasználó és a média elem között
  const existingStatus = await db.get(
    'SELECT * FROM user_media_status WHERE user_id = ? AND media_item_id = ?',
    [userId, mediaItemId]
  )

  if (existingStatus) {
    // Ha létezik, frissítjük az állapotot
    await db.run(
      `UPDATE user_media_status
       SET current_time_seconds = ?, total_duration_seconds = ?, is_completed = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND media_item_id = ?`,
      [currentTimeSeconds, totalDurationSeconds, isCompleted, userId, mediaItemId]
    )
  } else {
    // Ha nem létezik, beszúrjuk az új állapotot
    await db.run(
      `INSERT INTO user_media_status (user_id, media_item_id, current_time_seconds, total_duration_seconds, is_completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, mediaItemId, currentTimeSeconds, totalDurationSeconds, isCompleted]
    )
  }
}
async function getAllUserMediaStatusesWithDetails(userId: string) {
  const db = await getDb()

  // Lekérdezzük a felhasználó média állapotait részletes adatokkal
  const rows = await db.all(
    `SELECT
       ums.media_item_id AS mediaItemId,
       ums.current_time_seconds AS currentTimeSeconds,
       ums.total_duration_seconds AS totalDurationSeconds,
       ums.is_completed AS isCompleted,
       ums.updated_at AS updatedAt,
       mi.name AS mediaName,
       mi.path AS mediaPath,
       mi.type AS mediaType,
       mi.cover_image_path AS coverImagePath
     FROM user_media_status ums
     INNER JOIN media_items mi ON ums.media_item_id = mi.id
     WHERE ums.user_id = ?
     ORDER BY ums.updated_at DESC`,
    [userId]
  )

  // Az eredményeket átalakítjuk a kívánt formátumra
  return rows.map((row) => ({
    mediaItemId: row.mediaItemId,
    currentTimeSeconds: row.currentTimeSeconds,
    totalDurationSeconds: row.totalDurationSeconds,
    isCompleted: row.isCompleted,
    updatedAt: new Date(row.updatedAt),
    media: {
      name: row.mediaName,
      path: row.mediaPath,
      type: row.mediaType,
      coverImagePath: row.coverImagePath
    }
  }))
}


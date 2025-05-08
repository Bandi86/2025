import { Request, Response, NextFunction } from 'express'
import * as express from 'express'
import * as cors from 'cors'
import * as dotenv from 'dotenv'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import { ApiError } from './lib/error'
import { initDatabase } from './db/database'


// Környezeti változók betöltése
dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// Köztes rétegek
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend címe környezeti változóból vagy alapértelmezett
    credentials: true // Engedélyezi a sütik küldését a cross-origin kéréseknél
  })
)

app.use((req, res, next) => {
  console.log(`Bejövő kérés: ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())

// Főoldal
app.get('/', (_req: Request, res: Response) => {
  res.send('Flex Server is running!')
})

// API végpontok


// 404-es hiba kezelése (opcionális)
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Általános hiba kezelő (mindig a legvégén!)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack) // Hibalogolás a szerver oldalon

  if (err instanceof ApiError) {
    // Ha ApiError, akkor a saját státuszkódját és üzenetét használjuk
    res.status(err.status).json({ error: err.message })
    return // Explicit void return
  }

  // Egyéb, nem kezelt hibák esetén általános 500-as hiba
  res.status(500).json({ error: 'Internal Server Error' })
  return // Explicit void return
})

// Szerver indítása
;(async () => {
  await initDatabase()
  //await startWatchers()
  app.listen(port, () => {
    console.log(`Szerver fut a http://localhost:${port} címen`)
  })
})()
app.use(cookieParser())

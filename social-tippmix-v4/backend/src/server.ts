import { Request, Response, NextFunction } from 'express'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import prisma from './lib/client'
import helmet from 'helmet'
import morgan from 'morgan'
import session from 'express-session'
import rateLimit from 'express-rate-limit'
import passport from './lib/passport'
import { ApiError } from './lib/error'
import { requireAuth } from './middlewares/auth'
import asyncHandler from './lib/asyncHandler'
import userRoutes from './routes/user'
import postRoutes from './routes/post'
import commentRoutes from './routes/comment'
import { globalSearch } from './controllers/search'
import uploadPostImage from './controllers/image/postImage'
import getAllCategories from './controllers/categories/getAllCategories'

// Környezeti változók betöltése
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

// Swagger dokumentáció beállítása
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API dokumentáció',
      version: '1.0.0',
      description: 'Social Tippmix API dokumentáció'
    },
    servers: [
      {
        url: `http://localhost:${PORT}` // vagy a szerver címe
      }
    ]
  },
  apis: [
    './src/routes/*.ts', // Meglévő route fájlok
    './src/swagger-definitions/*.js' // Új Swagger definíciós fájlok
  ]
}
const swaggerDocs = swaggerJsdoc(swaggerOptions)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

// Köztes rétegek
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend címe környezeti változóból vagy alapértelmezett
    credentials: true // Engedélyezi a sütik küldését a cross-origin kéréseknél
  })
)

// Helmet a biztonsági fejlécekhez
app.use(helmet())

// Morgan a HTTP kérés naplózáshoz
app.use(morgan('dev'))

// Express-session beállítása
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'titkoskulcs',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: process.env.SESSION_HTTP_ONLY === 'true',
      sameSite:
        process.env.SESSION_COOKIE_SAMESITE === 'lax' ||
        process.env.SESSION_COOKIE_SAMESITE === 'none' ||
        process.env.SESSION_COOKIE_SAMESITE === 'strict'
          ? (process.env.SESSION_COOKIE_SAMESITE as 'lax' | 'none' | 'strict')
          : 'strict',
      maxAge: process.env.SESSION_COOKIE_MAXAGE
        ? parseInt(process.env.SESSION_COOKIE_MAXAGE, 10)
        : 1000 * 60 * 60 * 24 // 1 nap
    }
  })
)

app.use(passport.initialize())
app.use(passport.session())

// Rate limiter beállítása (pl. 100 kérés 15 perc alatt)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 perc
  max: 100, // maximum 100 kérés
  standardHeaders: true, // RateLimit-* fejlécek
  legacyHeaders: false // X-RateLimit-* fejlécek
})
app.use(limiter)

app.use((req, res, next) => {
  console.log(`Bejövő kérés: ${req.method} ${req.originalUrl}`)
  next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

app.use('/api/user', userRoutes)
app.use('/api/comment', commentRoutes)
app.use('/api/categories', asyncHandler(getAllCategories))
app.use('/api/upload', requireAuth, asyncHandler(uploadPostImage))
app.use('/api/post', postRoutes)
app.get('/api/post-categories', (req, res) => {
  // Prisma enum értékek visszaadása külön endpointon
  const { PostCategory } = require('@prisma/client')
  res.json({ postCategories: Object.values(PostCategory) })
})

app.get('/api/search', asyncHandler(globalSearch))

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
  app.listen(PORT, async () => {
    console.log(`Szerver fut a http://localhost:${PORT} címen`)
    // check the db connenction
    try {
      await prisma.$connect()
      console.log('DB connected successfully!')
    } catch (err) {
      console.error('DB connection error:', err)
    }
  })
})()

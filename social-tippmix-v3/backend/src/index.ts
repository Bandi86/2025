import { Request, Response, NextFunction } from 'express'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import { ApiError } from './lib/error'
import prisma from './lib/client'
import usersRoutes from './routes/usersRoute'
import postsRoutes from './routes/postsRoute'
import { authenticate, authorize } from './middlewares/auth.middleware'

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
  ],
}
const swaggerDocs = swaggerJsdoc(swaggerOptions)

// Köztes rétegek
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend címe környezeti változóból vagy alapértelmezett
    credentials: true // Engedélyezi a sütik küldését a cross-origin kéréseknél
  })
)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.use((req, res, next) => {
  console.log(`Bejövő kérés: ${req.method} ${req.originalUrl}`)
  next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

// Főoldal
app.get('/', (_req: Request, res: Response) => {
  res.send('Tippmix Server is running!')
})

// API végpontok
app.use('/api/user', usersRoutes)
app.use('/api/post', postsRoutes)

// admin route authorization
app.use('/api/admin', authenticate, authorize(['admin']))

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

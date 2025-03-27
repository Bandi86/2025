import { initializeDatabase, getDb, closeDatabase } from './database' // Notice the top-level import
import express, { Request, Response, NextFunction } from 'express'
import 'dotenv/config' // Make sure .env variables are loaded
import usersRouter from './routes/users'



const app = express()
const port = process.env.PORT || 3000

// --- Middleware ---
// Parse JSON request bodies
app.use(express.json())

// Basic logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// --- Routes ---
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the Backend!')
})

// User route
app.get('/api/users',usersRouter)

// --- Global Error Handler ---
// (Add more robust error handling as needed)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

// --- Start Server ---
async function startServer() {
  try {
    await initializeDatabase() // Ensure DB is ready before starting server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1) // Exit if server fails to start
  }
}

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\nReceived ${signal}. Closing database connection...`)
    await closeDatabase()
    console.log('Exiting application.')
    process.exit(0)
  })
})

startServer()

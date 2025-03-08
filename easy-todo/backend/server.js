import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import db from './db/db.js'
import { closeDb } from './db/db.js'

const app = express()
const PORT = 8000

// Middleware to parse JSON bodies
app.use(express.json())

app.use(bodyParser.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb()
  process.exit(0)
})

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`)
})

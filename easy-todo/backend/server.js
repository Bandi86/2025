import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import todoRoutes from './routes/todoRoutes.js'

const app = express()
const PORT = 8000

// Middleware to parse JSON bodies
app.use(express.json())

app.use(bodyParser.json())
app.use(cors())

// Útvonalak
app.use('/api/todos', todoRoutes)

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`)
})

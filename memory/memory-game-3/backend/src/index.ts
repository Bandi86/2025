import express from 'express'
import { middleware } from './middleware'
import 'dotenv/config'
import { db } from './db/connect'

const app = express()
const port = process.env.PORT ?? '9001'

app.get('/', middleware)

// test the db connection
db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error executing query', err.stack)
  } else {
    console.log('Current time:', res.rows[0].now)
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})

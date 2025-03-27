import pg from 'pg'
import 'dotenv/config'



const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: Number(process.env.DBPORT)
})

db
  .connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((err: { stack: any }) => console.error('Connection error', err.stack))

export { db }

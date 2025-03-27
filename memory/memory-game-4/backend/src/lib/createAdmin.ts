import { getDb } from '../database'
import 'dotenv/config'

interface User {
  name: string
  email: string
  password: string
  role: string
}

async function createAdminUser(): Promise<void> {
  try {
    const db = await getDb()
    if (!db) {
      throw new Error('Database not initialized')
    }

    const adminName = process.env.ADMIN_NAME
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminRole = 'admin'

    if (!adminName || !adminEmail || !adminPassword) {
      throw new Error('Admin credentials not configured in environment variables')
    }

    // Check if admin already exists
    const existingAdmin = await new Promise<User | null>((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [adminEmail],
        (err: Error | null, row: User | undefined) => {
          if (err) return reject(err)
          resolve(row || null)
        }
      )
    })

    if (existingAdmin) {
      console.warn('Admin user already exists')
      return
    }

    // create the admin data
    db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [adminName, adminEmail, adminPassword, adminRole],
      (err: Error | null) => {
        if (err) {
          console.error('Failed to create admin user:', err)
          throw err
        }
      }
    )

    console.info('Admin user created successfully')
  } catch (error) {
    console.error('Failed to create admin user:', error)
    throw error
  }
}

export default createAdminUser

import { NextRequest, NextResponse } from 'next/server'
import { authHelpers } from '@/db/config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, email, password } = body

    // Basic validation
    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
    }

    try {
      // Create user in database
      const userId = await authHelpers.createUser(username, email, password)

      return NextResponse.json({ message: 'User registered successfully', userId }, { status: 201 })
    } catch (error: any) {
      // Handle duplicate email
      if (error.message?.includes('UNIQUE constraint failed: users.email')) {
        return NextResponse.json({ message: 'Email already in use' }, { status: 409 })
      }

      throw error
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

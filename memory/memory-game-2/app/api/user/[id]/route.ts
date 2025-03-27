import { NextResponse, NextRequest } from 'next/server'
import db from '@/db/config'
import { User } from '@/types/user'


// get user data by id (protected route)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get token from authorization header
    const token = req.headers
      .get('authorization')
      ?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
    const user = stmt.get(params.id) as unknown as User | undefined

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Don't send password in response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
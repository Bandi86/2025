import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    ;(
      await // Clear the session cookie
      cookies()
    ).set({
      name: 'session_token',
      value: '',
      expires: new Date(0),
      path: '/'
    }),
      (
        await // Clear the JWT cookie
        cookies()
      ).set({
        name: 'jwt',
        value: '',
        expires: new Date(0),
        path: '/'
      })

    return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

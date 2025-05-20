import 'server-only'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose' // Using jose for JWT verification as it's more standard

const JWT_SECRET_KEY = process.env.JWT_SECRET || 'jwt_secret' // Should match backend

export interface UserPayload {
  id: string
  username: string
  role: string
  // Add other fields from your JWT payload if necessary
}

async function verifySession(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value

  if (!token) {
    return null
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET_KEY)
    const { payload } = await jwtVerify<UserPayload>(token, secret)
    return payload
  } catch (error) {
    // console.error('Failed to verify session token:', error) // Keep this for debugging if needed
    return null
  }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  return verifySession()
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

// Helper function to get user ID, useful for server components/actions
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id ?? null
}

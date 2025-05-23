import 'server-only'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose' // Using jose for JWT verification

// Ensure these match backend settings
const JWT_SECRET_KEY = process.env.JWT_SECRET || 'jwt_secret'
const SESSION_COOKIE_NAME = 'session_token'

export interface UserPayload {
  id: string
  username: string
  role: string
  exp?: number
  iat?: number
  // Add other fields from your JWT payload as needed
}

/**
 * Verifies the JWT token from the session cookie and returns the decoded payload
 * This is used in server components only
 */
async function verifySession(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = (await cookieStore).get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const secret = new TextEncoder().encode(JWT_SECRET_KEY)
    const { payload } = await jwtVerify<UserPayload>(token, secret, {
      algorithms: ['HS256'] // Specify the algorithm used to sign the token
    })

    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn('Session token expired')
      return null
    }

    return payload
  } catch (error) {
    console.error('Failed to verify session token:', error)
    return null
  }
}

/**
 * Returns the current user from the session or null if not authenticated
 * For server components only
 */
export async function getCurrentUser(): Promise<UserPayload | null> {
  return verifySession()
}

/**
 * Returns true if user is authenticated, false otherwise
 * For server components only
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Returns the user ID from the session or null if not authenticated
 * For server components only
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id ?? null
}

/**
 * Checks if the current user has the specified role
 * For server components only
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === requiredRole
}

/**
 * Returns true if the current user is an admin
 * For server components only
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('ADMIN')
}

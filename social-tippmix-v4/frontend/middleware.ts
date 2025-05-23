import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

// Configuration
const JWT_SECRET_KEY = process.env.JWT_SECRET || 'jwt_secret'
const SESSION_COOKIE_NAME = 'session_token'

// Routes configuration
const protectedPaths = ['/profile', '/admin', '/create-post', '/dashboard', '/settings']
const authPages = ['/login', '/register', '/forgot-password', '/reset-password']
const publicPaths = ['/', '/about', '/contact', '/posts', '/terms', '/privacy']

// User roles
const ADMIN_ROLE = 'ADMIN'

// Interface for JWT payload
interface UserPayload {
  id: string
  username: string
  role: string
  exp?: number
}

/**
 * Verifies a JWT token and returns the payload if valid
 */
async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET_KEY)
    const { payload } = await jwtVerify<UserPayload>(token, secret, {
      algorithms: ['HS256']
    })

    // Check token expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}

/**
 * The main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets, api routes, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Files like favicon.ico, etc.
  ) {
    return NextResponse.next()
  }

  // Get the session token from cookies
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  let user: UserPayload | null = null

  if (cookieToken) {
    user = await verifyToken(cookieToken)
  }

  const isAuthenticated = !!user

  // Handle protected routes - redirect to login if not authenticated
  if (protectedPaths.some((path) => pathname.startsWith(path)) && !isAuthenticated) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect_to', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Handle auth pages - redirect to home if already authenticated
  if (authPages.some((path) => pathname.startsWith(path)) && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirect_to') || '/'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Handle admin routes - redirect to unauthorized if not admin
  if (pathname.startsWith('/admin') && user?.role !== ADMIN_ROLE) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Matcher to specify which routes the middleware should run on
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
}

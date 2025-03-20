import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Define which routes require authentication
const protectedRoutes = ['/dashboard', '/profile', '/game']
const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Get JWT token from cookies
  const token = request.cookies.get('jwt')?.value
  
  // Check if user is authenticated
  const isAuthenticated = token ? verifyJWT(token) : null

  // Handle protected routes
  if (protectedRoutes.some(route => path.startsWith(route))) {
    if (!isAuthenticated) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirect', path)
      return NextResponse.redirect(url)
    }
  }

  // Prevent authenticated users from accessing auth routes
  if (authRoutes.includes(path) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

function verifyJWT(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch {
    return null
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)'
  ]
}

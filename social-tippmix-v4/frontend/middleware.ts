import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated, getCurrentUser } from '@/lib/auth/session' // Adjusted path

// Add paths that should be protected here
const protectedPaths = ['/profile', '/admin', '/create-post'] // Example protected paths
// Add paths that should only be accessible to unauthenticated users
const authPages = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuth = await isAuthenticated()
  const user = await getCurrentUser()

  // If trying to access a protected path without being authenticated, redirect to login
  if (protectedPaths.some((path) => pathname.startsWith(path)) && !isAuth) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect_to', pathname) // Optionally pass a redirect_to query param
    return NextResponse.redirect(loginUrl)
  }

  // If trying to access login/register page while already authenticated, redirect to home or profile
  if (authPages.some((path) => pathname.startsWith(path)) && isAuth) {
    return NextResponse.redirect(new URL('/', request.url)) // Redirect to homepage
  }

  // Admin route protection
  if (pathname.startsWith('/admin') && user?.role !== 'ADMIN') {
    // Assuming 'ADMIN' is the role name for administrators
    return NextResponse.redirect(new URL('/unauthorized', request.url)) // Or a 403 page
  }

  return NextResponse.next()
}

export const config = {
  // Matcher to specify which routes the middleware should run on.
  // This avoids running middleware on static files, _next directory, etc.
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

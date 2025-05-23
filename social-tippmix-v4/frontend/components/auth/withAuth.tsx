'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/useAuth'

/**
 * withAuth is a higher-order component that protects routes
 * requiring authentication. It automatically redirects to login
 * if the user is not authenticated.
 *
 * @param Component The component to wrap with authentication
 * @param options Configuration options
 * @returns A wrapped component with authentication protection
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAdmin?: boolean
    redirectTo?: string
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isAuthenticated, isLoading, isReady } = useAuth()
    const router = useRouter()

    const { requireAdmin = false, redirectTo = '/login' } = options

    useEffect(() => {
      // Wait until auth is checked
      if (!isReady || isLoading) return

      // Redirect if not authenticated
      if (!isAuthenticated) {
        router.push(`${redirectTo}?redirect_to=${encodeURIComponent(window.location.pathname)}`)
        return
      }

      // Check admin role if required
      if (requireAdmin && user?.role !== 'ADMIN') {
        router.push('/unauthorized')
      }
    }, [isAuthenticated, isLoading, isReady, user, router])

    // Show nothing while checking auth
    if (!isReady || isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      )
    }

    // Show unauthorized message for non-admins if admin is required
    if (requireAdmin && user?.role !== 'ADMIN') {
      return null
    }

    // Show nothing if not authenticated
    if (!isAuthenticated) {
      return null
    }

    // User is authenticated, render the protected component
    return <Component {...props} />
  }
}

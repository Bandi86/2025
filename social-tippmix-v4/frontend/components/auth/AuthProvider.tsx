'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { User } from '@/types/user'

/**
 * AuthProvider initializes the auth state with server-side data and keeps it in sync
 * Use this at the root of your app or layout
 */
export default function AuthProvider({
  user,
  children
}: {
  user?: User | null
  children: React.ReactNode
}) {
  const { setUser, checkAuth } = useAuthStore()

  // Set user data from SSR
  useEffect(() => {
    if (user) {
      setUser(user)
    } else {
      // If no user from SSR, check authentication status
      checkAuth()
    }
  }, [user, setUser, checkAuth])

  // Check auth periodically to refresh user data
  useEffect(() => {
    // Check authentication every 5 minutes
    const interval = setInterval(() => {
      checkAuth()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [checkAuth])

  return <>{children}</>
}

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
  const { setUser } = useAuthStore()

  // Set user data from SSR only once
  useEffect(() => {
    if (user) {
      setUser(user)
    }
  }, [user, setUser])

  // Periodikus checkAuth és minden automatikus checkAuth hívás ELTÁVOLÍTVA

  return <>{children}</>
}

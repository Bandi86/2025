// Custom hook for using authentication in components
import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface LoginCredentials {
  username: string
  password: string
}

export function useAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isReady, setIsReady] = useState(false)

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    clearError,
    checkAuth
  } = useAuthStore()

  // Initialize authentication state on component mount
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth()
      setIsReady(true)
    }

    if (!isReady) {
      initAuth()
    }
  }, [checkAuth, isReady])

  // Enhanced login with redirect
  const loginWithRedirect = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      const success = await login(credentials)
      if (success) {
        const redirectTo = searchParams.get('redirect_to') || '/'
        router.push(redirectTo)
      }
      return success
    },
    [login, router, searchParams]
  )

  // Enhanced logout with redirect
  const logoutWithRedirect = useCallback(async () => {
    await logout()
    router.push('/login')
  }, [logout, router])

  // For protected components
  const requireAuth = useCallback(() => {
    if (isReady && !isLoading && !isAuthenticated) {
      router.push(`/login?redirect_to=${encodeURIComponent(pathname)}`)
    }
  }, [isReady, isLoading, isAuthenticated, router, pathname])

  // For admin-only components
  const requireAdmin = useCallback(() => {
    if (isReady && !isLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect_to=${encodeURIComponent(pathname)}`)
      } else if (user?.role !== 'ADMIN') {
        router.push('/unauthorized')
      }
    }
  }, [isReady, isLoading, isAuthenticated, user, router, pathname])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isReady,
    login: loginWithRedirect,
    logout: logoutWithRedirect,
    register,
    clearError,
    requireAuth,
    requireAdmin
  }
}

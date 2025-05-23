// Custom hook for using authentication in components
import { useCallback } from 'react'
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
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect_to=${encodeURIComponent(pathname)}`)
    }
  }, [isLoading, isAuthenticated, router, pathname])

  // For admin-only components
  const requireAdmin = useCallback(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect_to=${encodeURIComponent(pathname)}`)
      } else if (user?.role !== 'ADMIN') {
        router.push('/unauthorized')
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: loginWithRedirect,
    logout: logoutWithRedirect,
    register,
    clearError,
    requireAuth,
    requireAdmin
  }
}

// Auth store for managing authentication state with Zustand
import { createWithMiddleware } from './middleware'
import { authService, LoginCredentials, RegisterData } from '@/lib/auth/authService'
import { User } from '@/types/user'

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  login: (credentials: LoginCredentials) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
  checkAuth: () => Promise<boolean>
}

export const useAuthStore = createWithMiddleware<AuthState>(
  (set, get) => ({
    // Initial state
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,

    // Set user directly (useful for SSR hydration)
    setUser: (user) =>
      set({
        user,
        isAuthenticated: !!user
      }),

    // Clear any error messages
    clearError: () => set({ error: null }),

    // Login method
    login: async (credentials) => {
      set({ isLoading: true, error: null })
      const result = await authService.login(credentials)
      if (result.success && result.user) {
        set({
          user: result.user,
          isAuthenticated: true,
          isLoading: false
        })
        // Azonnal ellenőrizzük az auth státuszt is
        await get().checkAuth()
        return true
      } else {
        set({
          error: result.message || 'Login failed',
          isLoading: false,
          isAuthenticated: false
        })
        return false
      }
    },

    // Register method
    register: async (data) => {
      set({ isLoading: true, error: null })
      const result = await authService.register(data)
      if (result.success && result.user) {
        set({
          user: result.user,
          isAuthenticated: true,
          isLoading: false
        })
        // Azonnal ellenőrizzük az auth státuszt is
        await get().checkAuth()
      } else {
        set({
          isLoading: false,
          isAuthenticated: false,
          error: result.message || 'Registration failed'
        })
      }
      return result.success
    },

    // Logout method
    logout: async () => {
      set({ isLoading: true })
      await authService.logout()
      set({ user: null, isLoading: false, isAuthenticated: false })
    },

    // Check authentication status
    checkAuth: async () => {
      const result = await authService.getCurrentUser()
      if (result.success && result.user) {
        set({ user: result.user, isAuthenticated: true })
        return true
      } else {
        set({ user: null, isAuthenticated: false })
        return false
      }
    }
  }),
  {
    name: 'auth-store',
    persist: true,
    devtools: true,
    // Only persist specific fields
    partialize: (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated
    })
  }
)

export type { User }

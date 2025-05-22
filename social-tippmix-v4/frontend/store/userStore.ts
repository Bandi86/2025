import { User } from '@/types/user'
import { AdminUser, FetchUsersParams } from '@/types/admin-user'
import axiosClient from '@/lib/axios/axios-config-client'
import { createWithMiddleware } from './middleware'

// Admin-specific types
interface AdminUserState {
  users: AdminUser[]
  totalUsers: number
  totalPages: number
  currentParams: FetchUsersParams
  selectedUser: AdminUser | null
  adminLoading: boolean
  adminError: string | null
}

interface UserStore {
  // User authentication state
  user: User | null
  loading: boolean
  error: string | null

  // Basic user functions
  setUser: (user: User | null) => void
  login: (credentials: { username: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void

  // Admin-specific state
  admin: AdminUserState

  // Admin-specific functions
  fetchAdminUsers: (params: FetchUsersParams) => Promise<void>
  updateAdminUser: (userId: string, userData: Partial<AdminUser>) => Promise<void>
  deleteAdminUser: (userId: string) => Promise<void>
  selectAdminUser: (user: AdminUser | null) => void
  clearAdminError: () => void
}

// Initial admin state
const initialAdminState: AdminUserState = {
  users: [],
  totalUsers: 0,
  totalPages: 0,
  currentParams: { page: 1, limit: 10 },
  selectedUser: null,
  adminLoading: false,
  adminError: null
}

export const useUserStore = createWithMiddleware<UserStore>(
  (set, get) => ({
    // Basic user state
    user: null,
    loading: false,
    error: null,

    // Admin state
    admin: { ...initialAdminState },

    // Basic user methods
    setUser: (user) => set({ user }),
    clearError: () => set({ error: null }),

    login: async (credentials) => {
      set({ loading: true, error: null })
      try {
        const response = await axiosClient.post('/user/login', credentials)
        set({ user: response.data.user, loading: false })
        // Opcionálisan localStorage token kezelés, ha a backend küld tokent
        /*  if (response.data.token) {
          localStorage.setItem('token', response.data.token)
        } */
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Bejelentkezési hiba',
          loading: false
        })
      }
    },

    logout: async () => {
      set({ loading: true })
      try {
        await axiosClient.post('/user/logout')
        // Token törlése, ha van
        localStorage.removeItem('token')
        set({ user: null, loading: false })
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Kijelentkezési hiba',
          loading: false
        })
        // Hiba esetén is töröljük a tokent és a felhasználót
        localStorage.removeItem('token')
        set({ user: null })
      }
    },

    // Admin-specific methods
    fetchAdminUsers: async (params: FetchUsersParams) => {
      const state = get()

      // Update current parameters
      set((state) => ({
        admin: {
          ...state.admin,
          currentParams: params,
          adminLoading: true,
          adminError: null
        }
      }))

      try {
        // Build query string from params
        const queryParams = new URLSearchParams()
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value))
          }
        }

        const response = await axiosClient.get(`/admin/users?${queryParams.toString()}`)
        set((state) => ({
          admin: {
            ...state.admin,
            users: response.data.users,
            totalUsers: response.data.totalUsers,
            totalPages: response.data.totalPages,
            adminLoading: false
          }
        }))
      } catch (error: any) {
        set((state) => ({
          admin: {
            ...state.admin,
            adminError: error.response?.data?.message || error.message || 'Error fetching users',
            adminLoading: false
          }
        }))
      }
    },

    updateAdminUser: async (userId: string, userData: Partial<AdminUser>) => {
      const state = get()

      // Optimistic update
      const updatedUsers = state.admin.users.map((user) =>
        user.id === userId ? { ...user, ...userData } : user
      )

      set((state) => ({
        admin: {
          ...state.admin,
          users: updatedUsers,
          adminLoading: true,
          adminError: null
        }
      }))

      try {
        const response = await axiosClient.put(`/admin/users/${userId}`, userData)

        // Update with server response
        const finalUpdatedUsers = state.admin.users.map((user) =>
          user.id === userId ? { ...user, ...response.data.user } : user
        )

        set((state) => ({
          admin: {
            ...state.admin,
            users: finalUpdatedUsers,
            adminLoading: false,
            // If selectedUser is the updated user, update it too
            selectedUser:
              state.admin.selectedUser?.id === userId
                ? { ...state.admin.selectedUser, ...response.data.user }
                : state.admin.selectedUser
          }
        }))

        return response.data.user
      } catch (error: any) {
        // Revert optimistic update on error
        set((state) => ({
          admin: {
            ...state.admin,
            users: state.admin.users, // Original state is preserved in closure
            adminError: error.response?.data?.message || error.message || 'Error updating user',
            adminLoading: false
          }
        }))
        throw error
      }
    },

    deleteAdminUser: async (userId: string) => {
      const state = get()

      // Optimistic update - remove user from list
      const filteredUsers = state.admin.users.filter((user) => user.id !== userId)

      set((state) => ({
        admin: {
          ...state.admin,
          users: filteredUsers,
          adminLoading: true,
          adminError: null
        }
      }))

      try {
        await axiosClient.delete(`/admin/users/${userId}`)

        // Update total counts after successful deletion
        set((state) => ({
          admin: {
            ...state.admin,
            totalUsers: state.admin.totalUsers - 1,
            adminLoading: false,
            // If selectedUser is the deleted user, clear it
            selectedUser: state.admin.selectedUser?.id === userId ? null : state.admin.selectedUser
          }
        }))
      } catch (error: any) {
        // Revert optimistic update on error
        set((state) => ({
          admin: {
            ...state.admin,
            users: state.admin.users, // Original state is preserved in closure
            adminError: error.response?.data?.message || error.message || 'Error deleting user',
            adminLoading: false
          }
        }))
        throw error
      }
    },

    selectAdminUser: (user: AdminUser | null) => {
      set((state) => ({
        admin: {
          ...state.admin,
          selectedUser: user
        }
      }))
    },

    clearAdminError: () => {
      set((state) => ({
        admin: {
          ...state.admin,
          adminError: null
        }
      }))
    }
  }),
  {
    name: 'user-store',
    persist: true,
    devtools: true,
    // Only persist user data, not loading states or admin data
    partialize: (state) => ({
      user: state.user
      // Don't persist admin data at all to keep it fresh from the server
    })
  }
)

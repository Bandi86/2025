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
    // Admin state
    admin: { ...initialAdminState },

    // Admin-specific methods
    fetchAdminUsers: async (params: FetchUsersParams) => {
      set((state) => ({
        admin: { ...state.admin, adminLoading: true, adminError: null }
      }))
      try {
        const response = await axiosClient.get('/admin/users', { params })
        set((state) => ({
          admin: {
            ...state.admin,
            users: response.data.users,
            totalUsers: response.data.totalUsers,
            totalPages: response.data.totalPages,
            currentParams: params,
            adminLoading: false
          }
        }))
      } catch (error: any) {
        set((state) => ({
          admin: {
            ...state.admin,
            adminError: error.response?.data?.message || error.message || 'Admin user fetch error',
            adminLoading: false
          }
        }))
      }
    },

    updateAdminUser: async (userId, userData) => {
      set((state) => ({
        admin: { ...state.admin, adminLoading: true, adminError: null }
      }))
      try {
        await axiosClient.patch(`/admin/users/${userId}`, userData)
        // Refresh users after update
        await get().fetchAdminUsers(get().admin.currentParams)
      } catch (error: any) {
        set((state) => ({
          admin: {
            ...state.admin,
            adminError: error.response?.data?.message || error.message || 'Admin user update error',
            adminLoading: false
          }
        }))
      }
    },

    deleteAdminUser: async (userId) => {
      set((state) => ({
        admin: { ...state.admin, adminLoading: true, adminError: null }
      }))
      try {
        await axiosClient.delete(`/admin/users/${userId}`)
        // Refresh users after delete
        await get().fetchAdminUsers(get().admin.currentParams)
      } catch (error: any) {
        set((state) => ({
          admin: {
            ...state.admin,
            adminError: error.response?.data?.message || error.message || 'Admin user delete error',
            adminLoading: false
          }
        }))
      }
    },

    selectAdminUser: (user) =>
      set((state) => ({
        admin: { ...state.admin, selectedUser: user }
      })),

    clearAdminError: () =>
      set((state) => ({
        admin: { ...state.admin, adminError: null }
      }))
  }),
  {
    name: 'user-admin-store',
    devtools: true,
    persist: false
  }
)

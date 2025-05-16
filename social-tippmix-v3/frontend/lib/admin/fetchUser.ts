import { User } from '@/types/user'
import axiosInstance from '../axios/axios-config'

// Response type for paginated user list
export interface PaginatedUsers {
  status: string
  results: number
  totalPages: number
  currentPage: number
  data: {
    users: User[]
  }
  message?: string
}

// Fetch a single user by ID
export const fetchUser = async (userId: string) => {
  try {
    const response = await axiosInstance.get<{ data: User }>(`/user/${userId}`)
    return response.data.data
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

// Fetch a single user's full details by ID (SSR-safe, with token)
export const fetchUserDetails = async (userId: string, token?: string) => {
  try {
    let url = `/user/${userId}`
    // SSR fix: if running on server and baseURL is not absolute, prepend process.env.NEXT_PUBLIC_API_URL
    if (typeof window === 'undefined') {
      const base = process.env.NEXT_PUBLIC_API_URL
      if (base && !url.startsWith('http')) {
        url = base.replace(/\/$/, '') + url
      }
    }
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const response = await axiosInstance.get(url, { headers })
    // The backend should return all user fields, including _count, status, etc.
    return response.data.user || response.data.data || response.data
  } catch (error: any) {
    if (error?.response?.status === 404) return null
    throw error
  }
}

// Fetch all users with optional filters, pagination, sorting
export interface FetchUsersParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  role?: string
  isOnline?: boolean
}

export const fetchUsers = async (params: FetchUsersParams = {}, token?: string) => {
  try {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page.toString())
    if (params.limit) query.append('limit', params.limit.toString())
    if (params.sortBy) query.append('sortBy', params.sortBy)
    if (params.sortOrder) query.append('sortOrder', params.sortOrder)
    if (params.search) query.append('search', params.search)
    if (params.role) query.append('role', params.role)
    if (params.isOnline !== undefined) query.append('isOnline', params.isOnline ? 'true' : 'false')

    let url = `/user${query.toString() ? '?' + query.toString() : ''}`

    // SSR fix: if running on server and baseURL is not absolute, prepend process.env.NEXT_PUBLIC_API_URL
    if (typeof window === 'undefined') {
      const base = process.env.NEXT_PUBLIC_API_URL
      if (base && !url.startsWith('http')) {
        url = base.replace(/\/$/, '') + url
      }
    }
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const response = await axiosInstance.get<PaginatedUsers>(url, { headers })
    return response.data
  } catch (error) {
    console.error('Error fetching users:', error)
    return null
  }
}

export default fetchUser

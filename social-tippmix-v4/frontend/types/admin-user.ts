// Types for admin user management

export interface AdminUser {
  id: string
  username: string
  email: string
  role: string // e.g., 'USER', 'ADMIN'
  status: string // e.g., 'active', 'inactive', 'suspended', 'banned'
  isOnline: boolean
  createdAt: string // Or Date object, consider formatting needs
  lastLogin?: string // Or Date object
  updatedAt?: string
  image?: string
  avatar?: string
  bio?: string
  location?: string
  phone?: string
  address?: string
  postalCode?: string
  country?: string
  birthDate?: string
  website?: string
  emailVerified?: boolean
  emailVerifiedAt?: string
  _count?: {
    posts?: number
    comments?: number
    likes?: number
    followers?: number
    following?: number
    sessions?: number
    notifications?: number
    messages?: number
    accounts?: number
  }
}

export interface FetchUsersParams {
  page?: number
  limit?: number
  searchQuery?: string
  roleFilter?: string
  newStatusFilter?: string // e.g., 'active', 'inactive', 'suspended', 'banned'
  sortBy?: string // e.g., 'username_asc', 'createdAt_desc'
}

export interface PaginatedUsersResponse {
  users: AdminUser[]
  totalUsers: number
  totalPages: number
  currentPage: number
}

export interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
  isOnline?: boolean
  lastLogin?: string
  emailVerified?: string
  emailVerifiedAt?: string
  image?: string
  bio?: string
  location?: string
  phone?: string
  address?: string
  postalCode?: string
  country?: string
  birthDate?: string
  website?: string
  createdAt: string
  updatedAt: string
  _count?: {
    posts: number
    comments: number
    likes: number
    followers: number
    following: number
    sessions: number
    notifications: number
    messages: number
    accounts: number
  }
}

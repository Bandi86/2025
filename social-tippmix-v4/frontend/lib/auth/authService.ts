// Authentication service handling API requests
import axiosClient from '@/lib/axios/axios-config-client'
import { User } from '@/types/user'

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
  errors?: Array<{ field: string; message: string } | string>
}

/**
 * Authentication service for handling API requests
 */
export const authService = {
  /**
   * Login a user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axiosClient.post('/user/login', credentials)
      return {
        success: true,
        user: response.data.user,
        message: response.data.message || 'Login successful'
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
        errors: error.response?.data?.errors
      }
    }
  },

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axiosClient.post('/user/register', data)
      return {
        success: true,
        user: response.data.user,
        message: response.data.message || 'Registration successful'
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
        errors: error.response?.data?.errors
      }
    }
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<AuthResponse> {
    try {
      await axiosClient.post('/user/logout')
      return {
        success: true,
        message: 'Logout successful'
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Logout failed'
      }
    }
  },

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const response = await axiosClient.get('/user/me')
      return {
        success: true,
        user: response.data.user,
        message: 'User data retrieved successfully'
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to get user data'
      }
    }
  },

  /**
   * Verify if the user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await this.getCurrentUser()
      return response.success && !!response.user
    } catch (error) {
      return false
    }
  }
}

// Re-export types for easier imports
export type { User }

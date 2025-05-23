// Export all authentication-related functionality
import { authService } from './authService'
import { useAuth } from './useAuth'

// Export types for easier imports
export type { LoginCredentials, RegisterData, AuthResponse } from './authService'

// Export hooks and services
export { useAuth, authService }

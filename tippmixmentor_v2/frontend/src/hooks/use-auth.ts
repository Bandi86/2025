'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { AuthService } from '@/lib/auth';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    clearError,
    setUser,
    initialize,
    debug,
  } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, []); // Remove initialize from dependencies to prevent infinite loop

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiry = async () => {
      const token = AuthService.getCurrentUser();
      if (!token) {
        await refreshToken();
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]); // Remove refreshToken from dependencies to prevent infinite loop

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    clearError,
    debug,

    // Utilities
    isAdmin: user?.role === 'ADMIN',
    isModerator: user?.role === 'MODERATOR' || user?.role === 'ADMIN',
  };
}; 
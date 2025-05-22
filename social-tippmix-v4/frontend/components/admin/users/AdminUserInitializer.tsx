'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store/userStore'
import { AdminUser, FetchUsersParams } from '@/types/admin-user'

interface AdminUserInitializerProps {
  users: AdminUser[]
  totalUsers: number
  totalPages: number
  currentParams: FetchUsersParams
}

/**
 * This component initializes the admin user data in the store
 * from server-side rendered data.
 */
export function AdminUserInitializer({
  users,
  totalUsers,
  totalPages,
  currentParams
}: AdminUserInitializerProps) {
  const setAdmin = useUserStore.setState

  useEffect(() => {
    setAdmin((state) => ({
      admin: {
        ...state.admin,
        users,
        totalUsers,
        totalPages,
        currentParams,
        adminLoading: false
      }
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, totalUsers, totalPages, currentParams])

  return null
}

'use client'

import { useAuth } from '@/lib/auth/useAuth'

export default function LogoutButton() {
  const { logout, isLoading } = useAuth()

  return (
    <button className="btn btn-ghost" onClick={logout} disabled={isLoading}>
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  )
}

'use client'

import { useAuth } from '@/lib/auth/useAuth'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const { logout, isLoading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    window.location.reload()
  }

  return (
    <button className="btn btn-ghost" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  )
}

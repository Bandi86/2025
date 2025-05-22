'use client'

import { useUserStore } from '@/store'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const { logout, loading } = useUserStore()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    // Zustand logout már törli a felhasználót, ezután átirányítunk a login oldalra
    router.push('/login')
  }

  return (
    <button className="btn btn-ghost" onClick={handleLogout} disabled={loading}>
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  )
}

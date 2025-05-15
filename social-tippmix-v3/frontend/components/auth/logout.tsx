'use client'
import { useAuth } from '../../provider/AuthContext'

export default function LogoutButton() {
  const { logout, loading } = useAuth()
  return (
    <button onClick={logout} disabled={loading}>
      Kijelentkezés
    </button>
  )
}

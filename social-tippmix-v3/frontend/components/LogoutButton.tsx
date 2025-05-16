'use client'
import { useAuth } from '../provider/AuthContext'

export default function LogoutButton() {
  const { logout, loading } = useAuth()
  return (
    <button className="btn btn-error btn-sm" onClick={logout} disabled={loading} type="button">
      Kijelentkezés
    </button>
  )
}

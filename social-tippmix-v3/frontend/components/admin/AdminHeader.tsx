'use client'

import Link from 'next/link'
// Assuming useAuth and LogoutButton are also used for admin, or you have admin-specific versions
import { useAuth } from '../../provider/AuthContext'
import LogoutButton from '../auth/logout'

export default function AdminHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="navbar bg-neutral text-neutral-content shadow-lg">
      <div className="navbar-start">
        <Link href="/admin" className="btn btn-ghost text-xl">
          Admin Felület
        </Link>
      </div>
      <div className="navbar-center">
        {/* You can add admin-specific navigation items here if needed */}
        {/* Example:
        <ul className="menu menu-horizontal px-1">
          <li><Link href="/admin/users">Users</Link></li>
          <li><Link href="/admin/settings">Settings</Link></li>
        </ul>
        */}
      </div>
      <div className="navbar-end">
        {loading ? (
          <span className="loading loading-dots loading-md"></span>
        ) : user ? (
          <div className="flex items-center">
            <span className="mr-3">Üdv, Admin: {user.name || 'Felhasználó'}</span>
            <LogoutButton />
          </div>
        ) : (
          <Link href={{ pathname: '/auth', query: { mode: 'login' } }} className="btn btn-ghost">
            Bejelentkezés
          </Link>
        )}
      </div>
    </header>
  )
}

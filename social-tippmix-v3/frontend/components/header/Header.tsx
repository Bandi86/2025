'use client'
import Link from 'next/link'
import { useAuth } from '../../provider/AuthContext'
import LogoutButton from '../auth/logout'

export default function Header() {
  const { user, logout, loading } = useAuth()

  return (
    <header className="navbar bg-primary text-primary-content">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl">
          Social Tippmix
        </Link>
        <Link href="/auth-demo" className="btn btn-ghost">
          Auth példa
        </Link>
        <Link href="/about" className="btn btn-ghost">
          Rólunk
        </Link>
      </div>

      <div className="navbar-end">
        {loading ? (
          <span className="loading loading-spinner"></span>
        ) : user ? (
          <>
            <span className="mr-2">👤 {user.name}</span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href={{ pathname: '/auth', query: { mode: 'login' } }} className="btn btn-ghost">
              Bejelentkezés
            </Link>
            <Link
              href={{ pathname: '/auth', query: { mode: 'register' } }}
              className="btn btn-ghost"
            >
              Regisztráció
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

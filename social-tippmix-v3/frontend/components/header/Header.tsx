'use client'
import Link from 'next/link'
import { useAuth } from '../../provider/AuthContext'
import LogoutButton from '../auth/logout'

export default function Header() {
  const { user, logout, loading } = useAuth()

  return (
    <header style={{ borderBottom: '1px solid #eee', marginBottom: 24, padding: '12px 0' }}>
      <nav
        style={{ display: 'flex', alignItems: 'center', gap: 24, maxWidth: 900, margin: '0 auto' }}
      >
        <Link href="/">Főoldal</Link>
        <Link href="/auth-demo">Auth példa</Link>
        <Link href="/about">Rólunk</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          {loading ? (
            <span>Betöltés...</span>
          ) : user ? (
            <>
              <span>👤 {user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href={{ pathname: '/auth', query: { mode: 'login' } }}>Bejelentkezés</Link>
              <Link href={{ pathname: '/auth', query: { mode: 'register' } }}>Regisztráció</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

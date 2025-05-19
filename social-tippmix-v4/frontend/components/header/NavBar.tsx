import Link from 'next/link'
import React from 'react'
import LogoutButton from '../auth/LogoutButton'
import { useUser } from '@/context/UserContext'

const NavBar = () => {
  const context = useUser()
  if (!context) return null
  const { user, loading, error } = context
  return (
    <>
      {loading ? (
        <span className="loading loading-spinner"></span>
      ) : error ? (
        <span className="alert alert-error">{error}</span>
      ) : user ? (
        <>
          <span className="mr-2">👤 {user.username}</span>
          <Link href="/profile" className="btn btn-ghost">
            Profil
          </Link>
          {user.role === 'admin' && (
            <Link href="/admin" className="btn btn-ghost">
              Admin
            </Link>
          )}
          <LogoutButton />
        </>
      ) : (
        <>
          <Link href={{ pathname: '/auth', query: { mode: 'login' } }} className="btn btn-ghost">
            Bejelentkezés
          </Link>
          <Link href={{ pathname: '/auth', query: { mode: 'register' } }} className="btn btn-ghost">
            Regisztráció
          </Link>
        </>
      )}
    </>
  )
}

export default NavBar

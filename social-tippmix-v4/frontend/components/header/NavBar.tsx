'use client'

import Link from 'next/link'
import React from 'react'
import LogoutButton from '../auth/LogoutButton'
import { useAuthStore } from '@/store/authStore'

const NavBar = () => {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <>
      {isAuthenticated && user ? (
        <>
          <span className="mr-2">👤 {user.username}</span>
          <Link href="/profile" className="btn btn-ghost">
            Profil
          </Link>
          {user.role === 'ADMIN' && (
            <Link href="/admin" className="btn btn-ghost">
              Admin
            </Link>
          )}
          <LogoutButton />
        </>
      ) : (
        <>
          <Link href="/login" className="btn btn-ghost">
            Bejelentkezés
          </Link>
          <Link href="/register" className="btn btn-ghost">
            Regisztráció
          </Link>
        </>
      )}
    </>
  )
}

export default NavBar

import Link from 'next/link'
import React from 'react'
import LogoutButton from '../auth/LogoutButton'
import { getCurrentUser } from '@/lib/auth/session'

const NavBar = async () => {
  const user = await getCurrentUser()

  return (
    <>
      {user ? (
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

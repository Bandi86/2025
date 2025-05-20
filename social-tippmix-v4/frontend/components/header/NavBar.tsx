import Link from 'next/link'
import React from 'react'
import LogoutButton from '../auth/LogoutButton'
import type { UserPayload } from '@/lib/auth/session' // Import UserPayload type

interface NavBarProps {
  user: UserPayload | null
}

const NavBar = ({ user }: NavBarProps) => {
 
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

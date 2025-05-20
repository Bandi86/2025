import Link from 'next/link'
import React from 'react'
import NavBar from './NavBar'
import type { UserPayload } from '@/lib/auth/session' // Import UserPayload type

interface HeaderProps {
  user: UserPayload | null
}

const Header = ({ user }: HeaderProps) => {
  return (
    <header className="navbar bg-primary text-primary-content">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl">
          Social Tippmix
        </Link>
        <Link href="/" className="btn btn-ghost">
          Napi tipp
        </Link>
        <Link href="/about" className="btn btn-ghost">
          Rólunk
        </Link>
      </div>

      <div className="navbar-end">
        <NavBar user={user} />
      </div>
    </header>
  )
}

export default Header

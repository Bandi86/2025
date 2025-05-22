import Link from 'next/link'
import React from 'react'
import NavBar from './NavBar'

const Header = () => {
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
        <NavBar />
      </div>
    </header>
  )
}

export default Header

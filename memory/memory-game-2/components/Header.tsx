'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserData {
  username: string
  email: string
}

const Header = () => {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Function to get user data from localStorage
  const getUserFromStorage = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        } catch (error) {
          console.error('Error parsing user data:', error)
          localStorage.removeItem('user')
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    getUserFromStorage()
  }, [])

  // Setup storage event listener for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = () => {
      getUserFromStorage()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }

  if (loading) {
    return (
      <header className="shadow-md tracking-wide relative z-50">
        <section className="py-2 bg-[#007bff] text-white text-right px-10">
          <p className="text-sm">Loading...</p>
        </section>
      </header>
    )
  }

  return (
    <header className="shadow-md tracking-wide relative z-50">
      <section className="py-2 bg-[#007bff] text-white text-right px-10">
        <p className="text-sm">
          <span className="mx-3 font-semibold">Hello:</span>
          {!user ? 'Guest' : user.username} {user && `- ${user.email}`}
          {user ? (
            <span
              className="ml-3 font-semibold cursor-pointer hover:text-gray-200"
              onClick={handleLogout}
            >
              Logout
            </span>
          ) : (
            <span className="inline-flex gap-3">
              <Link href="/login" className="font-semibold hover:text-gray-200">
                Login
              </Link>
              <Link href="/register" className="font-semibold hover:text-gray-200">
                Register
              </Link>
            </span>
          )}
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-center gap-4 px-10 py-3 bg-slate-800 text-white min-h-20">
        <Link href="/" className="text-xl font-bold">
          Memory Game
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className="hover:text-red-300 text-white font-medium">
            Home
          </Link>
          {user && (<>
            <Link href="/dashboard" className="hover:text-red-300 text-white font-medium">
              Play Game
            </Link>
            <Link href="/profile" className="hover:text-red-300 text-white font-medium">
              Profile
            </Link>
          </>)}
        </nav>
      </div>
    </header>
  )
}

export default Header

import Link from 'next/link'
import UserNav from './UserNav'
import { cookies } from 'next/headers'

export default async function Navbar() {
  // check user cookie
  const cookieStore = await cookies()
  const user = cookieStore.get('user')

  return (
    /* A 'rebeccapurple' lecserélve a sötétebb HSL értékre */
    <nav className="bg-[linear-gradient(to_bottom_right,lightskyblue,hsl(270_60%_15%),sandybrown)] border-b sticky top-0 z-50 w-full">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 text-white">
        <Link href="/" className="text-2xl font-bold">
          bandi<span className="text-blue-600">mix</span>
        </Link>

        <ul className="hidden md:flex gap-8 black font-bold text-xl">
          <li>
            <Link href="/" className="hover:text-gray-300 transition-colors">
              Kezdőlap
            </Link>
          </li>
          <li>
            <Link href="/free" className="hover:text-gray-300 transition-colors">
              Ingyenes Tippek
            </Link>
          </li>
          <li>
            <Link href="/premium" className="hover:text-gray-300 transition-colors">
              Premium tippek
            </Link>
          </li>
          <li>
            <Link href="/subscribe" className="hover:text-gray-300 transition-colors">
              Előfizetés
            </Link>
          </li>
          <li>
            <Link href="/stats" className="hover:text-gray-300 transition-colors">
              Statisztika
            </Link>
          </li>
        </ul>
        {/* Menu for logged in users */}
        {!user ? (
          <div className="flex gap-4">
            <span className="text-white font-medium cursor-pointer hover:text-gray-300 transition-colors">
             Regisztráció
            </span>
            <span className="text-white font-medium cursor-pointer hover:text-gray-300 transition-colors">
              Belépés
            </span>
          </div>
        ) : (
          <UserNav />
        )}

        <div className="md:hidden">
          {/* Mobile menu button placeholder */}

          <button className="p-2 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50">
            <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}

import Link from 'next/link'
import UserNav from './UserNav'
import { cookies } from 'next/headers'

export default async function Navbar() {
  // check user cookie
  const cookieStore = await cookies();
  const user = cookieStore.get('user');

  return (
    <nav className="bg-white/80 backdrop-blur border-b sticky top-0 z-50 w-full">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-bold text-gray-900">
          bandi<span className="text-blue-600">mix</span>
        </Link>
        <ul className="hidden md:flex gap-8 text-gray-700 font-medium">
          <li>
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
          </li>
          <li>
            <Link href="/about" className="hover:text-blue-600 transition-colors">
              About
            </Link>
          </li>
          <li>
            <Link href="/blog" className="hover:text-blue-600 transition-colors">
              Blog
            </Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">
              Contact
            </Link>
          </li>
        </ul>
        {/* Menu for logged in users */}
        {!user ? (
          <div className='flex gap-4'>
            <span className="text-black font-medium cursor-pointer hover:text-blue-600 transition-colors">Register</span>
            <span className="text-black font-medium cursor-pointer hover:text-blue-600 transition-colors">Login</span>
          </div>
        ) : (
          <UserNav />
        )}

        <div className="md:hidden">
          {/* Mobile menu button placeholder */}
          <button className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  );
}

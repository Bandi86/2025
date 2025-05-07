'use client'
import Link from 'next/link'
import SearchBar from './SearchBar'
import { useUser } from '@/app/UserContext'
import React, { useEffect, useState } from 'react'

export default function Header() {
  const { user, logout } = useUser()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="bg-base-100 shadow-lg sticky top-0 z-10 border-b border-base-300">
      <div className="navbar container mx-auto px-4">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <Link href="/">Főoldal</Link>
              </li>
              <li>
                <Link href="/filmek">Filmek</Link>
              </li>
              <li>
                <Link href="/sorozatok">Sorozatok</Link>
              </li>
              <li>
                <Link href="/beallitasok">Beállítások</Link>
              </li>
            </ul>
          </div>
          <Link href="/" className="btn btn-ghost font-poppins text-xl normal-case">
            <span className="text-primary font-bold">Flex</span>
            <span className="font-medium">Media</span>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal">
            <li>
              <Link className="rounded-lg font-medium transition-colors hover:bg-base-200" href="/">
                Főoldal
              </Link>
            </li>
            <li>
              <Link
                className="rounded-lg font-medium transition-colors hover:bg-base-200"
                href="/filmek"
              >
                Filmek
              </Link>
            </li>
            <li>
              <Link
                className="rounded-lg font-medium transition-colors hover:bg-base-200"
                href="/sorozatok"
              >
                Sorozatok
              </Link>
            </li>
            <li>
              <Link
                className="rounded-lg font-medium transition-colors hover:bg-base-200"
                href="/beallitasok"
              >
                Beállítások
              </Link>
            </li>
            {!user && (
              <>
                <li>
                  <Link
                    className="rounded-lg font-medium transition-colors hover:bg-base-200"
                    href="/auth/?register"
                  >
                    Regisztráció
                  </Link>
                </li>
                <li>
                  <Link
                    className="rounded-lg font-medium transition-colors hover:bg-base-200"
                    href="/auth/?login"
                  >
                    Bejelentkezés
                  </Link>
                </li>
              </>
            )}
            {user && (
              <>
                <li>
                  <Link
                    className="rounded-lg font-medium transition-colors hover:bg-base-200"
                    href="/profile"
                  >
                    Profil
                  </Link>
                </li>
                <li>
                  <button
                    className="rounded-lg font-medium transition-colors hover:bg-base-200"
                    onClick={logout}
                  >
                    Kijelentkezés
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="navbar-end gap-3">
          <div className="hidden sm:block">
            {/* Asztali keresősáv */}
            {user && <SearchBar />}
          </div>
          <div className="navbar-end gap-2">
            <button
              className="btn btn-circle text-xl bg-base-200 hover:bg-base-300 transition-colors"
              aria-label="Sötét/Világos téma váltás"
              onClick={() => {
                const html = document.documentElement
                if (html.getAttribute('data-theme') === 'dim') {
                  html.setAttribute('data-theme', 'winter')
                  localStorage.setItem('theme', 'winter')
                } else {
                  html.setAttribute('data-theme', 'dim')
                  localStorage.setItem('theme', 'dim')
                }
              }}
            >
              <span className="sr-only">Téma váltás</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-7 h-7 text-yellow-400 dark:text-gray-200"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobil keresősáv */}
      <div className="sm:hidden px-4 pb-3">{user && <SearchBar isMobile={true} />}</div>
    </div>
  )
}

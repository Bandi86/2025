'use client'

import Link from 'next/link'
import { useUserStore } from '@/store'

export default function AdminHeader() {
  // A user adatokat a Zustand store-ból olvassuk
  const user = useUserStore((state) => state.user)

  return (
    <header className="bg-gray-800 text-white p-4 fixed w-full top-0 left-0 h-16 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/admin" className="text-xl font-bold">
          Admin Panel
        </Link>
        <div className="flex items-center gap-4">
          {/* DaisyUI theme switcher */}
          <input
            type="checkbox"
            value="dark"
            className="toggle theme-controller"
            aria-label="Sötét/világos mód váltása"
            title="Sötét/világos mód váltása"
          />
          {user ? <span>Welcome, {user.username} (Admin)</span> : <span>Loading user...</span>}
        </div>
      </div>
    </header>
  )
}

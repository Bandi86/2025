import { UserPayload } from '@/lib/auth/session'
import Link from 'next/link'

interface AdminHeaderProps {
  user: UserPayload | null
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="bg-gray-800 text-white p-4 fixed w-full top-0 left-0 h-16 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/admin" className="text-xl font-bold">
          Admin Panel
        </Link>
        <div>
          {user ? <span>Welcome, {user.username} (Admin)</span> : <span>Loading user...</span>}
          {/* Add logout button or other admin-specific header items here */}
        </div>
      </div>
    </header>
  )
}

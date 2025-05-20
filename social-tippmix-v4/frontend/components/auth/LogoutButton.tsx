'use client'

import { logoutUser } from '@/lib/actions'
import { useTransition } from 'react'

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  const handleLogout = async () => {
    startTransition(async () => {
      await logoutUser()
      // For now, we rely on middleware to redirect, or a page refresh
      window.location.href = '/login' // Force a reload to ensure middleware and layout re-render
    })
  }

  return (
    <button className="btn btn-ghost" onClick={handleLogout} disabled={isPending}>
      {isPending ? 'Logging out...' : 'Logout'}
    </button>
  )
}

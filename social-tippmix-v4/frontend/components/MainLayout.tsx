'use client'

import { usePathname } from 'next/navigation'
import Header from './header/Header'
import React from 'react'
import type { UserPayload } from '@/lib/auth/session' // Import UserPayload

interface MainLayoutContentProps {
  children: React.ReactNode
  user: UserPayload | null // Add user prop
}

export default function MainLayoutContent({ children, user }: MainLayoutContentProps) {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith('/admin')

  return (
    <>
      {!isAdminPage && <Header user={user} />}
      {/* Pass user to Header */}
      {children}
    </>
  )
}

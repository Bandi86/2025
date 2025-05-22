'use client'

import { usePathname } from 'next/navigation'
import Header from './header/Header'
import React from 'react'
import { useUserStore } from '@/store'

interface MainLayoutContentProps {
  children: React.ReactNode
}

export default function MainLayoutContent({ children }: MainLayoutContentProps) {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith('/admin')
  // A user adatokat már a Zustand store-ból olvassuk, nem propként kapjuk
  const user = useUserStore((state) => state.user)

  return (
    <>
      {!isAdminPage && <Header />} {/* Már nem kell átadni a user prop-ot */}
      {children}
    </>
  )
}

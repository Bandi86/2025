'use client'

import { usePathname } from 'next/navigation'
import Header from './header/Header'
import React from 'react'

export default function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith('/admin')

  return (
    <>
      {!isAdminPage && <Header />}
      {children}
    </>
  )
}

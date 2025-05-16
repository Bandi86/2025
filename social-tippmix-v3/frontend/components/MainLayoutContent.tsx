'use client'

import { usePathname } from 'next/navigation'
import Header from './header/Header' // Assuming this is the path to your main Header
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

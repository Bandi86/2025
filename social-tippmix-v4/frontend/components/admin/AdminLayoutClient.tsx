'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { useAuthStore } from '@/store/authStore'

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push(user ? '/' : '/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="ml-3">Betöltés...</span>
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <div className="flex flex-1 pt-16">
        <AdminSidebar />
        <main className="flex-1 p-4 ml-64">{children}</main>
      </div>
    </div>
  )
}

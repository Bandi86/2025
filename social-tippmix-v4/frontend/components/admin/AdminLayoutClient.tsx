'use client'

import { useUserStore } from '@/store/userStore'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminSidebar from '@/components/admin/AdminSidebar'

// Ez a komponens már csak kliens oldalon fog futni az admin oldalakon
export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading, admin } = useUserStore()
  const router = useRouter()

  useEffect(() => {
    // Ha betöltött és nincs bejelentkezve vagy nem admin, átirányítjuk
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push(user ? '/' : '/login')
    }
  }, [user, loading, router])

  // Amíg töltődik, addig loading-ot mutatunk
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="ml-3">Betöltés...</span>
      </div>
    )
  }

  // Ha nem admin, szintén nem mutatjuk a tartalmat
  if (!user || user.role !== 'ADMIN') {
    return null
  }

  // Admin esetén mutatjuk a teljes admin felületet
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <div className="flex flex-1 pt-16">
        <AdminSidebar />
        <main className="flex-1 p-4 ml-64">
          {admin.adminError && <div className="alert alert-error mb-4">{admin.adminError}</div>}
          {children}
        </main>
      </div>
    </div>
  )
}

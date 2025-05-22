'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store'

/**
 * Higher Order Component, amely biztosítja, hogy csak bejelentkezett felhasználók
 * férhetnek hozzá a védett komponensekhez
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return function ProtectedComponent(props: P) {
    const router = useRouter()
    const { user, loading } = useUserStore()

    useEffect(() => {
      // Ha nem tölt már és nincs user, átirányítunk a login oldalra
      if (!loading && !user) {
        router.push('/login')
      }
    }, [user, loading, router])

    // Amíg tölt vagy még nincs eldöntve, hogy be van-e jelentkezve a user, addig loading-ot mutatunk
    if (loading || !user) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    // Ha be van jelentkezve, megjelenítjük a komponenst
    return <Component {...props} />
  }
}

/**
 * Higher Order Component, amely biztosítja, hogy csak admin felhasználók
 * férhetnek hozzá az admin komponensekhez
 */
export function withAdminAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return function AdminProtectedComponent(props: P) {
    const router = useRouter()
    const { user, loading } = useUserStore()

    useEffect(() => {
      // Ha nem tölt már és nincs user vagy nem admin, átirányítunk
      if (!loading && (!user || user.role !== 'admin')) {
        router.push(user ? '/' : '/login')
      }
    }, [user, loading, router])

    // Amíg tölt vagy még nincs eldöntve, hogy admin-e a user, addig loading-ot mutatunk
    if (loading || !user || user.role !== 'admin') {
      return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    // Ha be van jelentkezve és admin, megjelenítjük a komponenst
    return <Component {...props} />
  }
}

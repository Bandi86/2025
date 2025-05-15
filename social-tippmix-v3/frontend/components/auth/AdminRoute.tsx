'use client'
import { useAuth } from '../../provider/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.name !== 'admin')) {
      router.replace('/') // vagy pl. '/403'
    }
  }, [user, loading, router])

  if (loading || !user) return null // vagy loader

  if (user.name !== 'admin') return null

  return <>{children}</>
}

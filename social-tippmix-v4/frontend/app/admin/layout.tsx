import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  // Csak a szerveroldali alap ellenőrzés - a részletes ellenőrzést a kliens végzi
  if (!user) {
    redirect('/login')
  }

  return (
    <>
      {/* A tényleges admin layout ellenőrzés és megjelenítés már kliensoldali */}
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </>
  )
}

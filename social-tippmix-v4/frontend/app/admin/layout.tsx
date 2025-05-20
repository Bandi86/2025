import { getCurrentUser, UserPayload } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'ADMIN') {
    // If you have a specific login page for admins or a general unauthorized page, redirect there.
    // For now, redirecting to home if not an admin.
    redirect('/')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader user={user} /> {/* Pass user to AdminHeader if needed */}
      <div className="flex flex-1 pt-16">
        {' '}
        {/* Added pt-16 assuming header is fixed and has height of h-16 (64px) */}
        <AdminSidebar />
        <main className="flex-1 p-4 ml-64">
          {' '}
          {/* Added ml-64 assuming sidebar has width of w-64 (256px) */}
          {children}
        </main>
      </div>
    </div>
  )
}

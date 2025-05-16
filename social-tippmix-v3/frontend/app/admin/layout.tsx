import AdminHeader from '../../components/admin/AdminHeader'
import AdminSidebar from '../../components/admin/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-base-100 text-base-content">
      <AdminHeader />
      <div className="flex flex-grow">
        <AdminSidebar />
        <main className="flex-grow p-6 bg-base-200">
          {/* Page content here */}
          {children}
        </main>
      </div>
      <footer className="footer footer-center p-4 bg-base-300 text-base-content">
        <aside>
          <p>Copyright © 2025 - Minden jog fenntartva - Social Tippmix Admin</p>
        </aside>
      </footer>
    </div>
  )
}

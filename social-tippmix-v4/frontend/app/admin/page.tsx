import AdminDashboardPanel from '@/components/admin/AdminDashboardPanel'

export default function AdminPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-primary">Admin Dashboard</h1>
      <p className="mb-6 text-base-content/70">
        Üdvözlünk az admin felületen! Itt gyors áttekintést kapsz a legfontosabb statisztikákról és
        műveletekről.
      </p>
      <AdminDashboardPanel />
    </div>
  )
}

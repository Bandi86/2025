import Link from 'next/link'

const AdminDashboardPanel = () => (
  <div className="card bg-base-100 shadow-xl p-6 flex flex-col gap-4">
    <h2 className="card-title text-xl">Admin műveletek</h2>
    <div className="flex flex-col gap-2">
      <Link href="/admin/posts/create-post">
        <button className="btn btn-primary w-full">Új poszt létrehozása</button>
      </Link>
      {/* Itt lehet további admin linkeket is elhelyezni */}
    </div>
  </div>
)

export default AdminDashboardPanel

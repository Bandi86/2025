import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <div className="stats stats-vertical md:stats-horizontal shadow w-full">
          <div className="stat">
            <div className="stat-title">Felhasználók</div>
            <div className="stat-value">Összesen</div>
            {/* Ide kerülhet dinamikus user count */}
          </div>
          <div className="stat">
            <div className="stat-title">Posztok</div>
            <div className="stat-value">Összesen</div>
            {/* Ide kerülhet dinamikus post count */}
          </div>
          <div className="stat">
            <div className="stat-title">Előfizetők</div>
            <div className="stat-value">Összesen</div>
            {/* Ide kerülhet dinamikus paid user count */}
          </div>
        </div>
        <div className="alert alert-info mt-4">
          <span>Üdvözlünk az admin felületen! Válassz a bal oldali menüből.</span>
        </div>
      </div>
    </AdminLayout>
  );
}

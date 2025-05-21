import AdminDashboardPanel from "@/components/admin/AdminDashboardPanel";

// filepath: c:\Users\bandi\Documents\code\2025\social-tippmix-v4\frontend\app\admin\page.tsx
export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p>Welcome to the admin area. Select an option from the sidebar to get started.</p>
      {/* Add dashboard widgets or summaries here */}
      <AdminDashboardPanel />
    </div>
  )
}

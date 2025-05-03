import AdminLayout from '@/components/admin/AdminLayout';
import AdminUserList from '@/components/admin/AdminUserList';

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <AdminUserList />
    </AdminLayout>
  );
}

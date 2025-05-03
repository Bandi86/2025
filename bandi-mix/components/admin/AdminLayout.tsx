import React from 'react';
import AdminNavbar from '@/components/admin/AdminNavbar';
import Link from 'next/link';

const adminMenu = [
  { href: '/admin/users', label: 'Felhasználók' },
  { href: '/admin/posts', label: 'Posztok' },
  { href: '/admin/stats', label: 'Statisztika' },
];

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <AdminNavbar />
      <div className="flex flex-1">
        <aside className="w-56 bg-base-200 border-r border-base-300 hidden md:block">
          <ul className="menu p-4 gap-2">
            {adminMenu.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="menu-item">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;

'use client';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import LogoutButton from '@/components/LogoutButton';

const AdminNavbar: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="navbar bg-base-200 shadow-md px-4">
      <div className="navbar-start">
        <Link href="/admin" className="btn btn-ghost text-xl font-bold">
          Admin
        </Link>
      </div>
      <div className="navbar-center">
        <span className="text-base font-semibold hidden sm:inline">
          bandi<span className="text-primary">mix</span> admin
        </span>
      </div>
      <div className="navbar-end gap-2">
        {user && (
          <div className="flex items-center gap-2">
            <div className="avatar">
              <div className="w-8 rounded-full">
                <img src={user.avatar || 'https://picsum.photos/200/200'} alt="avatar" />
              </div>
            </div>
            <span className="font-medium text-sm max-w-[8rem] truncate">{user.username}</span>
            <div className="join">
              <LogoutButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNavbar;

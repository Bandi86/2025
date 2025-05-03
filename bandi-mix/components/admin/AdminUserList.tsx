'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  isPaid: boolean;
}

const AdminUserList: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Hiba a lekérdezéskor');
        return res.json();
      })
      .then(setUsers)
      .catch(() => setError('Nincs jogosultság vagy hiba történt.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return <div className="alert alert-error mt-4">Csak admin bejelentkezéssel elérhető!</div>;
  }

  return (
    <div className="overflow-x-auto mt-6">
      <h2 className="text-2xl font-bold mb-4">Felhasználók</h2>
      {loading ? (
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Név</th>
              <th>Email</th>
              <th>Admin</th>
              <th>Előfizető</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  {u.isAdmin ? (
                    <span className="badge badge-success badge-sm">admin</span>
                  ) : (
                    <span className="badge badge-neutral badge-sm">user</span>
                  )}
                </td>
                <td>
                  {u.isPaid ? (
                    <span className="badge badge-primary badge-sm">igen</span>
                  ) : (
                    <span className="badge badge-neutral badge-sm">nem</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUserList;

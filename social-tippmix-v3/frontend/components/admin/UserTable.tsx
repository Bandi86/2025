// UserTable.tsx
import Link from 'next/link'
import { formatDate } from '@/lib/utils/date'

export interface UserTableProps {
  users: Array<any>
  page: number
  totalPages: number
}

export default function UserTable({ users, page, totalPages }: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="table table-zebra table-md">
        <thead>
          <tr>
            <th>Név (Részletek)</th>
            <th>Email</th>
            <th>Szerepkör</th>
            <th>Státusz</th>
            <th>Utolsó Belépés</th>
            <th>Regisztrált</th>
            <th>Online</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <Link href={`/admin/users/${user.id}`} className="link link-primary">
                  {user.name || 'N/A'}
                </Link>
              </td>
              <td>{user.email}</td>
              <td>
                <span
                  className={`badge badge-sm ${
                    user.role === 'ADMIN' ? 'badge-error' : 'badge-success'
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td>
                <span
                  className={`badge badge-sm ${
                    user.status === 'ACTIVE' ? 'badge-info' : 'badge-warning'
                  }`}
                >
                  {user.status || 'N/A'}
                </span>
              </td>
              <td>{formatDate(user.lastLogin)}</td>
              <td>{formatDate(user.createdAt)}</td>
              <td>
                {user.isOnline ? (
                  <span className="badge badge-success badge-sm">Igen</span>
                ) : (
                  <span className="badge badge-neutral badge-sm">Nem</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

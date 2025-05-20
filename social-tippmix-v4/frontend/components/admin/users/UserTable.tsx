'use client'

import { AdminUser } from '@/lib/admin/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, Edit2, Trash2 } from 'lucide-react'
import DeleteUserModal from './DeleteUserModal'
import { formatDateTimeHU } from '@/lib/format/date'

interface UserTableProps {
  users: AdminUser[]
}

export default function UserTable({ users }: UserTableProps) {
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'secondary'
      case 'suspended':
        return 'warning'
      case 'banned':
        return 'error'
      default:
        return 'neutral'
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table w-full">
          <thead className="bg-base-200">
            <tr>
              <th className="p-4">Username</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
              <th className="p-4">Last Login</th>
              <th className="p-4">Online</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-base-100/50">
                <td className="p-4">{user.username}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.role}</td>
                <td className="p-4">
                  <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                </td>
                <td className="p-4">{formatDate(user.createdAt)}</td>
                <td className="p-4">{formatDateTimeHU(user.lastLogin)}</td>
                <td className="p-4">
                  {user.isOnline ? (
                    <span
                      className="inline-block w-3 h-3 rounded-full bg-success mr-2 align-middle"
                      title="Online"
                    ></span>
                  ) : (
                    <span
                      className="inline-block w-3 h-3 rounded-full bg-error mr-2 align-middle"
                      title="Offline"
                    ></span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="ghost" dSize="sm" isSquare title="View User">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </Link>
                    <Link href={`/admin/users/${user.id}/edit`}>
                      <Button variant="ghost" dSize="sm" isSquare title="Edit User">
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      dSize="sm"
                      isSquare
                      title="Delete User"
                      onClick={() => setUserToDelete(user)}
                      className="hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          isOpen={Boolean(userToDelete)}
          onClose={() => setUserToDelete(null)}
        />
      )}
    </>
  )
}

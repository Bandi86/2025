'use client'

import { useState } from 'react'
import { AdminUser } from '@/types/admin-user'
import { Button } from '@/components/ui/button'
import { Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'

interface DeleteUserModalProps {
  user: AdminUser
  isOpen: boolean
  onClose: () => void
}

export default function DeleteUserModal({ user, isOpen, onClose }: DeleteUserModalProps) {
  const router = useRouter()
  const { deleteAdminUser, admin } = useUserStore()
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDelete = async () => {
    setError(null)

    try {
      await deleteAdminUser(user.id)

      // Close the modal and refresh the page
      onClose()
      router.refresh() // Refresh server components to show updated data
    } catch (err: any) {
      console.error('Error deleting user:', err)
      setError(err.message || 'Failed to delete user. Please try again.')
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="modal-box bg-base-100 rounded-lg shadow-xl">
          <h3 className="font-bold text-lg mb-4">Delete User</h3>
          <p>
            Are you sure you want to delete the user{' '}
            <span className="font-semibold">{user.username}</span>?
          </p>
          <p className="py-2 text-sm text-base-content/70">This action cannot be undone.</p>

          {error && <div className="alert alert-error mb-4 text-sm mt-2">{error}</div>}
          {admin.adminError && (
            <div className="alert alert-error mb-4 text-sm mt-2">{admin.adminError}</div>
          )}

          <div className="modal-action flex justify-end mt-6">
            <Button onClick={onClose} variant="ghost" className="btn" disabled={admin.adminLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="error"
              className="btn-error text-white"
              isLoading={admin.adminLoading}
              loadingText="Deleting..."
            >
              <Trash2Icon className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

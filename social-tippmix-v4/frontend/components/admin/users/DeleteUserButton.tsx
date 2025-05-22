'use client'

import { useState } from 'react'
import { AdminUser } from '@/lib/api/users'
import { Button } from '@/components/ui/button'
import { Trash2Icon } from 'lucide-react'
import DeleteUserModal from './DeleteUserModal'

interface DeleteUserButtonProps {
  user: AdminUser
}

export default function DeleteUserButton({ user }: DeleteUserButtonProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        className="text-error hover:bg-error/10 border-error/50 hover:text-error"
        onClick={() => setShowDeleteModal(true)}
      >
        <Trash2Icon className="mr-2 h-4 w-4" />
        Delete
      </Button>

      {showDeleteModal && (
        <DeleteUserModal
          user={user}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </>
  )
}

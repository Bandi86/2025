'use client'

import { useState } from 'react'
import { AdminUser } from '@/types/admin-user'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'

interface EditUserFormProps {
  user: AdminUser
}

interface FormData {
  username: string
  email: string
  role: string
  status: string
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter()
  const { updateAdminUser, admin } = useUserStore()

  const [formData, setFormData] = useState<FormData>({
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status
  })

  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await updateAdminUser(user.id, formData)

      // Redirect back to the user details page
      router.push(`/admin/users/${user.id}`)
      router.refresh() // Refresh server components to show updated data
    } catch (err: any) {
      console.error('Error updating user:', err)
      setError(err.message || 'Failed to update user. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-base-100 shadow-lg rounded-lg p-6 max-w-2xl">
      {error && <div className="alert alert-error mb-6 text-sm">{error}</div>}
      {admin.adminError && <div className="alert alert-error mb-6 text-sm">{admin.adminError}</div>}

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Username
          </label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">
            Role
          </label>
          <Select
            options={[
              { value: 'ADMIN', label: 'Admin' },
              { value: 'USER', label: 'User' }
            ]}
            value={formData.role}
            onChange={(e) => handleSelectChange('role', e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <Select
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'banned', label: 'Banned' }
            ]}
            value={formData.status}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="mt-4 flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/admin/users/${user.id}`)}
            disabled={admin.adminLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={admin.adminLoading}
            loadingText="Saving..."
          >
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}

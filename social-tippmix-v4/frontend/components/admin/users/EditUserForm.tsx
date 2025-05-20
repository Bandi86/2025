'use client'

import { useState } from 'react'
import { AdminUser } from '@/lib/admin/users'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { updateUser } from '@/lib/actions/admin'

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
  const [formData, setFormData] = useState<FormData>({
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
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
    setIsSubmitting(true)
    setError(null)

    try {
      await updateUser(user.id, formData)

      // Redirect back to the user details page
      router.push(`/admin/users/${user.id}`)
      router.refresh() // Refresh server components to show updated data
    } catch (err) {
      console.error('Error updating user:', err)
      setError('Failed to update user. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-base-100 shadow-lg rounded-lg p-6 max-w-2xl">
      {error && <div className="alert alert-error mb-6 text-sm">{error}</div>}

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
            value={formData.role}
            onValueChange={(value: string) => handleSelectChange('role', value)}
          >
            <SelectTrigger id="role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="USER">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <Select
            value={formData.status}
            onValueChange={(value: string) => handleSelectChange('status', value)}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/admin/users/${user.id}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} loadingText="Saving...">
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}

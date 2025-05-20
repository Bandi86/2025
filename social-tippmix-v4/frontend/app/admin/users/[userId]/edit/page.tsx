import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { fetchAdminUserById } from '@/lib/admin/users'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import EditUserForm from '@/components/admin/users/EditUserForm'
import { AdminUser } from '@/types/admin-user'

interface EditUserPageProps {
  params: {
    userId: string
  }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    redirect('/')
  }

  const adminUser = await fetchAdminUserById(params.userId)

  if (!adminUser) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">User Not Found</h1>
        <p>The user with ID {params.userId} could not be found.</p>
        <Link href="/admin/users" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Link href={`/admin/users/${adminUser.id}`}>
          <Button variant="outline" className="h-9 w-9">
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="sr-only">Back to User Details</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Edit User</h1>
      </div>

      <EditUserForm user={adminUser} />
    </div>
  )
}

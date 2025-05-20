import { fetchAdminUsers } from '@/lib/admin/users'
import { FetchUsersParams, AdminUser } from '@/types/admin-user'
import UserTable from '@/components/admin/users/UserTable'
import UserControls from '@/components/admin/users/UserControls'
import PaginationControls from '@/components/admin/users/PaginationControls'

export default async function AdminUsersPage(props: {
  searchParams: { [key: string]: string | undefined }
}) {
  // Next.js 14+ dynamic API: searchParams may be a Promise
  let searchParamsObj: { [key: string]: string | undefined } = {}
  if (typeof (props.searchParams as any)?.then === 'function') {
    searchParamsObj = await (props as any).searchParams
  } else {
    searchParamsObj = props.searchParams
  }
  // Validate and sanitize searchParams if necessary
  const currentPage = Number(searchParamsObj.page) || 1
  const currentLimit = Number(searchParamsObj.limit) || 10

  const params: FetchUsersParams = {
    page: currentPage,
    limit: currentLimit,
    searchQuery: searchParamsObj.searchQuery,
    roleFilter: searchParamsObj.roleFilter,
    newStatusFilter: searchParamsObj.newStatusFilter,
    sortBy: searchParamsObj.sortBy
  }

  const { users, totalPages, totalUsers } = await fetchAdminUsers(params)

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Manage Users</h1>

      <UserControls currentParams={params} totalUsers={totalUsers} />

      {users.length > 0 ? (
        <UserTable users={users} />
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">No users found matching your criteria.</p>
        </div>
      )}

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          currentParams={params}
        />
      )}
    </div>
  )
}

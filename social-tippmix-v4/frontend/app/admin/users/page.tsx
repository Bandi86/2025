import { fetchAdminUsers } from '@/lib/users/usersService'
import { FetchUsersParams } from '@/types/admin-user'
import UserTable from '@/components/admin/users/UserTable'
import UserControls from '@/components/admin/users/UserControls'
import Pagination from '@/components/ui/Pagination'
import { AdminUserInitializer } from '@/components/admin/users/AdminUserInitializer'

function getSanitizedParams(
  searchParamsObj: Record<string, string | string[] | undefined>,
  keys: string[]
) {
  const params: Record<string, any> = {}
  for (const key of keys) {
    const value = searchParamsObj[key]
    params[key] = Array.isArray(value) ? value[0] : value
  }
  return params
}

export default async function AdminUsersPage(props: {
  searchParams: { [key: string]: string | undefined | string[] }
}) {
  // Next.js 14+ dynamic API: searchParams may be a Promise
  let searchParamsObj: { [key: string]: string | undefined | string[] } = {}
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
    ...getSanitizedParams(searchParamsObj, [
      'searchQuery',
      'roleFilter',
      'newStatusFilter',
      'sortBy'
    ])
  }

  // Fetch data from the API
  const { users, totalPages, totalUsers } = await fetchAdminUsers(params)

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      {/* Initialize store with server data */}
      <AdminUserInitializer
        users={users}
        totalUsers={totalUsers}
        totalPages={totalPages}
        currentParams={params}
      />

      <h1 className="text-3xl font-bold mb-8 text-gray-800">Manage Users</h1>

      <UserControls
        currentParams={params}
        totalUsers={totalUsers}
        onlineUsers={users.filter((user) => user.isOnline).length}
      />

      {users.length > 0 ? (
        <UserTable users={users} />
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">No users found matching your criteria.</p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} currentParams={params} />
      )}
    </div>
  )
}

import Link from 'next/link'
import { User } from '@/types/user'
import { fetchUsers, PaginatedUsers, FetchUsersParams } from '@/lib/admin/fetchUser'
import { cookies } from 'next/headers'
import UserTable from '@/components/admin/UserTable'

// Ideiglenes típusbővítés, ha a User típusban nincs benne minden mező
type UserWithStatus = User & {
  status?: string
  isOnline?: boolean
  lastLogin?: string
}

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function UserManagementPage(
  props: PageProps | { searchParams: Promise<URLSearchParams> }
) {
  // Next.js 14+ dynamic API: searchParams is a Promise
  let page = 1
  let searchParamsObj: any = undefined
  if (typeof props.searchParams?.then === 'function') {
    // If searchParams is a Promise (Next.js 14+)
    searchParamsObj = await (props as any).searchParams
    if (typeof searchParamsObj.get === 'function') {
      page = Number(searchParamsObj.get('page')) || 1
    } else {
      // Sima object: lehet string vagy string[]
      const raw = searchParamsObj?.page
      if (Array.isArray(raw)) {
        page = Number(raw[0]) || 1
      } else {
        page = Number(raw) || 1
      }
    }
  } else {
    // Legacy/typed
    searchParamsObj = props.searchParams
    const raw = searchParamsObj?.page
    if (Array.isArray(raw)) {
      page = Number(raw[0]) || 1
    } else {
      page = Number(raw) || 1
    }
  }
  const params: FetchUsersParams = {
    page,
    limit: 10
    // sortBy, sortOrder, search, role, isOnline stb. ha kell
  }

  let users: UserWithStatus[] = []
  let totalPages = 1
  let error: string | null = null

  // SSR-safe: get token from cookies and pass to fetchUsers
  let token: string | undefined = undefined
  try {
    const cookieStore = await cookies()
    token = cookieStore.get('token')?.value
    console.log('SSR token from cookies:', token)
  } catch {}

  try {
    const data: PaginatedUsers | null = await fetchUsers(params, token)
    if (data && data.data && data.data.users) {
      users = data.data.users
      totalPages = data.totalPages || 1
    } else {
      error = 'Nem sikerült lekérni a felhasználókat.'
    }
  } catch {
    error = 'Nem sikerült lekérni a felhasználókat.'
  }

  if (error) {
    return <div className="alert alert-error w-fit mx-auto my-10">{error}</div>
  }

  if (!users || users.length === 0) {
    return (
      <div className="alert alert-info w-fit mx-auto my-10">
        Nincsenek felhasználók a rendszerben.
      </div>
    )
  }

  return (
    <div className="card bg-base-100 shadow-xl mx-auto max-w-6xl mt-8">
      <div className="card-body p-6">
        <h1 className="card-title text-2xl mb-4">Felhasználók Kezelése</h1>
        <UserTable users={users} page={page} totalPages={totalPages} />
        {/* Lapozás */}
        <div className="flex justify-center items-center gap-2 py-4">
          <div className="join">
            <Link
              href={`/admin/users?page=${Math.max(1, page - 1)}`}
              className={`btn btn-sm btn-outline join-item${page === 1 ? ' btn-disabled' : ''}`}
              aria-disabled={page === 1}
            >
              Előző
            </Link>
            <span className="join-item px-3 py-2 text-sm font-medium">
              {page} / {totalPages}
            </span>
            <Link
              href={`/admin/users?page=${Math.min(totalPages, page + 1)}`}
              className={`btn btn-sm btn-outline join-item${
                page === totalPages ? ' btn-disabled' : ''
              }`}
              aria-disabled={page === totalPages}
            >
              Következő
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

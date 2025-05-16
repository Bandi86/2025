import { fetchUserDetails } from '@/lib/admin/fetchUser'
import Link from 'next/link'
import { cookies } from 'next/headers'
import UserDetailCard from '@/components/admin/UserDetailCard'

interface PageProps {
  params: { userId: string }
}

export default async function UserDetailPage(
  rawProps: PageProps | { params: Promise<{ userId: string }> }
) {
  let params: { userId: string }
  if (typeof (rawProps as any).params?.then === 'function') {
    params = await (rawProps as any).params
  } else {
    params = (rawProps as any).params
  }
  const userId = params.userId
  let user: any = null
  let error: string | null = null
  let token: string | undefined = undefined
  try {
    const cookieStore = await cookies()
    token = cookieStore.get('token')?.value
  } catch {}
  try {
    user = await fetchUserDetails(userId, token)
    if (!user) error = 'A felhasználó nem található.'
  } catch (e: any) {
    error = e?.message || 'Hiba történt a felhasználó adatainak lekérése közben.'
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="alert alert-error w-fit mx-auto mb-4">{error}</p>
        <Link href="/admin/users" className="btn btn-outline btn-primary">
          Vissza a felhasználók listájához
        </Link>
      </div>
    )
  }
  if (!user) {
    return <div className="text-center py-10">Felhasználó nem található.</div>
  }
  return <UserDetailCard user={user} />
}

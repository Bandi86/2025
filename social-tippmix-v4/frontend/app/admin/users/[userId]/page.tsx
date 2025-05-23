import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { fetchAdminUserById } from '@/lib/users/usersService'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeftIcon, Edit3Icon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import DeleteUserButton from '@/components/admin/users/DeleteUserButton'
import Image from 'next/image'
import { formatDateTimeHU } from '@/lib/format/date'
import UserStats from '@/components/admin/users/UserStats'

export default async function UserDetailsPage(props: { params: { userId: string } }) {
  let paramsObj: { userId: string } = { userId: '' }
  if (typeof (props.params as any)?.then === 'function') {
    paramsObj = await (props as any).params
  } else {
    paramsObj = props.params
  }
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    redirect('/')
  }
  const adminUser = await fetchAdminUserById(paramsObj.userId)
  if (!adminUser) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">User Not Found</h1>
        <p>The user with ID {paramsObj.userId} could not be found.</p>
        <Link href="/admin/users" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>
    )
  }
  // innentől biztosan van adminUser
  const safeAdminUser = adminUser as NonNullable<typeof adminUser>

  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return 'neutral'
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
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Link href="/admin/users">
            <Button variant="outline" className="h-9 w-9">
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="sr-only">Back to Users</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">User Details</h1>
        </div>
        <div className="flex space-x-2">
          <Link href={`/admin/users/${safeAdminUser.id}/edit`}>
            <Button variant="outline">
              <Edit3Icon className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeleteUserButton user={safeAdminUser} />
        </div>
      </div>

      <div className="bg-base-100 shadow-lg rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col items-center md:items-start">
            <div className="avatar mb-4">
              <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden flex items-center justify-center bg-base-200">
                {safeAdminUser.image || safeAdminUser.avatar ? (
                  <Image
                    src={
                      safeAdminUser.image ? safeAdminUser.image : (safeAdminUser.avatar as string)
                    }
                    alt={safeAdminUser.username + ' avatar'}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-4xl font-bold text-base-content/60 select-none">
                    {safeAdminUser.username?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {safeAdminUser.isOnline ? (
                <span
                  className="inline-block w-3 h-3 rounded-full bg-success"
                  title="Online"
                ></span>
              ) : (
                <span className="inline-block w-3 h-3 rounded-full bg-error" title="Offline"></span>
              )}
              <span className="text-sm text-base-content/70">
                {safeAdminUser.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex flex-col gap-1 items-center md:items-start">
              <span className="badge badge-outline text-xs">ID: {safeAdminUser.id}</span>
              <span className="badge badge-outline text-xs">{safeAdminUser.role}</span>
              <span className="badge badge-outline text-xs">{safeAdminUser.status}</span>
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-base-content/70">Felhasználónév</p>
              <p className="text-lg font-medium">{safeAdminUser.username}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/70">Email</p>
              <p className="text-lg font-medium">{safeAdminUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/70">Email megerősítve</p>
              <p className="text-lg font-medium">
                {safeAdminUser.emailVerifiedAt
                  ? formatDateTimeHU(safeAdminUser.emailVerifiedAt)
                  : safeAdminUser.emailVerified
                  ? 'Igen'
                  : 'Nem'}
              </p>
            </div>
            <div>
              <p className="text-sm text-base-content/70">Státusz</p>
              <Badge variant={getStatusBadgeVariant(safeAdminUser.status)}>
                {safeAdminUser.status || '-'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-base-content/70">Szerepkör</p>
              <p className="text-lg font-medium">{safeAdminUser.role}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/70">Regisztráció</p>
              <p className="text-lg font-medium">{formatDateTimeHU(safeAdminUser.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/70">Utolsó belépés</p>
              <p className="text-lg font-medium">
                {safeAdminUser.lastLogin ? formatDateTimeHU(safeAdminUser.lastLogin) : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm text-base-content/70">Profil frissítve</p>
              <p className="text-lg font-medium">
                {safeAdminUser.updatedAt ? formatDateTimeHU(safeAdminUser.updatedAt) : '-'}
              </p>
            </div>
          </div>
        </div>
        <div className="divider my-8">Profil adatok</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-200 p-4">
            <div className="card-title text-base mb-2">Személyes adatok</div>
            <div className="flex flex-col gap-2">
              <div>
                <span className="font-medium">Bio:</span> <span>{safeAdminUser.bio || '-'}</span>
              </div>
              <div>
                <span className="font-medium">Születési dátum:</span>{' '}
                <span>
                  {safeAdminUser.birthDate ? formatDateTimeHU(safeAdminUser.birthDate) : '-'}
                </span>
              </div>
              <div>
                <span className="font-medium">Hely:</span>{' '}
                <span>{safeAdminUser.location || '-'}</span>
              </div>
              <div>
                <span className="font-medium">Ország:</span>{' '}
                <span>{safeAdminUser.country || '-'}</span>
              </div>
            </div>
          </div>
          <div className="card bg-base-200 p-4">
            <div className="card-title text-base mb-2">Elérhetőség</div>
            <div className="flex flex-col gap-2">
              <div>
                <span className="font-medium">Telefon:</span>{' '}
                <span>{safeAdminUser.phone || '-'}</span>
              </div>
              <div>
                <span className="font-medium">Cím:</span>{' '}
                <span>{safeAdminUser.address || '-'}</span>
              </div>
              <div>
                <span className="font-medium">Irányítószám:</span>{' '}
                <span>{safeAdminUser.postalCode || '-'}</span>
              </div>
              <div>
                <span className="font-medium">Weboldal:</span>{' '}
                {safeAdminUser.website ? (
                  <a
                    href={safeAdminUser.website}
                    className="link link-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {safeAdminUser.website}
                  </a>
                ) : (
                  '-'
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="divider my-8">Statisztikák</div>
        <UserStats
          posts={safeAdminUser._count?.posts}
          comments={safeAdminUser._count?.comments}
          likes={safeAdminUser._count?.likes}
          followers={safeAdminUser._count?.followers}
          following={safeAdminUser._count?.following}
        />
      </div>
    </div>
  )
}

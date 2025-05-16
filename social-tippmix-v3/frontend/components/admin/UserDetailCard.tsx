import Link from 'next/link'
import { formatDate } from '@/lib/utils/date'
import { User } from '@/types/user'

export default function UserDetailCard({ user }: { user: User }) {
  return (
    <div className="card bg-base-100 shadow-xl mx-auto max-w-4xl mt-8">
      <div className="card-body p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="card-title text-2xl mb-1">{user.name || user.email}</h1>
            <p className="text-sm text-base-content/60">Azonosító: {user.id}</p>
          </div>
          <Link href="/admin/users" className="btn btn-sm btn-outline">
            &larr; Vissza
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="mb-4">
              <span
                className={`badge badge-${
                  user.role === 'ADMIN' ? 'error' : 'success'
                } badge-sm mr-2`}
              >
                {user.role}
              </span>
              <span
                className={`badge badge-${
                  user.status === 'ACTIVE' ? 'info' : 'warning'
                } badge-sm mr-2`}
              >
                {user.status}
              </span>
              <span className={`badge badge-${user.isOnline ? 'success' : 'neutral'} badge-sm`}>
                {user.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <ul className="list">
              <li className="list-row">
                <span className="font-medium">Email:</span> <span>{user.email}</span>
              </li>
              <li className="list-row">
                <span className="font-medium">Név:</span> <span>{user.name || 'N/A'}</span>
              </li>
              <li className="list-row">
                <span className="font-medium">Regisztráció:</span>{' '}
                <span>{formatDate(user.createdAt)}</span>
              </li>
              <li className="list-row">
                <span className="font-medium">Utolsó belépés:</span>{' '}
                <span>{formatDate(user.lastLogin)}</span>
              </li>
              <li className="list-row">
                <span className="font-medium">Profil frissítve:</span>{' '}
                <span>{formatDate(user.updatedAt)}</span>
              </li>
              <li className="list-row">
                <span className="font-medium">Email megerősítve:</span>{' '}
                <span>{user.emailVerified ? formatDate(user.emailVerified) : 'Nem'}</span>
              </li>
            </ul>
          </div>
          <div>
            {user.image && (
              <img
                src={user.image}
                alt={user.name || 'Profilkép'}
                className="w-24 h-24 rounded-full mb-4 object-cover mx-auto"
              />
            )}
            {user.bio && (
              <div className="mb-2">
                <span className="font-medium">Bemutatkozás:</span> <span>{user.bio}</span>
              </div>
            )}
            {user.website && (
              <div className="mb-2">
                <span className="font-medium">Weboldal:</span>{' '}
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  {user.website}
                </a>
              </div>
            )}
            {user.location && (
              <div className="mb-2">
                <span className="font-medium">Hely:</span> <span>{user.location}</span>
              </div>
            )}
            {user.birthDate && (
              <div className="mb-2">
                <span className="font-medium">Születési dátum:</span>{' '}
                <span>{formatDate(user.birthDate)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="stats stats-vertical md:stats-horizontal shadow mb-8">
          <div className="stat">
            <div className="stat-title">Posztok</div>
            <div className="stat-value">{user._count?.posts ?? 0}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Kommentek</div>
            <div className="stat-value">{user._count?.comments ?? 0}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Lájkok</div>
            <div className="stat-value">{user._count?.likes ?? 0}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Munkamenetek</div>
            <div className="stat-value">{user._count?.sessions ?? 0}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Kapcsolt fiókok</div>
            <div className="stat-value">{user._count?.accounts ?? 0}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Követők</div>
            <div className="stat-value">{user._count?.followers ?? 0}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Követett</div>
            <div className="stat-value">{user._count?.following ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

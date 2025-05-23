'use client'
import React from 'react'

interface UserActivityProps {
  lastLogin?: string
  createdAt: string
  postsLastWeek?: number
  commentsLastWeek?: number
  likesLastWeek?: number
  avgPostsPerMonth?: number
}

export default function UserActivity({
  lastLogin,
  createdAt,
  postsLastWeek = 0,
  commentsLastWeek = 0,
  likesLastWeek = 0,
  avgPostsPerMonth = 0
}: UserActivityProps) {
  // Calculate the date for 7 days ago to determine "recent" activity
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysSinceLastLogin = (lastLoginDate?: string) => {
    if (!lastLoginDate) return '-'
    const lastLogin = new Date(lastLoginDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastLogin.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Ma'
    if (diffDays === 1) return 'Tegnap'
    return `${diffDays} napja`
  }

  const getAccountAge = (createdAtDate: string) => {
    const created = new Date(createdAtDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 30) return `${diffDays} napja`
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths} hónapja`
    const diffYears = Math.floor(diffMonths / 12)
    const remainingMonths = diffMonths % 12
    return remainingMonths > 0
      ? `${diffYears} éve és ${remainingMonths} hónapja`
      : `${diffYears} éve`
  }

  // Activity level based on recent actions
  const getActivityLevel = () => {
    const totalRecentActivity = postsLastWeek + commentsLastWeek + likesLastWeek

    if (totalRecentActivity === 0) return { text: 'Inaktív', color: 'error' }
    if (totalRecentActivity < 5) return { text: 'Alacsony', color: 'warning' }
    if (totalRecentActivity < 20) return { text: 'Átlagos', color: 'info' }
    if (totalRecentActivity < 50) return { text: 'Aktív', color: 'success' }
    return { text: 'Nagyon aktív', color: 'primary' }
  }

  const activityLevel = getActivityLevel()

  return (
    <div className="card bg-base-100 shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Felhasználói aktivitás</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <span className="text-base-content/70">Utolsó bejelentkezés:</span>
            <div className="flex items-center gap-2 mt-1">
              <div className={`status status-${lastLogin ? 'success' : 'error'}`}></div>
              <span>{formatDate(lastLogin)}</span>
              {lastLogin && (
                <span className="badge badge-ghost badge-sm ml-2">
                  {getDaysSinceLastLogin(lastLogin)}
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-base-content/70">Felhasználó kora:</span>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <span>{getAccountAge(createdAt)}</span>
                <span className="badge badge-ghost badge-sm">{formatDate(createdAt)}</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-base-content/70">Aktivitási szint:</span>
            <div className="mt-1">
              <span className={`badge badge-${activityLevel.color}`}>{activityLevel.text}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-base-content/70">Múlt heti aktivitás:</span>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="card bg-base-200 p-2 text-center">
                <span className="text-sm text-base-content/70">Posztok</span>
                <span className="text-xl font-bold">{postsLastWeek}</span>
              </div>
              <div className="card bg-base-200 p-2 text-center">
                <span className="text-sm text-base-content/70">Kommentek</span>
                <span className="text-xl font-bold">{commentsLastWeek}</span>
              </div>
              <div className="card bg-base-200 p-2 text-center">
                <span className="text-sm text-base-content/70">Like-ok</span>
                <span className="text-xl font-bold">{likesLastWeek}</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-base-content/70">Havi átlag posztok:</span>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{avgPostsPerMonth.toFixed(1)}</span>
                <span className="text-sm text-base-content/70">poszt/hónap</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

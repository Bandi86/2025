'use client'
import React from 'react'

interface UserBadge {
  label: string
  color: string
  description: string
  icon?: string
}

interface UserBadgesProps {
  badges?: UserBadge[]
}

export default function UserBadges({ badges = [] }: UserBadgesProps) {
  // Provide some default badges if none are provided
  const defaultBadges: UserBadge[] = [
    {
      label: 'Új Felhasználó',
      color: 'info',
      description: 'Az elmúlt 30 napban regisztrált',
      icon: '🔰'
    }
  ]

  const allBadges = badges.length > 0 ? badges : defaultBadges

  return (
    <div className="card bg-base-100 shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Jelvények és Eredmények</h3>

      {allBadges.length === 0 ? (
        <div className="flex items-center justify-center p-6 text-base-content/50">
          Nincsenek jelvények
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {allBadges.map((badge, index) => (
            <div
              key={index}
              className={`badge badge-${badge.color} badge-lg flex items-center justify-center p-4 tooltip`}
              data-tip={badge.description}
            >
              {badge.icon && <span className="mr-1">{badge.icon}</span>}
              {badge.label}
            </div>
          ))}
        </div>
      )}

      <div className="divider my-4">Potenciális Jelvények</div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div
          className="badge badge-outline badge-lg flex items-center justify-center p-4 tooltip"
          data-tip="Írj 10 posztot a tartalomgyártó jelvény megszerzéséhez"
        >
          🖋️ Tartalomgyártó
        </div>
        <div
          className="badge badge-outline badge-lg flex items-center justify-center p-4 tooltip"
          data-tip="Érj el 50 like-ot a népszerű jelvény megszerzéséhez"
        >
          ⭐ Népszerű
        </div>
        <div
          className="badge badge-outline badge-lg flex items-center justify-center p-4 tooltip"
          data-tip="Legyél aktív a platformon legalább 3 hónapig"
        >
          🏆 Veterán
        </div>
      </div>
    </div>
  )
}

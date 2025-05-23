'use client'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface UserInteraction {
  id: string
  displayName: string
  avatar?: string
  interactionType: 'follower' | 'following' | 'commenter' | 'liker'
  count?: number
}

interface UserInteractionsProps {
  topFollowers?: UserInteraction[]
  topFollowing?: UserInteraction[]
  topCommenters?: UserInteraction[]
  topLikers?: UserInteraction[]
}

export default function UserInteractions({
  topFollowers = [],
  topFollowing = [],
  topCommenters = [],
  topLikers = []
}: UserInteractionsProps) {
  // Group all interactions by type
  const interactionGroups = [
    { title: 'Top Követők', items: topFollowers, type: 'follower' },
    { title: 'Top Követések', items: topFollowing, type: 'following' },
    { title: 'Top Kommentelők', items: topCommenters, type: 'commenter' },
    { title: 'Top Like-olók', items: topLikers, type: 'liker' }
  ]

  // Find a color for each interaction type
  const getColorForType = (type: string) => {
    switch (type) {
      case 'follower':
        return 'success'
      case 'following':
        return 'secondary'
      case 'commenter':
        return 'accent'
      case 'liker':
        return 'info'
      default:
        return 'neutral'
    }
  }

  // Mock data for demonstration
  const getMockData = (type: string): UserInteraction[] => {
    return [
      {
        id: '1',
        displayName: 'János Kovács',
        avatar: 'https://picsum.photos/id/64/200/200',
        interactionType: type as any,
        count: 8
      },
      {
        id: '2',
        displayName: 'Éva Nagy',
        avatar: 'https://picsum.photos/id/65/200/200',
        interactionType: type as any,
        count: 5
      },
      {
        id: '3',
        displayName: 'Péter Szabó',
        avatar: 'https://picsum.photos/id/66/200/200',
        interactionType: type as any,
        count: 3
      }
    ]
  }

  return (
    <div className="card bg-base-100 shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Kapcsolatok és Interakciók</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {interactionGroups.map((group, groupIndex) => {
          const mockItems = getMockData(group.type)
          const items = group.items.length > 0 ? group.items : mockItems

          return (
            <div key={groupIndex} className="card bg-base-200 p-4">
              <div className="card-title text-sm mb-2">{group.title}</div>

              {items.length === 0 ? (
                <div className="text-center py-4 text-base-content/50">Nincs adat</div>
              ) : (
                <ul className="list">
                  {items.map((item, index) => (
                    <li key={index} className="list-row p-2 rounded hover:bg-base-300">
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full">
                            {item.avatar ? (
                              <Image
                                src={item.avatar}
                                alt={item.displayName}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="bg-base-300 flex items-center justify-center">
                                <span>{item.displayName[0]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <Link
                            href={`/admin/users/${item.id}`}
                            className="font-medium hover:underline"
                          >
                            {item.displayName}
                          </Link>
                        </div>
                        {item.count && (
                          <span className={`badge badge-${getColorForType(item.interactionType)}`}>
                            {item.count}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

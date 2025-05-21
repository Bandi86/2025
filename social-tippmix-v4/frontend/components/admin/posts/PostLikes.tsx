// PostLikes.tsx
import React from 'react'

export default function PostLikes({ likes }: { likes: any[] }) {
  if (!likes || likes.length === 0) return null
  return (
    <div className="mt-8">
      <div className="divider my-4">Kedvelések</div>
      <div className="flex flex-wrap gap-2">
        {likes.map((like) => (
          <div key={like.id} className="flex items-center gap-2 bg-base-200 rounded px-2 py-1">
            {like.user?.avatar ? (
              <img
                src={like.user.avatar}
                alt={like.user.username}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="avatar placeholder w-6 h-6">
                <div className="bg-neutral text-neutral-content rounded-full w-6 h-6 flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {like.user?.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>
            )}
            <span className="text-sm">{like.user?.username}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

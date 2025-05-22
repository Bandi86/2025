// Reusable LikeButton component for post or comment
'use client'
import { useState, useEffect } from 'react'
import { HeartIcon, Users2Icon } from 'lucide-react'
import axios from 'axios'
import { useUserValue } from '@/context/UserContext'

interface LikeButtonProps {
  targetId: string
  type: 'post' | 'comment'
  initialLiked: boolean
  initialCount: number
  disabled?: boolean
}

interface LikeUser {
  id: string
  username: string
  avatar?: string | null
}

const PAGE_SIZE = 30

export default function LikeButton({
  targetId,
  type,
  initialLiked,
  initialCount,
  disabled
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [users, setUsers] = useState<LikeUser[] | null>(null)
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [animate, setAnimate] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const currentUser = useUserValue()

  // Pulse animation on like
  useEffect(() => {
    if (liked) {
      setAnimate(true)
      const timeout = setTimeout(() => setAnimate(false), 400)
      return () => clearTimeout(timeout)
    }
  }, [liked])

  // Helper: sort likers (current user first, then admin/mod, then alpha)
  function sortLikers(users: LikeUser[] | null) {
    if (!users) return []
    return [...users].sort((a, b) => {
      if (currentUser?.id === a.id) return -1
      if (currentUser?.id === b.id) return 1
      // If you have role info, prioritize admin/mod here (assuming user.role exists)
      // if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1
      // if (b.role === 'ADMIN' && a.role !== 'ADMIN') return 1
      return a.username.localeCompare(b.username, 'hu')
    })
  }

  const handleLike = async () => {
    if (loading || disabled) return
    setLoading(true)
    setError(null)
    try {
      const url = `/api/like/${type}/${targetId}`
      const res = await axios.post(url)
      setLiked(res.data.liked)
      setCount((prev) => prev + (res.data.liked ? 1 : -1))
    } catch (err: any) {
      // Ha saját tartalom like-olása tiltott, mutassuk a hibát, disable-öljük a gombot
      if (err?.response?.status === 403 && err?.response?.data?.error) {
        setError(err.response.data.error)
        setTimeout(() => setError(null), 3000)
        return
      }
      setError(err?.response?.data?.error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch likers with pagination
  const fetchLikers = async (pageNum: number, append = false) => {
    setUsersLoading(true)
    setUsersError(null)
    try {
      const url = `/api/like/${type}/${targetId}?page=${pageNum}&limit=${PAGE_SIZE}`
      const res = await axios.get(url)
      const newUsers = res.data.map((like: any) => like.user)
      setHasMore(newUsers.length === PAGE_SIZE)
      setUsers((prev) => {
        if (append && prev) {
          // Avoid duplicates
          const ids = new Set(prev.map((u) => u.id))
          return [...prev, ...newUsers.filter((u: LikeUser) => !ids.has(u.id))]
        }
        return newUsers
      })
    } catch (err: any) {
      setUsersError('Nem sikerült betölteni a like-olókat')
    } finally {
      setUsersLoading(false)
    }
  }

  // Open modal and load first page
  const handleShowUsers = async (e: React.MouseEvent) => {
    if (count === 0) return // Do nothing if no likes
    e.preventDefault()
    setShowModal(true)
    setPage(1)
    setUsers(null)
    setHasMore(true)
    fetchLikers(1, false)
  }

  // Infinite scroll handler
  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget
    if (
      hasMore &&
      !usersLoading &&
      el.scrollHeight - el.scrollTop - el.clientHeight < 60 // px from bottom
    ) {
      setPage((prev) => {
        const next = prev + 1
        fetchLikers(next, true)
        return next
      })
    }
  }

  return (
    <>
      <button
        className={`btn btn-sm btn-ghost group flex items-center gap-1.5 px-2 ${
          liked ? 'text-error' : 'text-base-content/70 hover:text-base-content'
        }`}
        onClick={handleLike}
        disabled={
          loading ||
          disabled ||
          error === 'Saját posztot nem lehet like-olni' ||
          error === 'Saját kommentet nem lehet like-olni'
        }
        aria-pressed={liked}
        aria-label={liked ? 'Like visszavonása' : 'Like'}
        type="button"
        onContextMenu={count === 0 ? undefined : handleShowUsers}
        onAuxClick={(e) => {
          if (count === 0) return
          if (e.button === 1) handleShowUsers(e)
        }}
      >
        <span className="relative">
          <HeartIcon
            className={`w-5 h-5 transition-all group-hover:scale-110 ${
              liked ? 'fill-error' : 'fill-none group-hover:fill-base-content/30'
            } ${animate ? 'animate-pulse-heart' : ''}`}
          />
          {/* Heart pulse animation (Tailwind custom) */}
          <style jsx>{`
            @keyframes pulse-heart {
              0% {
                transform: scale(1);
              }
              30% {
                transform: scale(1.3);
              }
              60% {
                transform: scale(0.95);
              }
              100% {
                transform: scale(1);
              }
            }
            .animate-pulse-heart {
              animation: pulse-heart 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
          `}</style>
        </span>
        <span
          className={`text-sm font-medium tabular-nums group-hover:underline group-hover:decoration-dotted group-hover:decoration-2 ${
            count === 0 ? 'pointer-events-none text-base-content/40 no-underline' : 'cursor-pointer'
          }`}
          onClick={count === 0 ? undefined : handleShowUsers}
          title={count === 0 ? '' : 'Kattints a névsorért!'}
        >
          {count}
        </span>
        {loading && <span className="loading loading-spinner loading-xs ml-1"></span>}
        {error && error !== 'Hiba a like műveletnél' && (
          <span className="text-error text-xs ml-1.5">{error}</span>
        )}
      </button>
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-box bg-base-100 p-0 rounded-lg shadow-xl min-w-[320px] max-w-xs flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-300 sticky top-0 bg-base-100 z-10">
              <div className="flex items-center gap-2">
                <Users2Icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Like-olók</h3>
              </div>
              <button
                className="btn btn-sm btn-ghost btn-circle"
                onClick={() => setShowModal(false)}
                aria-label="Bezárás"
              >
                ✕
              </button>
            </div>

            {/* Mosaic of likers' avatars */}
            {users && users.length > 0 && (
              <div className="flex flex-row flex-wrap gap-1.5 p-3 justify-center items-center border-b border-base-300 bg-base-200/30 sticky top-[61px] z-10">
                {sortLikers(users)
                  .slice(0, 8)
                  .map((user) => (
                    <div key={user.id} className="relative group avatar">
                      {user.avatar ? (
                        <div
                          className={`w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-base-200/30 ${
                            currentUser?.id === user.id
                              ? 'ring-primary'
                              : 'ring-base-300 group-hover:ring-secondary'
                          }`}
                        >
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="rounded-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`avatar placeholder ring-2 ring-offset-2 ring-offset-base-200/30 ${
                            currentUser?.id === user.id
                              ? 'ring-primary'
                              : 'ring-base-300 group-hover:ring-secondary'
                          }`}
                        >
                          <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 flex items-center justify-center">
                            <span className="text-sm font-bold">
                              {user.username?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                {users.length > 8 && (
                  <span className="badge badge-neutral badge-md ml-1 self-center">
                    +{users.length - 8}
                  </span>
                )}
              </div>
            )}

            {/* Likers List Area */}
            <div className="flex-grow overflow-y-auto p-4">
              {usersLoading && !users && (
                <div className="flex justify-center py-6">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              )}
              {usersError && (
                <div className="alert alert-error py-2.5 px-4 my-2 text-sm">{usersError}</div>
              )}
              {users && users.length === 0 && !usersLoading && (
                <div className="text-base-content/60 text-sm text-center py-4">
                  Még senki sem like-olta.
                </div>
              )}
              {users && users.length > 0 && (
                <ul className="space-y-2.5" onScroll={handleScroll}>
                  {sortLikers(users).map((user) => (
                    <li
                      key={user.id}
                      className={`flex items-center gap-2.5 p-1.5 rounded-md transition-colors ${
                        currentUser?.id === user.id ? 'bg-primary/10' : 'hover:bg-base-200/60'
                      }`}
                    >
                      <div className="relative group avatar">
                        {user.avatar ? (
                          <div className="w-7 h-7 rounded-full ring-1 ring-base-300">
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="rounded-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-7 h-7 flex items-center justify-center ring-1 ring-neutral-focus">
                              <span className="text-xs font-bold">
                                {user.username?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                          </div>
                        )}
                        {/* Mini profile tooltip on hover */}
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-20 hidden group-hover:block bg-base-300 text-base-content text-xs rounded-md shadow-lg px-2.5 py-1.5 whitespace-nowrap border border-base-content/10">
                          <div className="font-semibold text-sm">{user.username}</div>
                          {/* If you have email or more info, show here */}
                          {/* <div>{user.email}</div> */}
                        </div>
                      </div>
                      <a
                        href={`/profile/${user.id}`}
                        className={`font-medium link hover:link-primary ${
                          currentUser?.id === user.id
                            ? 'font-bold text-primary link-primary'
                            : 'text-base-content hover:text-primary'
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {user.username}
                        {currentUser?.id === user.id && (
                          <span className="badge badge-primary badge-outline badge-xs ml-1.5 align-middle">
                            te
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                  {usersLoading && users && users.length > 0 && (
                    <li className="flex justify-center py-3">
                      <span className="loading loading-spinner loading-sm text-primary"></span>
                    </li>
                  )}
                  {!hasMore && users.length > 0 && (
                    <li className="text-center text-xs text-base-content/50 pt-2 pb-1">
                      Nincs több like-oló.
                    </li>
                  )}
                </ul>
              )}
            </div>
            {/* Modal Footer */}
            <div className="p-3 border-t border-base-300 sticky bottom-0 bg-base-100 z-10">
              <button className="btn btn-ghost btn-md" onClick={() => setShowModal(false)}>
                Bezár
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

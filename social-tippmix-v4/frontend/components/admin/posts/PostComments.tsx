'use client'
import React, { useState } from 'react'
import { formatDateTimeHU } from '@/lib/format/date'
import axiosClient from '@/lib/axios/axios-config-client'
import LikeButton from '@/components/ui/LikeButton'

export default function PostComments({
  comments: initialComments,
  postId,
  isAdmin
}: {
  comments: any[]
  postId: string
  isAdmin?: boolean
}) {
  const [comments, setComments] = useState(initialComments)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setAddLoading(true)
    setAddError(null)
    try {
      const res = await axiosClient.post('/comment', { content, postId })
      setComments([res.data, ...comments])
      setContent('')
    } catch (err: any) {
      setAddError(err?.response?.data?.error || 'Hiba a komment létrehozásakor')
    } finally {
      setAddLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törlöd ezt a kommentet?')) return
    setDeleteLoading(id)
    try {
      await axiosClient.delete(`/comment/${id}`)
      setComments(comments.filter((c: any) => c.id !== id))
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Hiba a törléskor')
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleEdit = (comment: any) => {
    setEditId(comment.id)
    setEditContent(comment.content)
    setEditError(null)
  }

  const handleEditCancel = () => {
    setEditId(null)
    setEditContent('')
    setEditError(null)
  }

  const handleEditSave = async (id: string) => {
    if (!editContent.trim()) return
    setEditLoading(true)
    setEditError(null)
    try {
      const res = await axiosClient.patch(`/comment/${id}`, { content: editContent })
      setComments(comments.map((c: any) => (c.id === id ? { ...c, content: res.data.content } : c)))
      setEditId(null)
      setEditContent('')
    } catch (err: any) {
      setEditError(err?.response?.data?.error || 'Hiba a szerkesztéskor')
    } finally {
      setEditLoading(false)
    }
  }

  // Helper: check if comment was updated
  const isUpdated = (comment: any) => {
    if (!comment.updatedAt) return false
    // If updatedAt is more than 1s after createdAt, consider it updated
    return new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  if (!comments || comments.length === 0)
    return (
      <div className="mt-8">
        <div className="divider my-4">Hozzászólások</div>
        <form className="flex gap-2 mb-4" onSubmit={handleAddComment}>
          <input
            className="input input-bordered flex-1"
            placeholder="Új komment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={addLoading}
          />
          <button className="btn btn-primary" type="submit" disabled={addLoading}>
            {addLoading ? <span className="loading loading-spinner loading-xs"></span> : 'Küldés'}
          </button>
        </form>
        {addError && <div className="alert alert-error py-2 px-4 mb-2">{addError}</div>}
        <div className="text-base-content/50 text-sm">Nincs komment.</div>
      </div>
    )

  return (
    <div className="mt-8">
      <div className="divider my-4">Hozzászólások</div>
      <form className="flex gap-2 mb-4" onSubmit={handleAddComment}>
        <input
          className="input input-bordered flex-1"
          placeholder="Új komment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={addLoading}
        />
        <button className="btn btn-primary" type="submit" disabled={addLoading}>
          {addLoading ? <span className="loading loading-spinner loading-xs"></span> : 'Küldés'}
        </button>
      </form>
      {addError && <div className="alert alert-error py-2 px-4 mb-2">{addError}</div>}
      {error && <div className="alert alert-error py-2 px-4 mb-2">{error}</div>}
      <ul className="space-y-4">
        {comments.map((comment: any) => (
          <li key={comment.id} className="flex gap-3 items-start">
            {/* Avatar */}
            {comment.author?.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.username}
                className="w-8 h-8 rounded-full object-cover border-2 border-primary/30 shadow-sm"
              />
            ) : (
              <div className="avatar placeholder w-8 h-8">
                <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 flex items-center justify-center border-2 border-base-200">
                  <span className="text-sm font-bold">
                    {comment.author?.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-base-content">{comment.author?.username}</span>
                {isAdmin && (
                  <>
                    <button
                      className="btn btn-xs btn-error btn-outline ml-2"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteLoading === comment.id || editId === comment.id}
                    >
                      {deleteLoading === comment.id ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        'Törlés'
                      )}
                    </button>
                    <button
                      className="btn btn-xs btn-outline ml-2"
                      onClick={() => handleEdit(comment)}
                      disabled={editId === comment.id || deleteLoading === comment.id}
                    >
                      {editId === comment.id ? 'Szerkesztés...' : 'Szerkeszt'}
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                <span>{formatDateTimeHU(comment.createdAt)}</span>
                {isUpdated(comment) && (
                  <span className="italic text-info">
                    (módosítva: {formatDateTimeHU(comment.updatedAt)})
                  </span>
                )}
                {/* LikeButton a kommenthez */}
                <LikeButton
                  targetId={comment.id}
                  type="comment"
                  initialLiked={!!comment.likedByCurrentUser}
                  initialCount={comment._count?.likes ?? comment.likes?.length ?? 0}
                  disabled={editId === comment.id || deleteLoading === comment.id}
                />
              </div>
              {editId === comment.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="textarea textarea-bordered w-full"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    disabled={editLoading}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={() => handleEditSave(comment.id)}
                      disabled={editLoading}
                    >
                      {editLoading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        'Mentés'
                      )}
                    </button>
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={handleEditCancel}
                      disabled={editLoading}
                    >
                      Mégse
                    </button>
                  </div>
                  {editError && (
                    <div className="alert alert-error py-1 px-2 text-xs">{editError}</div>
                  )}
                </div>
              ) : (
                <div className="bg-base-200 rounded p-2.5 text-base-content/90 shadow-sm border border-base-300/50">
                  {comment.content}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

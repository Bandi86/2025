'use client'
import React, { useState } from 'react'
import { formatDateTimeHU } from '@/lib/format/date'
import axiosClient from '@/lib/axios/axios-config-client'

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
            {comment.author?.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="avatar placeholder w-8 h-8">
                <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {comment.author?.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="font-semibold text-base-content flex items-center gap-2">
                {comment.author?.username}
                {isAdmin && (
                  <button
                    className="btn btn-xs btn-error btn-outline ml-2"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleteLoading === comment.id}
                  >
                    {deleteLoading === comment.id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'Törlés'
                    )}
                  </button>
                )}
              </div>
              <div className="text-xs text-base-content/50 mb-1">
                {formatDateTimeHU(comment.createdAt)}
              </div>
              <div className="bg-base-200 rounded p-2 text-base-content/90">{comment.content}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

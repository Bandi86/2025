import { fetchAdminPostById } from '@/lib/admin/posts'
import { formatDateTimeHU } from '@/lib/format/date'
import { notFound } from 'next/navigation'
import React from 'react'
import PostComments from '@/components/admin/posts/PostComments'
import PostLikes from '@/components/admin/posts/PostLikes'
import Link from 'next/link'
import PostImageModal from '@/components/admin/posts/PostImageModal'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminPostDetailPage({ params }: Props) {
  const { id } = await params
  const post = await fetchAdminPostById(id)
  if (!post) return notFound()

  // Helper for placeholder avatar
  const renderAvatar = () => {
    if (post.author?.avatar) {
      return (
        <img
          src={post.author.avatar}
          alt={post.author.username}
          className="w-12 h-12 rounded-full object-cover"
        />
      )
    }
    return (
      <div className="avatar placeholder w-12 h-12">
        <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
          <span className="text-xl font-bold">
            {post.author?.username?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
      </div>
    )
  }

  // Helper for placeholder post image
  const renderPostImage = () => {
    if (post.imageurl) {
      return <PostImageModal imageUrl={post.imageurl} title={post.title} />
    }
    return (
      <div className="w-full max-h-96 h-60 bg-base-200 flex items-center justify-center rounded mb-4">
        <span className="text-4xl text-base-content/40">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7a4 4 0 00-4 4z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11l4 4 4-4" />
          </svg>
        </span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Vissza gomb és breadcrumb */}
      <div className="mb-4 flex items-center gap-4">
        <Link href="/admin/posts" className="btn btn-sm btn-ghost">
          ← Vissza a posztokhoz
        </Link>
        <span className="text-base-content/40">/</span>
        <span className="font-semibold text-base-content/70">{post.title}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bal oldal: Post tartalom */}
        <div>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h1 className="card-title text-3xl font-bold mb-2">{post.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                {renderAvatar()}
                <div>
                  <Link
                    href={`/admin/users/${post.author?.id}`}
                    className="font-semibold link link-primary hover:underline"
                  >
                    {post.author?.username}
                  </Link>
                  <div className="text-sm text-base-content/60">
                    {formatDateTimeHU(post.createdAt)}
                  </div>
                  {post.author?.email && (
                    <div className="text-xs text-base-content/40">{post.author.email}</div>
                  )}
                </div>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="badge badge-neutral">{post.category}</span>
                {post.tags &&
                  post.tags.length > 0 &&
                  post.tags.map((tag: any) => (
                    <span key={tag.id} className="badge badge-outline">
                      {tag.name}
                    </span>
                  ))}
              </div>
              {renderPostImage()}
              <div className="prose max-w-none mb-6">{post.content}</div>
              <div className="divider my-4">Meta</div>
              <div className="flex flex-wrap gap-4 text-sm text-base-content/60 mb-2">
                <span>Utoljára frissítve: {formatDateTimeHU(post.updatedAt)}</span>
                <span>Hozzászólások: {post._count?.comments ?? 0}</span>
                <span>Kedvelések: {post._count?.likes ?? 0}</span>
                <span>
                  ID: <span className="font-mono text-xs">{post.id}</span>
                </span>
                {post.slug && (
                  <span>
                    Slug: <span className="font-mono text-xs">{post.slug}</span>
                  </span>
                )}
                {post.status && (
                  <span>
                    Státusz: <span className="font-mono text-xs">{post.status}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Jobb oldal: Kommentek és Like-ok egy cardban, egymás alatt, görgethető */}
        <div>
          <div className="card bg-base-100 shadow-xl h-full flex flex-col">
            <div className="card-body flex-1 flex flex-col gap-6 p-4">
              <div className="flex-1 min-h-0 overflow-y-auto">
                <PostComments comments={post.comments} postId={post.id} isAdmin={true} />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <PostLikes likes={post.likes} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

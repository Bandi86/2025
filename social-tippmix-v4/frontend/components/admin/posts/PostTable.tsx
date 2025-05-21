'use client'

import { Post } from '@/types/posts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, Edit2, Trash2 } from 'lucide-react'
import { formatDateTimeHU } from '@/lib/format/date'

interface PostTableProps {
  posts: Post[]
}

export default function PostTable({ posts }: PostTableProps) {
  // Placeholder for delete modal logic
  const [postToDelete, setPostToDelete] = useState<Post | null>(null)

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadgeVariant = (): 'neutral' => 'neutral'

  return (
    <>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table w-full">
          <thead className="bg-base-200">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Author</th>
              <th className="p-4">Category</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
              <th className="p-4">Updated</th>
              <th className="p-4">Views</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-base-100/50">
                <td className="p-4">{post.title}</td>
                <td className="p-4">{post.author.username}</td>
                <td className="p-4">{post.category}</td>
                <td className="p-4">
                  <Badge variant={getStatusBadgeVariant()}>n/a</Badge>
                </td>
                <td className="p-4">{formatDateTimeHU(post.createdAt)}</td>
                <td className="p-4">{formatDateTimeHU(post.updatedAt)}</td>
                <td className="p-4">{post.views ?? 0}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <Link href={`/admin/posts/${post.id}`}>
                      <Button variant="ghost" dSize="sm" isSquare title="View Post">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </Link>
                    <Link href={`/admin/posts/${post.id}/edit`}>
                      <Button variant="ghost" dSize="sm" isSquare title="Edit Post">
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      dSize="sm"
                      isSquare
                      title="Delete Post"
                      onClick={() => setPostToDelete(post)}
                      className="hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* TODO: Add DeletePostModal when implemented */}
    </>
  )
}

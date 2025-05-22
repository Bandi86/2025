import PostControls from '@/components/admin/posts/PostControls'
import PostTable from '@/components/admin/posts/PostTable'
import { fetchAdminPosts } from '@/lib/api/posts'
import React from 'react'
import Pagination from '@/components/ui/Pagination'

function getSanitizedParams(searchParamsObj: { [key: string]: string | string[] }, keys: string[]) {
  const params: Record<string, any> = {}
  for (const key of keys) {
    const value = searchParamsObj[key]
    params[key] = Array.isArray(value) ? value[0] : value
  }
  return params
}

export default async function AdminPostsPage(props: {
  searchParams: { [key: string]: string | string[] }
}) {
  let searchParamsObj: { [key: string]: string | string[] } = {}
  if (typeof (props.searchParams as any)?.then === 'function') {
    searchParamsObj = await (props as any).searchParams
  } else {
    searchParamsObj = props.searchParams
  }
  const currentPage = Number(searchParamsObj.page) || 1
  const currentLimit = Number(searchParamsObj.limit) || 10
  const params = {
    page: currentPage,
    limit: currentLimit,
    ...getSanitizedParams(searchParamsObj, [
      'searchQuery',
      'sortBy',
      'categoryFilter',
      'statusFilter',
      'tagFilter'
    ])
  }

  // Fetch posts from the server
  const { posts, totalPages } = await fetchAdminPosts(params)
  const totalPosts = posts.length

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Manage Posts</h1>

      <PostControls currentParams={params} totalPosts={totalPosts} />

      {posts.length > 0 ? (
        <PostTable posts={posts} />
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">No posts found matching your criteria.</p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} currentParams={params} />
      )}
    </div>
  )
}

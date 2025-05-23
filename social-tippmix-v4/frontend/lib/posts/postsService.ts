import axiosClient from '@/lib/axios/axios-config-client'
import { Post, FetchPostsParams } from '@/types/posts'

export function mapFrontendToBackendParams(params: FetchPostsParams) {
  return {
    page: params.page,
    pageSize: params.limit,
    search: params.searchQuery,
    sort: params.sortBy,
    category: params.categoryFilter,
    status: params.statusFilter,
    tag: params.tagFilter
  } as Record<string, any>
}

export async function fetchPosts(params: FetchPostsParams) {
  const query = mapFrontendToBackendParams(params)
  Object.keys(query).forEach((k) => query[k] === undefined && delete query[k])
  const response = await axiosClient.get('/post', { params: query })
  return response.data
}

export async function fetchPostById(id: string) {
  const response = await axiosClient.get(`/post/${id}`)
  return response.data
}

export async function createPost(post: Partial<Post>) {
  const response = await axiosClient.post('/post', post)
  return response.data
}

export async function createPostFormData(formData: FormData) {
  const response = await axiosClient.post('/post', formData)
  return response.data
}

export async function updatePost(id: string, post: Partial<Post>) {
  await axiosClient.put(`/post/${id}`, post)
}

export async function deletePost(id: string) {
  await axiosClient.delete(`/post/${id}`)
}

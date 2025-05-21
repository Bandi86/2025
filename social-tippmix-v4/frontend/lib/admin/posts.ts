import { FetchPostsParams, PaginatedPostsResponse } from '@/types/posts'
import axiosServer from '../axios/axios-config-server'
import axiosClient from '../axios/axios-config-client'

function mapFrontendToBackendParams(params: FetchPostsParams) {
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

export async function fetchAdminPosts(
  params: FetchPostsParams = {}
): Promise<PaginatedPostsResponse> {
  const query = mapFrontendToBackendParams(params)
  Object.keys(query).forEach((k) => query[k] === undefined && delete query[k])
  try {
    const response = await axiosServer.get('/post', { params: query })
    const { posts, pagination } = response.data

    return {
      posts: posts || [],
      totalPosts: pagination?.total ?? 0,
      totalPages: pagination?.totalPages ?? 1,
      currentPage: pagination?.currentPage ?? 1
    }
  } catch (error: any) {
    // If 404 or no posts, return empty result instead of throwing
    if (error?.response?.status === 404) {
      return {
        posts: [],
        totalPosts: 0,
        totalPages: 1,
        currentPage: 1
      }
    }
    // Otherwise rethrow
    throw error
  }
}

// Fetch a single post by ID
export async function fetchAdminPostById(id: string): Promise<any | null> {
  try {
    const response = await axiosServer.get(`/post/${id}`)
    return response.data
  } catch (error) {
    return null
  }
}

// Általános poszt létrehozó API hívás, endpoint paraméterezhető
export async function createPost(postData: FormData, endpoint: string = 'post'): Promise<any> {
  try {
    // Ha FormData, ne állítsunk be content-type-ot, axios magától beállítja
    const response = await axiosClient.post(endpoint, postData)
    return response.data
  } catch (error) {
    console.error('Error creating post:', error)
    throw error
  }
}

// Admin wrapper
export async function createAdminPost(postData: FormData): Promise<any> {
  return createPost(postData, '/post')
}

// User wrapper (később használható)
export async function createUserPost(postData: FormData): Promise<any> {
  return createPost(postData, '/post')
}

// PUT - Update an existing post only the admin posts
export async function updateAdminPost(postId: string, postData: any): Promise<any> {
  try {
    const response = await axiosServer.put(`/post/${postId}`, postData)
    return response.data
  } catch (error) {
    console.error('Error updating post:', error)
    throw error
  }
}

// DELETE - Delete a post admin posts and users
export async function deleteAdminPost(postId: string): Promise<void> {
  try {
    await axiosServer.delete(`/post/${postId}`)
  } catch (error) {
    console.error('Error deleting post:', error)
    throw error
  }
}

// logged in users posts
export async function fetchUserPosts(
  params: FetchPostsParams = {}
): Promise<PaginatedPostsResponse> {
  try {
    const response = await axiosServer.get('/post/my', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching user posts:', error)
    throw error
  }
}

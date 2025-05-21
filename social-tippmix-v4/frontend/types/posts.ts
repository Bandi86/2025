export interface Post {
  id: string
  title: string
  content: string
  author: {
    id: string
    username: string
    avatar: string
  }
  createdAt: string // Or Date object, consider formatting needs
  updatedAt?: string
  status: string // e.g., 'published', 'draft', 'archived'
  category: string // e.g., 'sports', 'news', 'entertainment'
  tags: string[] // Array of tags associated with the post
  imageurl?: string // URL to the post's image
  likes?: number // Number of likes
  comments?: number // Number of comments
  shares?: number // Number of shares
  views?: number // Number of views
  isFeatured?: boolean // Whether the post is featured
  isPinned?: boolean // Whether the post is pinned
}

export interface FetchPostsParams {
  page?: number
  limit?: number
  searchQuery?: string
  categoryFilter?: string
  tagFilter?: string
  statusFilter?: string // e.g., 'published', 'draft', 'archived'
  sortBy?: string // e.g., 'createdAt_desc', 'likes_asc'
}

export interface PaginatedPostsResponse {
  posts: Post[]
  totalPosts: number
  totalPages: number
  currentPage: number
}

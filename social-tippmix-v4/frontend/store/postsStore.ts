import { createWithMiddleware } from './middleware'
import { Post, FetchPostsParams, PaginatedPostsResponse } from '@/types/posts'
import * as postsService from '@/lib/posts/postsService'

interface PostsStore {
  // Állapot
  posts: Post[]
  selectedPost: Post | null
  loading: boolean
  error: string | null
  pagination: {
    totalPosts: number
    totalPages: number
    currentPage: number
  }
  filters: FetchPostsParams

  // Akciók
  setPosts: (posts: Post[]) => void
  setSelectedPost: (post: Post | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPagination: (pagination: Partial<PostsStore['pagination']>) => void
  setFilters: (filters: Partial<FetchPostsParams>) => void
  clearError: () => void

  // Aszinkron akciók
  fetchPosts: () => Promise<void>
  fetchPostById: (id: string) => Promise<void>
  createPost: (post: Partial<Post>) => Promise<void>
  updatePost: (id: string, post: Partial<Post>) => Promise<void>
  deletePost: (id: string) => Promise<void>
}

// Segédfüggvény a frontend -> backend paraméterek mappelésére
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

export const usePostsStore = createWithMiddleware<PostsStore>(
  (set, get) => ({
    // Kezdeti állapot
    posts: [],
    selectedPost: null,
    loading: false,
    error: null,
    pagination: {
      totalPosts: 0,
      totalPages: 1,
      currentPage: 1
    },
    filters: {
      page: 1,
      limit: 10,
      sortBy: 'createdAt'
    },

    // Állapot beállító függvények
    setPosts: (posts) => set({ posts }),
    setSelectedPost: (post) => set({ selectedPost: post }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setPagination: (pagination) =>
      set((state) => ({
        pagination: { ...state.pagination, ...pagination }
      })),
    setFilters: (filters) =>
      set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
    clearError: () => set({ error: null }),

    // Aszinkron akciók
    fetchPosts: async () => {
      const { filters } = get()
      set({ loading: true, error: null })
      try {
        const { posts, pagination } = await postsService.fetchPosts(filters)
        set({
          posts: posts || [],
          pagination: {
            totalPosts: pagination?.total ?? 0,
            totalPages: pagination?.totalPages ?? 1,
            currentPage: pagination?.currentPage ?? 1
          },
          loading: false
        })
      } catch (error: any) {
        set({
          error: error.message || 'Hiba a posztok betöltésekor',
          loading: false
        })
      }
    },

    fetchPostById: async (id) => {
      set({ loading: true, error: null })
      try {
        const post = await postsService.fetchPostById(id)
        set({ selectedPost: post, loading: false })
      } catch (error: any) {
        set({
          error: error.message || `Hiba a(z) ${id} poszt betöltésekor`,
          loading: false
        })
      }
    },

    createPost: async (post) => {
      set({ loading: true, error: null })
      try {
        await postsService.createPost(post)
        get().fetchPosts()
      } catch (error: any) {
        set({
          error: error.message || 'Hiba a poszt létrehozásakor',
          loading: false
        })
      }
    },

    updatePost: async (id, post) => {
      set({ loading: true, error: null })
      try {
        await postsService.updatePost(id, post)
        const { selectedPost } = get()
        if (selectedPost && selectedPost.id === id) {
          const updated = await postsService.fetchPostById(id)
          set({ selectedPost: updated })
        }
        get().fetchPosts()
        set({ loading: false })
      } catch (error: any) {
        set({
          error: error.message || `Hiba a(z) ${id} poszt frissítésekor`,
          loading: false
        })
      }
    },

    deletePost: async (id) => {
      set({ loading: true, error: null })
      try {
        await postsService.deletePost(id)
        const { selectedPost } = get()
        if (selectedPost && selectedPost.id === id) {
          set({ selectedPost: null })
        }
        get().fetchPosts()
      } catch (error: any) {
        set({
          error: error.message || `Hiba a(z) ${id} poszt törlésekor`,
          loading: false
        })
      }
    }
  }),
  {
    name: 'posts-store',
    persist: true,
    devtools: true,
    // Csak a szűrőket és a kiválasztott oldalt tároljuk, a többi adatot újra betöltjük
    partialize: (state) => ({
      filters: state.filters,
      pagination: {
        totalPosts: state.pagination.totalPosts,
        totalPages: state.pagination.totalPages,
        currentPage: state.pagination.currentPage
      }
    })
  }
)

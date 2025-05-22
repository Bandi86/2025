import { createWithMiddleware } from './middleware'
import { Post, FetchPostsParams, PaginatedPostsResponse } from '@/types/posts'
import axiosClient from '@/lib/axios/axios-config-client'

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
      sortBy: 'createdAt_desc'
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
        const query = mapFrontendToBackendParams(filters)
        Object.keys(query).forEach((k) => query[k] === undefined && delete query[k])

        const response = await axiosClient.get('/post', { params: query })
        const { posts, pagination } = response.data

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
          error: error.response?.data?.message || error.message || 'Hiba a posztok betöltésekor',
          loading: false
        })
      }
    },

    fetchPostById: async (id) => {
      set({ loading: true, error: null })

      try {
        const response = await axiosClient.get(`/post/${id}`)
        set({ selectedPost: response.data, loading: false })
      } catch (error: any) {
        set({
          error:
            error.response?.data?.message || error.message || `Hiba a(z) ${id} poszt betöltésekor`,
          loading: false
        })
      }
    },

    createPost: async (post) => {
      set({ loading: true, error: null })

      try {
        await axiosClient.post('/post', post)
        // Újra betöltjük a posztokat az új értékekkel
        get().fetchPosts()
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Hiba a poszt létrehozásakor',
          loading: false
        })
      }
    },

    updatePost: async (id, post) => {
      set({ loading: true, error: null })

      try {
        await axiosClient.put(`/post/${id}`, post)
        // Frissítjük az aktuális posztot, ha az volt kiválasztva
        const { selectedPost } = get()
        if (selectedPost && selectedPost.id === id) {
          const response = await axiosClient.get(`/post/${id}`)
          set({ selectedPost: response.data })
        }
        // Újra betöltjük a posztokat is
        get().fetchPosts()
        set({ loading: false })
      } catch (error: any) {
        set({
          error:
            error.response?.data?.message || error.message || `Hiba a(z) ${id} poszt frissítésekor`,
          loading: false
        })
      }
    },

    deletePost: async (id) => {
      set({ loading: true, error: null })

      try {
        await axiosClient.delete(`/post/${id}`)
        // Ha a törölt poszt volt kiválasztva, akkor töröljük a kiválasztást
        const { selectedPost } = get()
        if (selectedPost && selectedPost.id === id) {
          set({ selectedPost: null })
        }
        // Újra betöltjük a posztokat
        get().fetchPosts()
      } catch (error: any) {
        set({
          error:
            error.response?.data?.message || error.message || `Hiba a(z) ${id} poszt törlésekor`,
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

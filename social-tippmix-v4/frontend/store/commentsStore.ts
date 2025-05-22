import { createWithMiddleware } from './middleware'
import axiosClient from '@/lib/axios/axios-config-client'

interface Comment {
  id: string
  content: string
  postId: string
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    likes: number
  }
}

interface CommentsStore {
  // State
  comments: Comment[]
  loading: boolean
  error: string | null
  totalComments: number
  totalPages: number
  currentPage: number

  // Actions
  setComments: (comments: Comment[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Async actions
  fetchComments: (postId: string, page?: number) => Promise<void>
  createComment: (comment: { postId: string; content: string }) => Promise<void>
  updateComment: (commentId: string, content: string) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  likeComment: (commentId: string) => Promise<void>
}

export const useCommentsStore = createWithMiddleware<CommentsStore>(
  (set, get) => ({
    // Initial state
    comments: [],
    loading: false,
    error: null,
    totalComments: 0,
    totalPages: 1,
    currentPage: 1,

    // Actions
    setComments: (comments) => set({ comments }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Async actions
    fetchComments: async (postId, page = 1) => {
      set({ loading: true, error: null })
      try {
        const response = await axiosClient.get(`/comments/${postId}`, {
          params: { page }
        })
        set({
          comments: response.data.comments,
          totalComments: response.data.total,
          totalPages: response.data.totalPages,
          currentPage: page,
          loading: false
        })
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Error fetching comments',
          loading: false
        })
      }
    },

    createComment: async ({ postId, content }) => {
      set({ loading: true, error: null })
      try {
        const response = await axiosClient.post(`/comments`, {
          postId,
          content
        })
        // Add new comment to state and update counts
        set((state) => ({
          comments: [...state.comments, response.data],
          totalComments: state.totalComments + 1,
          loading: false
        }))
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Error creating comment',
          loading: false
        })
      }
    },

    updateComment: async (commentId, content) => {
      set({ loading: true, error: null })
      try {
        const response = await axiosClient.put(`/comments/${commentId}`, { content })
        // Update comment in state
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId ? { ...c, content, updatedAt: response.data.updatedAt } : c
          ),
          loading: false
        }))
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Error updating comment',
          loading: false
        })
      }
    },

    deleteComment: async (commentId) => {
      set({ loading: true, error: null })
      try {
        await axiosClient.delete(`/comments/${commentId}`)
        // Remove comment from state and update counts
        set((state) => ({
          comments: state.comments.filter((c) => c.id !== commentId),
          totalComments: state.totalComments - 1,
          loading: false
        }))
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Error deleting comment',
          loading: false
        })
      }
    },

    likeComment: async (commentId) => {
      try {
        const response = await axiosClient.post(`/comments/${commentId}/like`)
        // Update like count in state
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId
              ? { ...c, _count: { likes: response.data.likes }, liked: response.data.liked }
              : c
          )
        }))
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Error liking comment'
        })
      }
    }
  }),
  {
    name: 'comments-store',
    persist: false, // No need to persist comments
    devtools: true
  }
)

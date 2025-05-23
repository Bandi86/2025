import { createWithMiddleware } from './middleware'
import axiosClient from '@/lib/axios/axios-config-client'
import * as commentsService from '@/lib/comments/commentsService'

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
        const data = await commentsService.fetchComments(postId, page)
        set({
          comments: data.comments,
          totalComments: data.total,
          totalPages: data.totalPages,
          currentPage: page,
          loading: false
        })
      } catch (error: any) {
        set({
          error: error.message || 'Error fetching comments',
          loading: false
        })
      }
    },

    createComment: async ({ postId, content }) => {
      set({ loading: true, error: null })
      try {
        const comment = await commentsService.createComment(postId, content)
        set((state) => ({
          comments: [...state.comments, comment],
          totalComments: state.totalComments + 1,
          loading: false
        }))
      } catch (error: any) {
        set({
          error: error.message || 'Error creating comment',
          loading: false
        })
      }
    },

    updateComment: async (commentId, content) => {
      set({ loading: true, error: null })
      try {
        const updated = await commentsService.updateComment(commentId, content)
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId ? { ...c, content, updatedAt: updated.updatedAt } : c
          ),
          loading: false
        }))
      } catch (error: any) {
        set({
          error: error.message || 'Error updating comment',
          loading: false
        })
      }
    },

    deleteComment: async (commentId) => {
      set({ loading: true, error: null })
      try {
        await commentsService.deleteComment(commentId)
        set((state) => ({
          comments: state.comments.filter((c) => c.id !== commentId),
          totalComments: state.totalComments - 1,
          loading: false
        }))
      } catch (error: any) {
        set({
          error: error.message || 'Error deleting comment',
          loading: false
        })
      }
    },

    likeComment: async (commentId) => {
      try {
        const data = await commentsService.likeComment(commentId)
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId ? { ...c, _count: { likes: data.likes }, liked: data.liked } : c
          )
        }))
      } catch (error: any) {
        set({
          error: error.message || 'Error liking comment'
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

import { createWithMiddleware } from './middleware'
import axiosClient from '@/lib/axios/axios-config-client'
import * as likesService from '@/lib/likes/likesService'

interface Like {
  id: string
  userId: string
  targetId: string // Can be postId or commentId
  targetType: 'post' | 'comment'
  createdAt: string
}

interface LikesStore {
  // State
  likes: Like[]
  loading: boolean
  error: string | null

  // Actions
  setLikes: (likes: Like[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Async actions
  fetchLikes: (targetId: string, targetType: 'post' | 'comment') => Promise<void>
  toggleLike: (targetId: string, targetType: 'post' | 'comment') => Promise<void>
  getUserLikes: (userId: string) => Promise<void>
}

export const useLikesStore = createWithMiddleware<LikesStore>(
  (set, get) => ({
    // Initial state
    likes: [],
    loading: false,
    error: null,

    // Actions
    setLikes: (likes) => set({ likes }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Async actions
    fetchLikes: async (targetId, targetType) => {
      set({ loading: true, error: null })
      try {
        const data = await likesService.fetchLikes(targetId, targetType)
        set({ likes: data.likes, loading: false })
      } catch (error: any) {
        set({
          error: error.message || 'Error fetching likes',
          loading: false
        })
      }
    },

    toggleLike: async (targetId, targetType) => {
      try {
        const data = await likesService.toggleLike(targetId, targetType)
        set((state) => {
          const existingLike = state.likes.find((l) => l.targetId === targetId)
          if (existingLike) {
            return {
              likes: state.likes.filter((l) => l.targetId !== targetId)
            }
          }
          return {
            likes: [...state.likes, data]
          }
        })
      } catch (error: any) {
        set({
          error: error.message || 'Error toggling like'
        })
      }
    },

    getUserLikes: async (userId) => {
      set({ loading: true, error: null })
      try {
        const data = await likesService.getUserLikes(userId)
        set({ likes: data.likes, loading: false })
      } catch (error: any) {
        set({
          error: error.message || 'Error fetching user likes',
          loading: false
        })
      }
    }
  }),
  {
    name: 'likes-store',
    persist: false,
    devtools: true
  }
)

import { createWithMiddleware } from './middleware'
import axiosClient from '@/lib/axios/axios-config-client'

interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: string
}

interface FollowsStore {
  // State
  followers: Follow[]
  following: Follow[]
  loading: boolean
  error: string | null
  counts: {
    followers: number
    following: number
  }

  // Actions
  setFollowers: (followers: Follow[]) => void
  setFollowing: (following: Follow[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Async actions
  fetchFollowers: (userId: string) => Promise<void>
  fetchFollowing: (userId: string) => Promise<void>
  toggleFollow: (userId: string) => Promise<void>
  checkFollowStatus: (userId: string) => Promise<boolean>
}

export const useFollowsStore = createWithMiddleware<FollowsStore>(
  (set, get) => ({
    // Initial state
    followers: [],
    following: [],
    loading: false,
    error: null,
    counts: {
      followers: 0,
      following: 0
    },

    // Actions
    setFollowers: (followers) =>
      set((state) => ({
        followers,
        counts: { ...state.counts, followers: followers.length }
      })),
    setFollowing: (following) =>
      set((state) => ({
        following,
        counts: { ...state.counts, following: following.length }
      })),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Async actions
    fetchFollowers: async (userId) => {
      set({ loading: true, error: null })
      try {
        const response = await axiosClient.get(`/users/${userId}/followers`)
        set((state) => ({
          followers: response.data.followers,
          counts: {
            ...state.counts,
            followers: response.data.followers.length
          },
          loading: false
        }))
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Error fetching followers',
          loading: false
        })
      }
    },

    fetchFollowing: async (userId) => {
      set({ loading: true, error: null })
      try {
        const response = await axiosClient.get(`/users/${userId}/following`)
        set((state) => ({
          following: response.data.following,
          counts: {
            ...state.counts,
            following: response.data.following.length
          },
          loading: false
        }))
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Error fetching following',
          loading: false
        })
      }
    },

    toggleFollow: async (userId) => {
      try {
        const response = await axiosClient.post(`/users/${userId}/follow`)
        const isFollowing = response.data.following

        set((state) => {
          if (isFollowing) {
            // Add to following list
            return {
              following: [...state.following, response.data],
              counts: {
                ...state.counts,
                following: state.counts.following + 1
              }
            }
          }
          // Remove from following list
          return {
            following: state.following.filter((f) => f.followingId !== userId),
            counts: {
              ...state.counts,
              following: state.counts.following - 1
            }
          }
        })
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Error toggling follow'
        })
      }
    },

    checkFollowStatus: async (userId) => {
      try {
        const response = await axiosClient.get(`/users/${userId}/follow-status`)
        return response.data.following
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Error checking follow status'
        })
        return false
      }
    }
  }),
  {
    name: 'follows-store',
    persist: false,
    devtools: true
  }
)

import { createWithMiddleware } from './middleware'
import axiosClient from '@/lib/axios/axios-config-client'
import * as sessionsService from '@/lib/sessions/sessionsService'

interface Session {
  id: string
  userId: string
  userAgent: string
  lastActive: string
  createdAt: string
  expiresAt: string
  isActive: boolean
}

interface SessionsStore {
  // State
  sessions: Session[]
  loading: boolean
  error: string | null
  currentSession: Session | null

  // Actions
  setSessions: (sessions: Session[]) => void
  setCurrentSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Async actions
  fetchSessions: () => Promise<void>
  fetchCurrentSession: () => Promise<void>
  terminateSession: (sessionId: string) => Promise<void>
  terminateAllOtherSessions: () => Promise<void>
}

export const useSessionsStore = createWithMiddleware<SessionsStore>(
  (set, get) => ({
    // Initial state
    sessions: [],
    loading: false,
    error: null,
    currentSession: null,

    // Actions
    setSessions: (sessions) => set({ sessions }),
    setCurrentSession: (session) => set({ currentSession: session }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Async actions
    fetchSessions: async () => {
      set({ loading: true, error: null })
      try {
        const data = await sessionsService.fetchSessions()
        set({
          sessions: data.sessions,
          loading: false
        })
      } catch (error: any) {
        set({
          error: error.message || 'Error fetching sessions',
          loading: false
        })
      }
    },

    fetchCurrentSession: async () => {
      set({ loading: true, error: null })
      try {
        const data = await sessionsService.fetchCurrentSession()
        set({
          currentSession: data,
          loading: false
        })
      } catch (error: any) {
        set({
          error: error.message || 'Error fetching current session',
          loading: false
        })
      }
    },

    terminateSession: async (sessionId) => {
      try {
        await sessionsService.terminateSession(sessionId)
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId)
        }))
      } catch (error: any) {
        set({
          error: error.message || 'Error terminating session'
        })
      }
    },

    terminateAllOtherSessions: async () => {
      try {
        await sessionsService.terminateAllOtherSessions()
        const currentSession = get().currentSession
        set((state) => ({
          sessions: currentSession ? [currentSession] : []
        }))
      } catch (error: any) {
        set({
          error: error.message || 'Error terminating other sessions'
        })
      }
    }
  }),
  {
    name: 'sessions-store',
    persist: false, // Don't persist session data for security
    devtools: true
  }
)

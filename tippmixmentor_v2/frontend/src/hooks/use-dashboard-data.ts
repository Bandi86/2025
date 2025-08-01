import { useState, useEffect } from 'react'
import { DashboardDataService, LiveMatch, Prediction, StatData, AgentData } from '@/lib/api/dashboard-data'

interface DashboardData {
  liveMatches: LiveMatch[]
  predictions: Prediction[]
  stats: StatData[]
  agents: AgentData[]
  loading: boolean
  error: string | null
}

export function useDashboardData(refreshInterval = 30000) {
  const [data, setData] = useState<DashboardData>({
    liveMatches: [],
    predictions: [],
    stats: [],
    agents: [],
    loading: true,
    error: null
  })

  const fetchData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))
      
      const result = await DashboardDataService.getAllDashboardData()
      
      setData({
        ...result,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch dashboard data'
      }))
    }
  }

  const refreshData = () => {
    fetchData()
  }

  useEffect(() => {
    fetchData()

    // Set up auto-refresh
    const interval = setInterval(fetchData, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return {
    ...data,
    refreshData
  }
}

// Individual hooks for specific data types
export function useLiveMatches(refreshInterval = 30000) {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await DashboardDataService.getLiveMatches()
      setMatches(data)
    } catch (error) {
      console.error('Error fetching live matches:', error)
      setError('Failed to fetch live matches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
    const interval = setInterval(fetchMatches, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  return { matches, loading, error, refreshMatches: fetchMatches }
}

export function usePredictions(refreshInterval = 60000) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPredictions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await DashboardDataService.getRecentPredictions()
      setPredictions(data)
    } catch (error) {
      console.error('Error fetching predictions:', error)
      setError('Failed to fetch predictions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPredictions()
    const interval = setInterval(fetchPredictions, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  return { predictions, loading, error, refreshPredictions: fetchPredictions }
}

export function useAgentStatus(refreshInterval = 60000) {
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await DashboardDataService.getAgentStatus()
      setAgents(data)
    } catch (error) {
      console.error('Error fetching agent status:', error)
      setError('Failed to fetch agent status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  return { agents, loading, error, refreshAgents: fetchAgents }
} 
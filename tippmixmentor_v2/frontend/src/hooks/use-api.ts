import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Health and Metrics hooks
export function useHealthStatus() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.getHealth(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 3,
  });
}

// Debug hook to test authentication
export function useTestAuth() {
  return useQuery({
    queryKey: ['test-auth'],
    queryFn: () => apiClient.testAuth(),
    retry: 1,
    enabled: false, // Don't run automatically
  });
}

export function usePerformanceMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiClient.getMetrics(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
  });
}

// User hooks
export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiClient.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<any>) => apiClient.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}

// Prediction hooks
export function usePredictions(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['predictions', params],
    queryFn: () => apiClient.getPredictions(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createPrediction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-stats'] });
    },
  });
}

export function usePredictionStats() {
  return useQuery({
    queryKey: ['prediction-stats'],
    queryFn: () => apiClient.getPredictionStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function usePredictionAccuracy() {
  return useQuery({
    queryKey: ['prediction-accuracy'],
    queryFn: () => apiClient.getPredictionAccuracy(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// Match hooks
export function useMatches(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['matches', params],
    queryFn: () => apiClient.getMatches(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
}

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: () => apiClient.getMatch(matchId),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    enabled: !!matchId,
  });
}

// Analytics hooks
export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => apiClient.getAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useUserPerformance() {
  return useQuery({
    queryKey: ['user-performance'],
    queryFn: () => apiClient.getUserPerformance(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

export function useModelPerformance() {
  return useQuery({
    queryKey: ['model-performance'],
    queryFn: () => apiClient.getModelPerformance(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// ML Service hooks
export function useMLServiceStatus() {
  return useQuery({
    queryKey: ['ml-service-status'],
    queryFn: () => apiClient.getMLServiceStatus(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 3,
  });
}

export function useModelInfo() {
  return useQuery({
    queryKey: ['model-info'],
    queryFn: () => apiClient.getModelInfo(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

export function useModelStatus() {
  return useQuery({
    queryKey: ['model-status'],
    queryFn: () => apiClient.getModelStatus(),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
}

export function useTrainModels() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.trainModels(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-status'] });
      queryClient.invalidateQueries({ queryKey: ['model-info'] });
    },
  });
}

export function useBatchPredict() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (matchIds: string[]) => apiClient.batchPredict(matchIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-stats'] });
    },
  });
}

// Live data hooks
export function useLiveMatches() {
  return useQuery({
    queryKey: ['live-matches'],
    queryFn: () => apiClient.getLiveMatches(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
  });
}

export function useLiveMatchData(matchId: string) {
  return useQuery({
    queryKey: ['live-match-data', matchId],
    queryFn: () => apiClient.getLiveMatchData(matchId),
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    retry: 2,
    enabled: !!matchId,
  });
}

// Enhanced prediction hooks
export function useMatchPrediction(matchId: string) {
  return useQuery({
    queryKey: ['match-prediction', matchId],
    queryFn: () => apiClient.getMatchPrediction(matchId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    enabled: !!matchId,
  });
}

export function useAIInsights(matchId: string) {
  return useQuery({
    queryKey: ['ai-insights', matchId],
    queryFn: () => apiClient.getAIInsights(matchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!matchId,
  });
}

export function useAgentPrediction(matchId: string, agentId?: string) {
  return useQuery({
    queryKey: ['agent-prediction', matchId, agentId],
    queryFn: () => apiClient.getAgentPrediction(matchId, agentId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    enabled: !!matchId,
  });
}

export function useEnhancedInsights(matchId: string, insightType: string = 'comprehensive') {
  return useQuery({
    queryKey: ['enhanced-insights', matchId, insightType],
    queryFn: () => apiClient.getEnhancedInsights(matchId, insightType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!matchId,
  });
}

export function useTeamAnalysis(teamId: string, analysisType: string = 'comprehensive') {
  return useQuery({
    queryKey: ['team-analysis', teamId, analysisType],
    queryFn: () => apiClient.getTeamAnalysis(teamId, analysisType),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: !!teamId,
  });
}

export function usePredictionTrends(timePeriod: string = '7d', trendType: string = 'general') {
  return useQuery({
    queryKey: ['prediction-trends', timePeriod, trendType],
    queryFn: () => apiClient.getPredictionTrends(timePeriod, trendType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useUserPredictions(userId: string, limit?: number) {
  return useQuery({
    queryKey: ['user-predictions', userId, limit],
    queryFn: () => apiClient.getUserPredictions(userId, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    enabled: !!userId,
  });
}

// Agents hooks
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.getAgents(),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
}

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => apiClient.getAgent(agentId),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    enabled: !!agentId,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (agentData: any) => apiClient.createAgent(agentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ agentId, agentData }: { agentId: string; agentData: any }) => 
      apiClient.updateAgent(agentId, agentData),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (agentId: string) => apiClient.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useStartAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (agentId: string) => apiClient.startAgent(agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    },
  });
}

export function useStopAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (agentId: string) => apiClient.stopAgent(agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    },
  });
}

export function useAgentStatus(agentId: string) {
  return useQuery({
    queryKey: ['agent-status', agentId],
    queryFn: () => apiClient.getAgentStatus(agentId),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
    enabled: !!agentId,
  });
}

export function useAgentHealth(agentId: string) {
  return useQuery({
    queryKey: ['agent-health', agentId],
    queryFn: () => apiClient.getAgentHealth(agentId),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
    enabled: !!agentId,
  });
}

export function useAgentTasks(agentId: string, limit?: number, offset?: number) {
  return useQuery({
    queryKey: ['agent-tasks', agentId, limit, offset],
    queryFn: () => apiClient.getAgentTasks(agentId, limit, offset),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
    enabled: !!agentId,
  });
}

export function useAgentInsights(agentId: string, limit?: number, offset?: number) {
  return useQuery({
    queryKey: ['agent-insights', agentId, limit, offset],
    queryFn: () => apiClient.getAgentInsights(agentId, limit, offset),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    enabled: !!agentId,
  });
}

export function useAgentEvents(agentId: string, limit?: number, offset?: number) {
  return useQuery({
    queryKey: ['agent-events', agentId, limit, offset],
    queryFn: () => apiClient.getAgentEvents(agentId, limit, offset),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    enabled: !!agentId,
  });
}

export function useAgentPerformance(agentId: string) {
  return useQuery({
    queryKey: ['agent-performance', agentId],
    queryFn: () => apiClient.getAgentPerformance(agentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!agentId,
  });
}

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: () => apiClient.getIntegrations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Notification hooks
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.getNotifications(),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) => apiClient.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Utility hook for checking if any query is loading
export function useIsAnyQueryLoading() {
  // This is a simplified version - in a real app you might want to track specific queries
  return false;
}

// Utility hook for checking if any query has errors
export function useHasAnyQueryError() {
  // This is a simplified version - in a real app you might want to track specific queries
  return false;
}

// Simple API hook for social components
export function useApi() {
  const api = {
    get: async <T>(url: string): Promise<{ data: T }> => {
      const response = await fetch(`/api${url}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('API request failed');
      }
      const data = await response.json();
      return { data };
    },
    post: async <T>(url: string, body?: any): Promise<{ data: T }> => {
      const response = await fetch(`/api${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        throw new Error('API request failed');
      }
      const data = await response.json();
      return { data };
    },
    put: async <T>(url: string, body?: any): Promise<{ data: T }> => {
      const response = await fetch(`/api${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        throw new Error('API request failed');
      }
      const data = await response.json();
      return { data };
    },
    delete: async (url: string): Promise<void> => {
      const response = await fetch(`/api${url}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('API request failed');
      }
    },
  };

  return { api };
} 
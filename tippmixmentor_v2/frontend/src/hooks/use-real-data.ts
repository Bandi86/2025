import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useApiError } from './use-api-error';

// Predictions hooks
export function usePredictions(params?: Record<string, any>) {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['predictions', params],
    queryFn: () => apiClient.getPredictions(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    onError: (error: unknown) => handleError(error, 'usePredictions'),
  } as any);
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();
  const { handleError, handleValidationError } = useApiError();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createPrediction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-stats'] });
    },
    onError: (error: any) => {
      if (error?.status === 400) {
        handleValidationError(error);
      } else {
        handleError(error, 'useCreatePrediction');
      }
    },
  });
}

export function usePredictionStats() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['prediction-stats'],
    queryFn: () => apiClient.getPredictionStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (error: unknown) => handleError(error, 'usePredictionStats'),
  } as any);
}

// Matches hooks
export function useMatches(params?: Record<string, any>) {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['matches', params],
    queryFn: () => apiClient.getMatches(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useMatches'),
  } as any);
}

export function useMatch(matchId: string) {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: () => apiClient.getMatch(matchId),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    enabled: !!matchId,
    onError: (error: unknown) => handleError(error, 'useMatch'),
  } as any);
}

// Live matches hooks
export function useLiveMatches() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['live-matches'],
    queryFn: () => apiClient.getLiveMatches(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useLiveMatches'),
  } as any);
}

export function useLiveMatchData(matchId: string) {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['live-match-data', matchId],
    queryFn: () => apiClient.getLiveMatchData(matchId),
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    retry: 2,
    enabled: !!matchId,
    onError: (error: unknown) => handleError(error, 'useLiveMatchData'),
  } as any);
}

// Analytics hooks
export function useAnalytics() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => apiClient.getAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useAnalytics'),
  } as any);
}

export function useUserPerformance() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['user-performance'],
    queryFn: () => apiClient.getUserPerformance(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useUserPerformance'),
  } as any);
}

export function useModelPerformance() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['model-performance'],
    queryFn: () => apiClient.getModelPerformance(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useModelPerformance'),
  } as any);
}

// ML Service hooks
export function useMLServiceStatus() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['ml-service-status'],
    queryFn: () => apiClient.getMLServiceStatus(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useMLServiceStatus'),
  } as any);
}

export function useModelInfo() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['model-info'],
    queryFn: () => apiClient.getModelInfo(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useModelInfo'),
  } as any);
}

export function useTrainModels() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();
  
  return useMutation({
    mutationFn: () => apiClient.trainModels(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-info'] });
      queryClient.invalidateQueries({ queryKey: ['model-performance'] });
    },
    onError: (error) => handleError(error, 'useTrainModels'),
  });
}

// Agents hooks
export function useAgents() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.getAgents(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useAgents'),
  } as any);
}

export function useAgent(agentId: string) {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => apiClient.getAgent(agentId),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
    enabled: !!agentId,
    onError: (error: unknown) => handleError(error, 'useAgent'),
  } as any);
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  const { handleError, handleValidationError } = useApiError();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (error: any) => {
      if (error?.status === 400) {
        handleValidationError(error);
      } else {
        handleError(error, 'useCreateAgent');
      }
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const { handleError, handleValidationError } = useApiError();
  
  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: string; data: any }) =>
      apiClient.updateAgent(agentId, data),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    },
    onError: (error: any) => {
      if (error?.status === 400) {
        handleValidationError(error);
      } else {
        handleError(error, 'useUpdateAgent');
      }
    },
  });
}

export function useStartAgent() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();
  
  return useMutation({
    mutationFn: (agentId: string) => apiClient.startAgent(agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    },
    onError: (error) => handleError(error, 'useStartAgent'),
  });
}

export function useStopAgent() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();
  
  return useMutation({
    mutationFn: (agentId: string) => apiClient.stopAgent(agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    },
    onError: (error) => handleError(error, 'useStopAgent'),
  });
}

// Health and metrics hooks
export function useHealthStatus() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.getHealth(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useHealthStatus'),
  } as any);
}

export function usePerformanceMetrics() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['performance-metrics'],
    queryFn: () => apiClient.getMetrics(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
    onError: (error: unknown) => handleError(error, 'usePerformanceMetrics'),
  } as any);
}

// Notifications hooks
export function useNotifications() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.getNotifications(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useNotifications'),
  } as any);
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();
  
  return useMutation({
    mutationFn: (notificationId: string) => apiClient.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: unknown) => handleError(error, 'useMarkNotificationAsRead'),
  });
} 
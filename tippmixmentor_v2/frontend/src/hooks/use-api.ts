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
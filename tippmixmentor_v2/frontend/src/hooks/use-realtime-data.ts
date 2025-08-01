import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useApiError } from './use-api-error';

// Real-time data hooks
export function useRealtimeMatches() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['realtime-matches'],
    queryFn: () => apiClient.getLiveMatches(),
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useRealtimeMatches'),
  } as any);
}

export function useRealtimeMatchData(matchId: string) {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['realtime-match-data', matchId],
    queryFn: () => apiClient.getLiveMatchData(matchId),
    staleTime: 2 * 1000, // 2 seconds
    refetchInterval: 5 * 1000, // Refetch every 5 seconds
    retry: 2,
    enabled: !!matchId,
    onError: (error: unknown) => handleError(error, 'useRealtimeMatchData'),
  } as any);
}

export function useRealtimePredictions() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['realtime-predictions'],
    queryFn: () => apiClient.getPredictions(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useRealtimePredictions'),
  } as any);
}

export function useRealtimeAgentStatus() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['realtime-agent-status'],
    queryFn: () => apiClient.getAgents(),
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useRealtimeAgentStatus'),
  } as any);
}

export function useRealtimeHealthStatus() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['realtime-health'],
    queryFn: () => apiClient.getHealth(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useRealtimeHealthStatus'),
  } as any);
}

export function useRealtimePerformanceMetrics() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['realtime-performance'],
    queryFn: () => apiClient.getMetrics(),
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useRealtimePerformanceMetrics'),
  } as any);
}

export function useRealtimeNotifications() {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['realtime-notifications'],
    queryFn: () => apiClient.getNotifications(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
    onError: (error: unknown) => handleError(error, 'useRealtimeNotifications'),
  } as any);
}

// Real-time mutations
export function useMarkNotificationAsReadRealtime() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();
  
  return useMutation({
    mutationFn: (notificationId: string) => apiClient.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realtime-notifications'] });
    },
    onError: (error: unknown) => handleError(error, 'useMarkNotificationAsReadRealtime'),
  });
}

export function useStartAgentRealtime() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();
  
  return useMutation({
    mutationFn: (agentId: string) => apiClient.startAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realtime-agent-status'] });
    },
    onError: (error: unknown) => handleError(error, 'useStartAgentRealtime'),
  });
}

export function useStopAgentRealtime() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();
  
  return useMutation({
    mutationFn: (agentId: string) => apiClient.stopAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realtime-agent-status'] });
    },
    onError: (error: unknown) => handleError(error, 'useStopAgentRealtime'),
  });
} 
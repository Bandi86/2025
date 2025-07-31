import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './use-websocket';
import { useApiError } from './use-api-error';

interface RealtimeMatchData {
  matchId: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  events: Array<{
    type: 'goal' | 'card' | 'substitution' | 'other';
    minute: number;
    description: string;
  }>;
}

interface RealtimePredictionUpdate {
  predictionId: string;
  confidence: number;
  status: 'pending' | 'correct' | 'incorrect';
  updatedAt: string;
}

interface RealtimeAgentUpdate {
  agentId: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  lastActivity: string;
  currentTask?: string;
  performance: {
    accuracy: number;
    predictionsMade: number;
    successRate: number;
  };
}

export function useRealtimeMatches() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();
  const subscribedMatches = useRef<Set<string>>(new Set());

  const { isConnected, sendMessage, lastMessage } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'matchUpdate') {
        const matchData: RealtimeMatchData = message.data;
        
        // Update the specific match in the cache
        queryClient.setQueryData(['live-match-data', matchData.matchId], matchData);
        
        // Invalidate live matches list to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['live-matches'] });
      }
    },
    onError: (error) => {
      handleError(error, 'useRealtimeMatches');
    },
  });

  const subscribeToMatch = useCallback((matchId: string) => {
    if (isConnected && !subscribedMatches.current.has(matchId)) {
      sendMessage('subscribeToMatch', { matchId });
      subscribedMatches.current.add(matchId);
    }
  }, [isConnected, sendMessage]);

  const unsubscribeFromMatch = useCallback((matchId: string) => {
    if (isConnected && subscribedMatches.current.has(matchId)) {
      sendMessage('unsubscribeFromMatch', { matchId });
      subscribedMatches.current.delete(matchId);
    }
  }, [isConnected, sendMessage]);

  const subscribeToAllMatches = useCallback(() => {
    if (isConnected) {
      sendMessage('subscribeToAllMatches', {});
    }
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    subscribeToMatch,
    unsubscribeFromMatch,
    subscribeToAllMatches,
    lastMessage,
  };
}

export function useRealtimePredictions() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();

  const { isConnected, sendMessage, lastMessage } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'predictionUpdate') {
        const predictionUpdate: RealtimePredictionUpdate = message.data;
        
        // Update the specific prediction in the cache
        queryClient.setQueryData(['prediction', predictionUpdate.predictionId], (old: any) => ({
          ...old,
          ...predictionUpdate,
        }));
        
        // Invalidate predictions list to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['predictions'] });
        queryClient.invalidateQueries({ queryKey: ['prediction-stats'] });
      }
    },
    onError: (error) => {
      handleError(error, 'useRealtimePredictions');
    },
  });

  const subscribeToPrediction = useCallback((predictionId: string) => {
    if (isConnected) {
      sendMessage('subscribeToPrediction', { predictionId });
    }
  }, [isConnected, sendMessage]);

  const subscribeToUserPredictions = useCallback((userId: string) => {
    if (isConnected) {
      sendMessage('subscribeToUserPredictions', { userId });
    }
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    subscribeToPrediction,
    subscribeToUserPredictions,
    lastMessage,
  };
}

export function useRealtimeAgents() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();
  const subscribedAgents = useRef<Set<string>>(new Set());

  const { isConnected, sendMessage, lastMessage } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'agentUpdate') {
        const agentUpdate: RealtimeAgentUpdate = message.data;
        
        // Update the specific agent in the cache
        queryClient.setQueryData(['agent', agentUpdate.agentId], (old: any) => ({
          ...old,
          ...agentUpdate,
        }));
        
        // Invalidate agents list to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['agents'] });
      }
    },
    onError: (error) => {
      handleError(error, 'useRealtimeAgents');
    },
  });

  const subscribeToAgent = useCallback((agentId: string) => {
    if (isConnected && !subscribedAgents.current.has(agentId)) {
      sendMessage('subscribeToAgent', { agentId });
      subscribedAgents.current.add(agentId);
    }
  }, [isConnected, sendMessage]);

  const unsubscribeFromAgent = useCallback((agentId: string) => {
    if (isConnected && subscribedAgents.current.has(agentId)) {
      sendMessage('unsubscribeFromAgent', { agentId });
      subscribedAgents.current.delete(agentId);
    }
  }, [isConnected, sendMessage]);

  const subscribeToAllAgents = useCallback(() => {
    if (isConnected) {
      sendMessage('subscribeToAllAgents', {});
    }
  }, [isConnected, sendMessage]);

  const sendAgentCommand = useCallback((agentId: string, command: string, data?: any) => {
    if (isConnected) {
      sendMessage('agentCommand', { agentId, command, data });
    }
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    subscribeToAgent,
    unsubscribeFromAgent,
    subscribeToAllAgents,
    sendAgentCommand,
    lastMessage,
  };
}

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();

  const { isConnected, sendMessage, lastMessage } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'notification') {
        // Invalidate notifications to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    },
    onError: (error) => {
      handleError(error, 'useRealtimeNotifications');
    },
  });

  const subscribeToNotifications = useCallback((userId: string) => {
    if (isConnected) {
      sendMessage('subscribeToNotifications', { userId });
    }
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    subscribeToNotifications,
    lastMessage,
  };
}

export function useRealtimeAnalytics() {
  const queryClient = useQueryClient();
  const { handleError } = useApiError();

  const { isConnected, sendMessage, lastMessage } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'analyticsUpdate') {
        // Invalidate analytics queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['user-performance'] });
        queryClient.invalidateQueries({ queryKey: ['model-performance'] });
      }
    },
    onError: (error) => {
      handleError(error, 'useRealtimeAnalytics');
    },
  });

  const subscribeToAnalytics = useCallback(() => {
    if (isConnected) {
      sendMessage('subscribeToAnalytics', {});
    }
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    subscribeToAnalytics,
    lastMessage,
  };
}

// Combined real-time hook for dashboard
export function useRealtimeDashboard() {
  const matches = useRealtimeMatches();
  const predictions = useRealtimePredictions();
  const agents = useRealtimeAgents();
  const notifications = useRealtimeNotifications();
  const analytics = useRealtimeAnalytics();

  const isConnected = matches.isConnected && 
                     predictions.isConnected && 
                     agents.isConnected && 
                     notifications.isConnected && 
                     analytics.isConnected;

  return {
    isConnected,
    matches,
    predictions,
    agents,
    notifications,
    analytics,
  };
} 
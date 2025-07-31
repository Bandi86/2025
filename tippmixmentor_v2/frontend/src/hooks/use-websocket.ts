import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketContext } from '@/components/providers';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const wsContext = useWebSocketContext();
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // Use refs to store callbacks to prevent dependency changes
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onErrorRef.current = onError;
  }, [onMessage, onConnect, onDisconnect, onError]);

  // Subscribe to WebSocket messages
  useEffect(() => {
    const unsubscribe = wsContext.subscribe((message) => {
      setLastMessage(message);
      onMessageRef.current?.(message);
    });

    return unsubscribe;
  }, [wsContext]);

  // Subscribe to WebSocket errors
  useEffect(() => {
    const unsubscribe = wsContext.subscribeToError((error) => {
      onErrorRef.current?.(error);
    });

    return unsubscribe;
  }, [wsContext]);

  const sendMessage = useCallback((event: string, data: any) => {
    wsContext.sendMessage(event, data);
  }, [wsContext]);

  const subscribeToMatch = useCallback((matchId: string) => {
    sendMessage('subscribeToMatch', { matchId });
  }, [sendMessage]);

  const unsubscribeFromMatch = useCallback((matchId: string) => {
    sendMessage('unsubscribeFromMatch', { matchId });
  }, [sendMessage]);

  const getLiveMatches = useCallback(() => {
    sendMessage('getLiveMatches', {});
  }, [sendMessage]);

  const getUpcomingMatches = useCallback((limit?: number) => {
    sendMessage('getUpcomingMatches', { limit });
  }, [sendMessage]);

  return {
    isConnected: wsContext.isConnected,
    isConnecting: wsContext.isConnecting,
    error: wsContext.error,
    lastMessage,
    connect: () => {}, // No-op since connection is managed by context
    disconnect: () => {}, // No-op since connection is managed by context
    sendMessage,
    subscribeToMatch,
    unsubscribeFromMatch,
    getLiveMatches,
    getUpcomingMatches,
  };
} 